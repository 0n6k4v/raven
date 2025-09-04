from typing import Any, Dict, Optional
import traceback
import numpy as np

from .model_manager_service import ModelManager
from .model_brand_service import _get_top3_from_prediction


class ModelFirearmModelService:
    def __init__(self, model_manager: Optional[ModelManager] = None):
        self.model_manager = model_manager or ModelManager()

    def get_model(self, brand: Optional[str] = None) -> Optional[Any]:
        return self.model_manager.get_firearm_model_model(brand)

    def classify_firearm_model(self, cropped_image: Any, brand_name: str) -> Dict[str, Any]:
        model = self.get_model(brand_name)
        if model is None:
            return {"selected_model": "Unknown", "model_top3": []}

        try:
            pred_all = model(cropped_image)
            pred = pred_all[0]
            model_top3 = _get_top3_from_prediction(pred, getattr(model, "names", {}))
            selected_model = model_top3[0]["label"] if model_top3 else "Unknown"
            return {"selected_model": selected_model, "model_top3": model_top3}
        except Exception:
            traceback.print_exc()
            return {"selected_model": "Unknown", "model_top3": []}