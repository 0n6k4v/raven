import cv2
import base64
import numpy as np
from typing import Any, Optional, Dict, List
from app.services.model_manager_service import ModelManager
from app.utils.image_util import crop_mask_on_white

class ModelSegmentService:
    def __init__(self, model: Optional[Any] = None):
        self.model = model

    def set_model(self, model: Any) -> None:
        self.model = model

    def _results_to_dict(self, results: Any, image: Optional[np.ndarray] = None, include_crops: bool = False) -> Dict[str, Any]:
        out: Dict[str, Any] = {"objects": []}
        boxes = getattr(results, "boxes", None)
        names = getattr(results, "names", None)

        if boxes is not None:
            try:
                cls_list = [int(x.item()) if hasattr(x, "item") else int(x) for x in boxes.cls]
            except Exception:
                cls_list = []
            try:
                conf_list = [float(x.item()) if hasattr(x, "item") else float(x) for x in boxes.conf]
            except Exception:
                conf_list = []

            for i, cls_id in enumerate(cls_list):
                try:
                    if names is None:
                        class_name = str(cls_id)
                    else:
                        class_name = names[cls_id]
                except Exception:
                    class_name = str(cls_id)

                obj = {
                    "class_id": cls_id,
                    "detection_type": class_name,
                    "confidence": round(conf_list[i], 4) if i < len(conf_list) else None
                }
                
                if include_crops and image is not None:
                    try:
                        mask = results.masks.data[i].cpu().numpy()
                        cropped = crop_mask_on_white(image, mask)
                        ok, buf = cv2.imencode('.jpg', cropped)
                        if ok:
                            b64 = base64.b64encode(buf.tobytes()).decode('utf-8')
                            obj["cropped_base64"] = f"data:image/jpeg;base64,{b64}"
                        else:
                            obj["cropped_base64"] = None
                    except Exception:
                        obj["cropped_base64"] = None
                out["objects"].append(obj)

        return out

    def run_segment_model(self, image_path: str, wait_for_model: bool = False, wait_timeout: float = 30.0, include_crops: bool = False) -> Dict[str, Any]:
        if self.model is None:
            mgr = ModelManager()
            seg = mgr.get_segmentation_model()
            if seg is None and wait_for_model and hasattr(mgr, "loading_complete"):
                mgr.loading_complete.wait(wait_timeout)
                seg = mgr.get_segmentation_model()
            if seg is None:
                raise RuntimeError("Segmentation model not available; attach_from_manager() or try again later")
            self.model = seg

        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Cannot load image from {image_path}")

        results = self.model(image)[0]
        return self._results_to_dict(results, image=image if include_crops else None, include_crops=include_crops)