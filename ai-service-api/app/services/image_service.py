import os
import cv2
import numpy as np
from pathlib import Path
from typing import Tuple, List, Dict, Any, Optional
from app.services.model_manager_service import get_model_manager
from app.services.narcotic_service import analyze_drug
from app.utils.image_util import crop_mask_on_white

def save_temp_image(image: np.ndarray, prefix: str, index: int, class_name: str) -> str:
    temp_path = f"{prefix}_crop_{index}_{class_name}.jpg"
    cv2.imwrite(temp_path, image)
    return temp_path

def segment_image(image):
    model_manager = get_model_manager()
    model_segment = model_manager.get_segmentation_model()
    segment_classes = model_manager.get_segment_classes()
    
    if model_segment is None:
        return None, []
    
    results = model_segment(image)[0]
    
    segmented_objects = []
    
    for i, mask in enumerate(results.masks.data):
        cls_id = int(results.boxes.cls[i].item())
        confidence = float(results.boxes.conf[i].item())
        cls_name = segment_classes.get(cls_id, "Unknown")
        
        cropped = crop_mask_on_white(image, mask.cpu().numpy())
        
        segmented_objects.append({
            "index": i,
            "class_id": cls_id,
            "class_name": cls_name,
            "confidence": round(confidence, 3),
            "mask": mask.cpu().numpy(),
            "cropped_image": cropped
        })
    
    return results, segmented_objects

def process_image(image_path):
    image = cv2.imread(image_path)
    if image is None:
        return {"error": f"Could not read image at {image_path}"}
    
    _, segmented_objects = segment_image(image)
    
    processed_objects = []
    temp_files = []
    
    for obj in segmented_objects:
        temp_path = save_temp_image(obj["cropped_image"], image_path, obj["index"], obj["class_name"])
        temp_files.append(temp_path)
        
        obj_data = {
            "object_index": obj["index"],
            "class": obj["class_name"],
            "confidence": obj["confidence"],
            "cropped_path": temp_path
        }
        
        if obj["class_name"] in ['Drug', 'PackageDrug']:
            drug_info = analyze_drug(obj["cropped_image"], temp_path)
            obj_data.update(drug_info)
        
        processed_objects.append(obj_data)
    
    for temp_file in temp_files:
        if os.path.exists(temp_file):
            os.remove(temp_file)
    
    return {
        "original_image": image_path,
        "detected_objects": processed_objects
    }