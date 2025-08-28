import cv2
from app.services.vector_service import create_vector_embedding

def analyze_drug(cropped_image, temp_path=None):
    result = {"drug_type": "Unknown"}
    
    if temp_path is not None:
        cv2.imwrite(temp_path, cropped_image)
        result["temp_path"] = temp_path
    
    try:
        vector_result = create_vector_embedding(
            cropped_image if temp_path is None else temp_path, 
            segment_first=False
        )
        
        vector_dimensions = vector_result.get("vector_dimension", 0)
        
        result["vector_info"] = {
            "dimensions": vector_dimensions
        }

        result["vector_base64"] = vector_result.get("vector_base64")
    except Exception as e:
        print(f"Error creating drug vector: {str(e)}")
    
    return result