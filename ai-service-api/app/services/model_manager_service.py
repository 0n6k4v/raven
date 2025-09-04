from __future__ import annotations
import os
import threading
from pathlib import Path
from typing import Dict, List, Optional, Any
import traceback
import asyncio
from dataclasses import dataclass, field

import numpy as np
from ultralytics import YOLO

@dataclass(frozen=True)
class ModelRecord:
    brand_key: str
    brand_display: str
    path: Path

class FilesystemRepository:
    def __init__(self, base_path: Path):
        self.base_path = base_path

    def _normalize_brand(self, raw: str) -> str:
        return "".join(ch.lower() for ch in (raw or "") if ch.isalnum())

    def discover_paths(self) -> Dict[str, Any]:
        segment = self.base_path / "segment_model.pt"
        narcotic = self.base_path / "narcotics" / "narcotic_model.pt"
        brand = self.base_path / "firearms" / "brand" / "gun_brand.pt"

        brand_models: List[ModelRecord] = []
        model_dir = self.base_path / "firearms" / "model"
        if model_dir.exists() and model_dir.is_dir():
            for sub in sorted(model_dir.iterdir()):
                if not sub.is_dir():
                    continue
                candidate: Optional[Path] = None
                for name in ("best.pt", "model.pt", "weights.pt"):
                    p = sub / name
                    if p.exists():
                        candidate = p
                        break
                if candidate is None:
                    pts = list(sub.glob("*.pt"))
                    if pts:
                        candidate = pts[0]
                if candidate:
                    brand_display = sub.name.replace("_Model", "")
                    brand_key = self._normalize_brand(brand_display)
                    brand_models.append(ModelRecord(brand_key=brand_key, brand_display=brand_display, path=candidate))

        return {
            "segment": segment,
            "narcotic": narcotic,
            "brand": brand,
            "brand_models": brand_models,
        }

class YOLOAdapter:
    @staticmethod
    def load(path: Path, task: Optional[str] = None) -> YOLO:
        if task:
            return YOLO(str(path), task=task)
        return YOLO(str(path))

    @staticmethod
    def infer(model: YOLO, image: Any) -> Any:
        return model(image)


class ModelLoaderUseCase:
    def __init__(self, repo: FilesystemRepository, adapter: YOLOAdapter):
        self.repo = repo
        self.adapter = adapter

        self.models_loaded: Dict[str, bool] = {
            "segment": False,
            "narcotic": False,
            "brand": False,
            "brand_specific": False,
        }

        self.model_segment: Optional[YOLO] = None
        self.model_narcotic: Optional[YOLO] = None
        self.model_firearm_brand: Optional[YOLO] = None
        self.model_map: Dict[str, YOLO] = {}

        self.segment_classes: Dict[int, str] = {0: "gun", 1: "pistol", 2: "rifle", 3: "weapon"}

        self._loading_event = threading.Event()
        self._load_thread = threading.Thread(target=self._background_load)
        self._load_thread.daemon = True

    def start_background_load(self):
        if not self._load_thread.is_alive():
            self._load_thread.start()

    def wait_for_models(self, timeout: Optional[float] = None) -> bool:
        return self._loading_event.wait(timeout)

    def is_ready(self) -> bool:
        return bool(self.models_loaded.get("segment")) and bool(self.models_loaded.get("narcotic"))

    def _normalize_brand(self, brand: str) -> str:
        return "".join(ch.lower() for ch in (brand or "") if ch.isalnum())

    def _load_single(self, path: Path, model_attr_name: str, model_key: str, update_names: bool = False):
        if not path.exists():
            self.models_loaded[model_key] = False
            return
        try:
            model = self.adapter.load(path)
            setattr(self, model_attr_name, model)
            self.models_loaded[model_key] = True
            if update_names and hasattr(model, "names") and getattr(model, "names"):
                try:
                    self.segment_classes = dict(getattr(model, "names"))
                except Exception:
                    pass
        except Exception as e:
            self.models_loaded[model_key] = False

    def _load_brand_specific_models(self, records: List[ModelRecord], default_task: Optional[str] = "classify"):
        for rec in records:
            try:
                if not rec.path.exists():
                    continue
                model = self.adapter.load(rec.path, task=default_task)
                self.model_map[rec.brand_key] = model
            except Exception:
                pass
        self.models_loaded["brand_specific"] = bool(self.model_map)

    def _background_load(self):
        try:
            paths = self.repo.discover_paths()
            self._load_single(paths["segment"], "model_segment", "segment", update_names=True)
            self._load_single(paths["narcotic"], "model_narcotic", "narcotic", update_names=False)
            self._load_single(paths["brand"], "model_firearm_brand", "brand", update_names=False)

            brand_models: List[ModelRecord] = paths.get("brand_models", []) or []
            if brand_models:
                self._load_brand_specific_models(brand_models, default_task="classify")

        except Exception:
            pass
        finally:
            self._loading_event.set()

    async def warmup_models(self, timeout_per_model: float = 120.0, retry_interval: float = 5.0, max_retries: int = 5):
        import time

        dummy = np.zeros((320, 320, 3), dtype=np.uint8)

        async def _call_model_async(m):
            return await asyncio.to_thread(m, dummy)

        attempt = 0
        while attempt < max_retries:
            results = {"segmentation": False, "narcotic": False, "brand_specific": 0}
            try:
                if self.model_segment is not None:
                    try:
                        t0 = time.time()
                        await asyncio.wait_for(_call_model_async(self.model_segment), timeout=timeout_per_model)
                        results["segmentation"] = True
                    except asyncio.TimeoutError:
                        pass
                    except Exception:
                        pass

                if self.model_narcotic is not None:
                    try:
                        t0 = time.time()
                        await asyncio.wait_for(_call_model_async(self.model_narcotic), timeout=timeout_per_model)
                        results["narcotic"] = True
                    except asyncio.TimeoutError:
                        pass
                    except Exception:
                        pass

                warmed = 0
                for i, m in enumerate(list(self.model_map.values())[:3]):
                    try:
                        t0 = time.time()
                        await asyncio.wait_for(_call_model_async(m), timeout=timeout_per_model)
                        warmed += 1
                    except asyncio.TimeoutError:
                        pass
                    except Exception:
                        pass
                results["brand_specific"] = warmed

                if results.get("segmentation") and results.get("narcotic"):
                    return results

                attempt += 1
                if attempt >= max_retries:
                    return results
                await asyncio.sleep(retry_interval)

            except Exception:
                attempt += 1
                if attempt >= max_retries:
                    return {"segmentation": False, "narcotic": False, "brand_specific": 0}
                await asyncio.sleep(retry_interval)

    def get_warmup_status(self):
        return {
            "models_loaded": self.models_loaded.copy(),
            "loading_complete": self._loading_event.is_set(),
            "is_ready": self.is_ready(),
            "available_models": {
                "segmentation": self.model_segment is not None,
                "narcotic": self.model_narcotic is not None,
                "brand_specific_count": len(self.model_map),
            },
        }

class ModelManager:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(ModelManager, cls).__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if getattr(self, "_initialized", False):
            return

        model_root = Path(os.environ.get("MODEL_PATH", "/app/ai_models"))
        repo = FilesystemRepository(model_root)
        adapter = YOLOAdapter()
        self._usecase = ModelLoaderUseCase(repo=repo, adapter=adapter)

        self.models_loaded = self._usecase.models_loaded
        self.model_segment = self._usecase.model_segment
        self.model_narcotic = self._usecase.model_narcotic
        self.model_firearm_brand = self._usecase.model_firearm_brand
        self.model_map = self._usecase.model_map
        self.segment_classes = self._usecase.segment_classes

        self._usecase.start_background_load()

        self._initialized = True

    def wait_for_models(self, timeout: Optional[float] = None) -> bool:
        return self._usecase.wait_for_models(timeout)

    def is_ready(self) -> bool:
        return self._usecase.is_ready()

    def get_segmentation_model(self):
        return self._usecase.model_segment

    def get_narcotic_model(self):
        return self._usecase.model_narcotic

    def get_firearm_brand_model(self):
        return self._usecase.model_firearm_brand

    def get_firearm_model_model(self, brand: str = None):
        if brand is None:
            return self._usecase.model_map
        target = "".join(ch.lower() for ch in (brand or "") if ch.isalnum())
        if not target:
            return None
        return self._usecase.model_map.get(target)

    def get_segment_classes(self):
        return self._usecase.segment_classes or {0: "gun", 1: "pistol", 2: "rifle", 3: "weapon"}

    async def warmup_models(self, timeout_per_model: float = 120.0, retry_interval: float = 5.0, max_retries: int = 5):
        return await self._usecase.warmup_models(timeout_per_model, retry_interval, max_retries)

    def get_warmup_status(self):
        return self._usecase.get_warmup_status()