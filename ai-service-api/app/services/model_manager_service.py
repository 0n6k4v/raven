import os
import threading
from pathlib import Path
from ultralytics import YOLO
from typing import Dict
import traceback
import asyncio
import numpy as np

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
        if hasattr(self, '_initialized') and self._initialized:
            return

        model_root = Path(os.environ.get("MODEL_PATH", "/app/ai_models"))
        print(f"[ModelManager] MODEL_PATH = {model_root}")
        self.base_model_path = model_root
        self._setup_paths()

        self.models_loaded = {
            'segment': False,
            'brand': False,
            'narcotic': False,
            'brand_specific': False
        }

        self.model_segment = None
        self.model_brand = None
        self.model_narcotic = None
        self.model_map = {}

        self.segment_classes = {0: "gun", 1: "pistol", 2: "rifle", 3: "weapon"}

        self.loading_complete = threading.Event()
        self.loading_thread = threading.Thread(target=self._load_models_background)
        self.loading_thread.daemon = True
        self.loading_thread.start()

        self._initialized = True

    def _setup_paths(self):
        # expect files under MODEL_PATH (mounted by docker)
        self.path_ai_model_segment = self.base_model_path / "segment_model.pt"
        self.path_ai_model_narcotic = self.base_model_path / "narcotics" / "narcotic_model.pt"
        print(f"[ModelManager] Model paths: segment={self.path_ai_model_segment}, narcotic={self.path_ai_model_narcotic}")

    def _load_models_background(self):
        try:
            models_to_load = [
                (self.path_ai_model_segment, "model_segment", "segment", True),
                (self.path_ai_model_narcotic, "model_narcotic", "narcotic", False),
            ]
            for path, attr_name, model_key, update_names in models_to_load:
                self._load_yolo(path, attr_name, model_key, update_names)
        except Exception as e:
            print(f"[ModelManager] Error loading models in background: {e}")
            traceback.print_exc()
        finally:
            self.loading_complete.set()
            print("[ModelManager] Background model loading finished (loading_complete set)")

    def _load_yolo(self, path: Path, attr_name: str, model_key: str, update_names: bool = False):
        if not path.exists():
            print(f"[ModelManager] WARNING: Model file not found: {path}")
            self.models_loaded[model_key] = False
            return
        try:
            print(f"[ModelManager] Loading model {model_key} from {path} ...")
            model = YOLO(str(path))
            setattr(self, attr_name, model)
            self.models_loaded[model_key] = True
            if update_names and hasattr(model, "names"):
                self.segment_classes = model.names
            print(f"[ModelManager] Loaded model {model_key} successfully")
        except Exception as e:
            print(f"[ModelManager] Failed to load YOLO model {model_key}: {e}")
            traceback.print_exc()
            self.models_loaded[model_key] = False

    def wait_for_models(self, timeout: int = None) -> bool:
        return self.loading_complete.wait(timeout)

    def is_ready(self) -> bool:
        # critical models must be loaded
        return bool(self.models_loaded.get("segment")) and bool(self.models_loaded.get("narcotic"))

    def get_segmentation_model(self):
        return self.model_segment

    def get_narcotic_model(self):
        return self.model_narcotic

    def get_segment_classes(self):
        if hasattr(self, 'segment_classes') and self.segment_classes:
            return self.segment_classes
        else:
            return {0: "gun", 1: "pistol", 2: "rifle", 3: "weapon"}

    async def warmup_models(self, timeout_per_model: float = 120.0, retry_interval: float = 5.0):
        """Warm up loaded models sequentially and keep retrying until critical warmups succeed.

        This will loop until both 'segmentation' and 'narcotic' warmups return True.
        Be careful: this can block startup indefinitely if warmup never succeeds.
        """
        import time
        import asyncio

        print("[ModelManager] Warmup: starting (will retry until successful)")
        # smaller dummy to speed up warmup
        dummy = np.zeros((320, 320, 3), dtype=np.uint8)

        async def _call_model_async(m):
            return await asyncio.to_thread(m, dummy)

        while True:
            results = {"segmentation": False, "narcotic": False, "brand": False, "brand_specific": 0}
            try:
                # segmentation
                if self.model_segment is not None:
                    try:
                        t0 = time.time()
                        await asyncio.wait_for(_call_model_async(self.model_segment), timeout=timeout_per_model)
                        results["segmentation"] = True
                        print(f"[ModelManager] Warmup: segmentation finished in {time.time()-t0:.2f}s")
                    except asyncio.TimeoutError:
                        print(f"[ModelManager] Warmup: segmentation timed out after {timeout_per_model}s")
                    except Exception as e:
                        print(f"[ModelManager] Warmup: segmentation error: {e}")

                # narcotic
                if self.model_narcotic is not None:
                    try:
                        t0 = time.time()
                        await asyncio.wait_for(_call_model_async(self.model_narcotic), timeout=timeout_per_model)
                        results["narcotic"] = True
                        print(f"[ModelManager] Warmup: narcotic finished in {time.time()-t0:.2f}s")
                    except asyncio.TimeoutError:
                        print(f"[ModelManager] Warmup: narcotic timed out after {timeout_per_model}s")
                    except Exception as e:
                        print(f"[ModelManager] Warmup: narcotic error: {e}")

                # brand-specific: sample up to 3 models sequentially
                warmed = 0
                for i, m in enumerate(list(self.model_map.values())[:3]):
                    try:
                        t0 = time.time()
                        await asyncio.wait_for(_call_model_async(m), timeout=timeout_per_model)
                        warmed += 1
                        print(f"[ModelManager] Warmup: brand model #{i} finished in {time.time()-t0:.2f}s")
                    except asyncio.TimeoutError:
                        print(f"[ModelManager] Warmup: brand model #{i} timed out")
                    except Exception as e:
                        print(f"[ModelManager] Warmup: brand model #{i} error: {e}")
                results["brand_specific"] = warmed

                print(f"[ModelManager] Warmup attempt result: {results}")

                # require critical warmups to succeed
                if results.get("segmentation") and results.get("narcotic"):
                    print("[ModelManager] Warmup: critical models warmed successfully")
                    return results

                # otherwise wait and retry
                print(f"[ModelManager] Warmup: not all critical warmed, retrying in {retry_interval}s")
                await asyncio.sleep(retry_interval)

            except Exception as e:
                print(f"[ModelManager] Warmup failed with unexpected error: {e}")
                traceback.print_exc()
                print(f"[ModelManager] Retrying in {retry_interval}s")
                await asyncio.sleep(retry_interval)

    def get_warmup_status(self):
        return {
            "models_loaded": self.models_loaded.copy(),
            "loading_complete": self.loading_complete.is_set(),
            "is_ready": self.is_ready(),
            "available_models": {
                "segmentation": self.model_segment is not None,
                "narcotic": self.model_narcotic is not None,
                "brand_specific_count": len(self.model_map)
            }
        }