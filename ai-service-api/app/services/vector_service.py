import base64
import io
import os
import uuid
from pathlib import Path
from typing import Dict, Tuple, Union, Optional

import cv2
import numpy as np
from PIL import Image

import torch
import torch.nn.functional as F
from ultralytics import YOLO

from torchvision import transforms as T

from app.utils.image_util import crop_mask_on_white
from app.services.model_manager_service import ModelManager


class VectorService:
    def __init__(
        self,
        transform=None,
        debug_dir: Optional[str] = ".",
        segment_classes: Optional[Dict[int, str]] = None,
        model_manager: Optional[ModelManager] = None,
    ) -> None:
        self.mgr = model_manager or ModelManager()
        self._segment_model: Optional[YOLO] = self.mgr.get_segmentation_model()
        self._narcotic_model: Optional[YOLO] = self.mgr.get_narcotic_model()
        self._segment_classes: Dict[int, str] = segment_classes or {}
        self._debug_dir: str = debug_dir or "."
        if transform is None:
            self._transform = T.Compose([
                T.Resize((256, 256)),
                T.ToTensor(),
                T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
            ])
        else:
            self._transform = transform
        self._device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    def attach_models_from_manager(self, wait_for_models: bool = False, timeout: int = 30) -> None:
        if wait_for_models:
            try:
                self.mgr.wait_for_models(timeout)
            except Exception:
                pass
        self._segment_model = self._segment_model or self.mgr.get_segmentation_model()
        self._narcotic_model = self._narcotic_model or self.mgr.get_narcotic_model()
        try:
            classes = self.mgr.get_segment_classes()
            if classes:
                self._segment_classes.update(classes)
        except Exception:
            pass

    def init(self, transform=None, debug_dir: Optional[str] = None, segment_classes: Optional[Dict[int, str]] = None) -> None:
        if transform is not None:
            self._transform = transform
        if debug_dir is not None:
            self._debug_dir = debug_dir
        if segment_classes is not None:
            self._segment_classes = segment_classes

    def _ensure_segment_model(self) -> None:
        if self._segment_model is None:
            self._segment_model = self.mgr.get_segmentation_model()
        if self._segment_model is None:
            raise ValueError("Segmentation model is not available (ModelManager did not load it).")

    def _ensure_narcotic_model(self) -> None:
        if self._narcotic_model is None:
            self._narcotic_model = self.mgr.get_narcotic_model()
        if self._narcotic_model is None:
            raise ValueError("Narcotic model is not available (ModelManager did not load it).")

    def process_image_for_vector(
        self,
        image: Union[str, Path, Image.Image, np.ndarray, bytes],
        save_debug_image: bool = True,
    ) -> Tuple[np.ndarray, Dict]:
        self._ensure_segment_model()
        try:
            classes = self.mgr.get_segment_classes()
            if classes:
                self._segment_classes.update(classes)
        except Exception:
            pass

        if isinstance(image, (str, Path)):
            cv_image = cv2.imread(str(image))
            if cv_image is None:
                raise ValueError(f"Unable to read image from path: {image}")
        elif isinstance(image, Image.Image):
            cv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        elif isinstance(image, np.ndarray):
            cv_image = image
        elif isinstance(image, (bytes, bytearray)):
            pil_image = Image.open(io.BytesIO(image)).convert("RGB")
            cv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
        else:
            raise TypeError("Image must be a file path, PIL Image, numpy array, or bytes")

        results = self._segment_model(cv_image)[0]

        result_info = {
            "found_drug": False,
            "confidence": 0.0,
            "class_name": "",
            "debug_image_path": None,
        }

        if not hasattr(results, "boxes") or len(results.boxes) == 0:
            return cv_image, result_info

        drug_indices = []
        for i, box in enumerate(results.boxes):
            try:
                cls_id = int(box.cls[0].item())
            except Exception:
                cls_id = int(getattr(box, "cls", [0])[0])
            cls_name = self._segment_classes.get(cls_id, "Unknown")
            try:
                confidence = float(box.conf[0].item())
            except Exception:
                confidence = float(getattr(box, "conf", [0.0])[0])

            if cls_name in ["Drug", "PackageDrug"]:
                drug_indices.append((i, cls_name, confidence))

        if not drug_indices:
            return cv_image, result_info

        drug_indices.sort(key=lambda x: x[2], reverse=True)
        idx, cls_name, confidence = drug_indices[0]

        mask = results.masks.data[idx].cpu().numpy()
        cropped = crop_mask_on_white(cv_image, mask)

        if save_debug_image:
            os.makedirs(self._debug_dir, exist_ok=True)
            debug_path = os.path.join(self._debug_dir, f"cropped_{cls_name}_{uuid.uuid4()}.jpg")
            cv2.imwrite(debug_path, cropped)
            result_info["debug_image_path"] = debug_path

        result_info.update({"found_drug": True, "confidence": round(confidence, 2), "class_name": cls_name})
        return cropped, result_info

    def image_to_vector(
        self,
        image: Union[str, Path, Image.Image, np.ndarray, bytes],
        normalize: bool = True,
        segment_first: bool = True,
        save_debug_image: bool = True,
    ) -> torch.Tensor:
        self._ensure_narcotic_model()

        if self._transform is None:
            raise ValueError("Image transform not set. Provide transform via init(transform=...)")

        processed_image = image
        if segment_first:
            try:
                processed_image, _ = self.process_image_for_vector(image, save_debug_image=save_debug_image)
            except Exception:
                processed_image = image

        if isinstance(processed_image, np.ndarray):
            processed_image = Image.fromarray(cv2.cvtColor(processed_image, cv2.COLOR_BGR2RGB))
        elif isinstance(processed_image, (str, Path)):
            processed_image = Image.open(processed_image).convert("RGB")
        elif isinstance(processed_image, (bytes, bytearray)):
            processed_image = Image.open(io.BytesIO(processed_image)).convert("RGB")

        tensor = self._transform(processed_image).unsqueeze(0).to(self._device)

        with torch.no_grad():
            try:
                backbone = self._narcotic_model.model.model[:-1]
                features = backbone(tensor)
            except Exception:
                out = self._narcotic_model.model(tensor)
                features = out if isinstance(out, torch.Tensor) else torch.tensor(np.array(out))
            vector = features.view(features.size(0), -1)[0]

        if normalize:
            vector = F.normalize(vector, p=2, dim=0)

        return vector

    @staticmethod
    def vector_to_numpy(vector: Union[torch.Tensor, np.ndarray, list], target_dim: int = 16000) -> np.ndarray:
        if isinstance(vector, torch.Tensor):
            v = vector.detach().cpu().numpy().astype(np.float32).reshape(-1)
        else:
            v = np.asarray(vector, dtype=np.float32).reshape(-1)

        if v.size == 0 or (v.size == 1 and float(v[0]) == 0.0):
            np.random.seed(42)
            return np.random.normal(0, 0.1, target_dim).astype(np.float32)

        old_len = v.shape[0]
        if old_len == target_dim:
            return v
        if old_len == 1:
            return np.full((target_dim,), v[0], dtype=np.float32)

        old_idx = np.linspace(0.0, 1.0, old_len)
        new_idx = np.linspace(0.0, 1.0, target_dim)
        resized = np.interp(new_idx, old_idx, v).astype(np.float32)
        return resized

    def create_vector_embedding(self, image_data: Union[str, Path, Image.Image, np.ndarray, bytes], segment_first: bool = True) -> Dict:
        result_info = {}

        if segment_first:
            self._ensure_segment_model()
        self._ensure_narcotic_model()

        try:
            if segment_first:
                processed_image, result_info = self.process_image_for_vector(image_data)
                vector = self.image_to_vector(processed_image, normalize=True, segment_first=False)
            else:
                vector = self.image_to_vector(image_data, normalize=True, segment_first=False)
        except Exception:
            raise

        vector_np = self.vector_to_numpy(vector)
        vector_bytes = vector_np.tobytes()
        vector_base64 = base64.b64encode(vector_bytes).decode("utf-8")

        result = {"vector_base64": vector_base64, "vector_dimension": len(vector_np), "segmentation_result": result_info}
        return result