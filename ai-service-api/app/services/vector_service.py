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

from app.utils.image_util import crop_mask_on_white

_segment_model: Optional[YOLO] = None
_narcotic_model: Optional[YOLO] = None
_segment_model_path: Optional[str] = None
_narcotic_model_path: Optional[str] = None
_segment_classes: Dict[int, str] = {}
_debug_dir: str = "."
_transform = None
_device = torch.device("cuda" if torch.cuda.is_available() else "cpu")


def init_vector_service(
    segment_model_path: Optional[str] = None,
    narcotic_model_path: Optional[str] = None,
    transform=None,
    debug_dir: Optional[str] = None,
    segment_classes: Optional[Dict[int, str]] = None,
) -> None:
    global _segment_model_path, _narcotic_model_path, _transform, _debug_dir, _segment_classes
    if segment_model_path is not None:
        _segment_model_path = segment_model_path
    if narcotic_model_path is not None:
        _narcotic_model_path = narcotic_model_path
    if transform is not None:
        _transform = transform
    if debug_dir is not None:
        _debug_dir = debug_dir
    if segment_classes is not None:
        _segment_classes = segment_classes


def load_segmentation_model() -> None:
    global _segment_model, _segment_model_path
    if not _segment_model_path:
        raise ValueError("segment_model_path not set. Call init_vector_service(...) first.")
    if not os.path.exists(_segment_model_path):
        raise FileNotFoundError(f"Segmentation model file not found: {_segment_model_path}")
    _segment_model = YOLO(_segment_model_path)


def load_narcotic_model() -> None:
    global _narcotic_model, _narcotic_model_path
    if not _narcotic_model_path:
        raise ValueError("narcotic_model_path not set. Call init_vector_service(...) first.")
    if not os.path.exists(_narcotic_model_path):
        raise FileNotFoundError(f"Narcotic model file not found: {_narcotic_model_path}")
    _narcotic_model = YOLO(_narcotic_model_path)


def process_image_for_vector(
    image: Union[str, Path, Image.Image, np.ndarray, bytes],
    save_debug_image: bool = True
) -> Tuple[np.ndarray, Dict]:
    global _segment_model, _segment_classes, _debug_dir
    if _segment_model is None:
        raise ValueError("Segmentation model not loaded. Call load_segmentation_model() first.")

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

    results = _segment_model(cv_image)[0]

    result_info = {
        "found_drug": False,
        "confidence": 0.0,
        "class_name": "",
        "debug_image_path": None
    }

    if not hasattr(results, "boxes") or len(results.boxes) == 0:
        return cv_image, result_info

    drug_indices = []
    for i, box in enumerate(results.boxes):
        try:
            cls_id = int(box.cls[0].item())
        except Exception:
            cls_id = int(getattr(box, "cls", [0])[0])
        cls_name = _segment_classes.get(cls_id, "Unknown")
        try:
            confidence = float(box.conf[0].item())
        except Exception:
            confidence = float(getattr(box, "conf", [0.0])[0])

        if cls_name in ['Drug', 'PackageDrug']:
            drug_indices.append((i, cls_name, confidence))

    if not drug_indices:
        return cv_image, result_info

    drug_indices.sort(key=lambda x: x[2], reverse=True)
    idx, cls_name, confidence = drug_indices[0]

    mask = results.masks.data[idx].cpu().numpy()
    cropped = crop_mask_on_white(cv_image, mask)

    if save_debug_image:
        os.makedirs(_debug_dir, exist_ok=True)
        debug_path = os.path.join(_debug_dir, f"cropped_{cls_name}_{uuid.uuid4()}.jpg")
        cv2.imwrite(debug_path, cropped)
        result_info["debug_image_path"] = debug_path

    result_info.update({
        "found_drug": True,
        "confidence": round(confidence, 2),
        "class_name": cls_name
    })

    return cropped, result_info


def image_to_vector(
    image: Union[str, Path, Image.Image, np.ndarray, bytes],
    normalize: bool = True,
    segment_first: bool = True,
    save_debug_image: bool = True
) -> torch.Tensor:
    global _narcotic_model, _transform, _device
    if _narcotic_model is None:
        raise ValueError("Narcotic model not loaded. Call load_narcotic_model() first.")
    if _transform is None:
        raise ValueError("Image transform not set. Provide transform via init_vector_service(transform=...)")

    processed_image = image
    if segment_first:
        try:
            processed_image, _ = process_image_for_vector(image, save_debug_image=save_debug_image)
        except Exception:
            processed_image = image

    if isinstance(processed_image, np.ndarray):
        processed_image = Image.fromarray(cv2.cvtColor(processed_image, cv2.COLOR_BGR2RGB))
    elif isinstance(processed_image, (str, Path)):
        processed_image = Image.open(processed_image).convert("RGB")
    elif isinstance(processed_image, (bytes, bytearray)):
        processed_image = Image.open(io.BytesIO(processed_image)).convert("RGB")

    tensor = _transform(processed_image).unsqueeze(0)
    tensor = tensor.to(_device)

    with torch.no_grad():
        try:
            backbone = _narcotic_model.model.model[:-1]
            features = backbone(tensor)
        except Exception:
            out = _narcotic_model.model(tensor)
            features = out if isinstance(out, torch.Tensor) else torch.tensor(np.array(out))
        vector = features.view(features.size(0), -1)[0]

    if normalize:
        vector = F.normalize(vector, p=2, dim=0)

    return vector


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


def create_vector_embedding(image_data: Union[str, Path, Image.Image, np.ndarray, bytes], segment_first: bool = True) -> Dict:
    global _segment_model, _narcotic_model
    if _segment_model is None and _segment_model_path is not None:
        load_segmentation_model()
    if _narcotic_model is None and _narcotic_model_path is not None:
        load_narcotic_model()

    result_info = {}
    try:
        if segment_first and _segment_model is not None:
            processed_image, result_info = process_image_for_vector(image_data)
            vector = image_to_vector(processed_image, normalize=True, segment_first=False)
        else:
            vector = image_to_vector(image_data, normalize=True, segment_first=False)
    except Exception:
        raise

    vector_np = vector_to_numpy(vector)

    vector_bytes = vector_np.tobytes()
    vector_base64 = base64.b64encode(vector_bytes).decode('utf-8')

    result = {
        "vector_base64": vector_base64,
        "vector_dimension": len(vector_np),
        "segmentation_result": result_info
    }

    return result