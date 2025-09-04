from typing import List, Dict, Optional, Any
import numpy as np
import traceback
from .model_manager_service import ModelManager

def get_model_manager() -> ModelManager:
    return ModelManager()


def _get_top3_from_prediction(pred: Any, names: Dict[int, str]) -> List[Dict[str, Any]]:
    def _to_numpy(obj) -> np.ndarray:
        try:
            import torch
            if isinstance(obj, torch.Tensor):
                return obj.detach().cpu().numpy()
        except Exception:
            pass
        try:
            if hasattr(obj, "numpy"):
                return np.asarray(obj.numpy())
        except Exception:
            pass
        try:
            if hasattr(obj, "cpu") and hasattr(obj.cpu(), "numpy"):
                return np.asarray(obj.cpu().numpy())
        except Exception:
            pass
        try:
            if hasattr(obj, "tolist"):
                return np.asarray(obj.tolist())
        except Exception:
            pass
        try:
            if isinstance(obj, (list, tuple, np.ndarray)):
                out = []
                for x in obj:
                    try:
                        xa = _to_numpy(x)
                        if xa.size == 0:
                            continue
                        if xa.ndim == 0:
                            out.append(float(xa))
                        else:
                            out.extend(xa.ravel().tolist())
                    except Exception:
                        try:
                            out.append(float(x))
                        except Exception:
                            continue
                return np.asarray(out, dtype=float) if out else np.array([])
        except Exception:
            pass
        try:
            if hasattr(obj, "__dict__"):
                for k in ("probs", "values", "data", "tensor"):
                    v = getattr(obj, k, None)
                    if v is not None:
                        arr = _to_numpy(v)
                        if arr.size:
                            return arr
        except Exception:
            pass
        return np.array([])

    try:
        p = pred.probs if hasattr(pred, "probs") else pred
        probs = _to_numpy(p)

        if probs.size == 0:
            return []

        if probs.ndim == 2:
            probs = probs[0]
        try:
            probs = np.nan_to_num(probs.astype(float))
        except Exception:
            return []

        if probs.size == 0 or not names:
            return []

        top_idx = np.argsort(probs)[-3:][::-1]
        labels = []
        for idx in top_idx:
            idx = int(idx)
            conf = float(probs[idx]) if 0 <= idx < probs.size else 0.0
            label = names.get(idx, str(idx)) if isinstance(names, dict) else (names[idx] if idx < len(names) else str(idx))
            labels.append({"label": label, "confidence": conf})
        return labels

    except Exception:
        traceback.print_exc()
        return []


class ModelBrandService:
    def analyze_gun_brand(self, cropped_image: Any) -> Dict[str, Any]:
        model_manager = get_model_manager()
        model_brand = model_manager.get_firearm_brand_model()
        if model_brand is None:
            return {"selected_brand": "Unknown", "brand_top3": []}

        try:
            pred_all = model_brand(cropped_image)
            pred = pred_all[0]
            brand_top3 = _get_top3_from_prediction(pred, getattr(model_brand, "names", {}))
            selected_brand = brand_top3[0]["label"] if brand_top3 else "Unknown"
            return {"selected_brand": selected_brand, "brand_top3": brand_top3}
        except Exception:
            traceback.print_exc()
            return {"selected_brand": "Unknown", "brand_top3": []}