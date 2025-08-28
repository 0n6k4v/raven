import os
import threading
from pathlib import Path
from ultralytics import YOLO
from typing import Dict

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
            
        self.base_model_path = Path(__file__).parent.parent / "ai_models"
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
        self.path_ai_model_segment = self.base_model_path / "segment_model.pt"
        self.path_ai_model_narcotic = self.base_model_path / "narcotics" / "narcotic_model.pt"

    def _load_models_background(self):
        try:
            models_to_load = [
                (self.path_ai_model_segment, "model_segment", "segment", True),
                (self.path_ai_model_narcotic, "model_narcotic", "narcotic", False),
            ]
            for path, attr_name, model_key, update_names in models_to_load:
                self._load_yolo(path, attr_name, model_key, update_names)
        finally:
            self.loading_complete.set()

    def _load_yolo(self, path: Path, attr_name: str, model_key: str, update_names: bool = False):
        if not path.exists():
            self.models_loaded[model_key] = False
            return
        try:
            model = YOLO(str(path))
            setattr(self, attr_name, model)
            self.models_loaded[model_key] = True
            if update_names and hasattr(model, "names"):
                self.segment_classes = model.names
        except Exception:
            self.models_loaded[model_key] = False

    def get_segmentation_model(self):
        return self.model_segment

    def get_narcotic_model(self):
        return self.model_narcotic

    def get_segment_classes(self):
        if hasattr(self, 'segment_classes') and self.segment_classes:
            return self.segment_classes
        else:
            return {0: "gun", 1: "pistol", 2: "rifle", 3: "weapon"}