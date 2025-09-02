import os
import tempfile
import asyncio
from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse
from app.services.model_segment_service import ModelSegmentService

router = APIRouter(tags=["inference"])
_service = ModelSegmentService()

@router.post("/object-classify")
async def object_classify_service(
    image: UploadFile = File(...)
):
    if not image.content_type.startswith('image/'):
        return JSONResponse(
            status_code=400,
            content={"error": "ประเภทไฟล์ไม่ถูกต้อง อนุญาตเฉพาะรูปภาพเท่านั้น"}
        )
        
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp:
        temp_path = temp.name
        contents = await image.read()
        temp.write(contents)
        
    try:
        results = await asyncio.to_thread(_service.run_segment_model, temp_path, wait_for_model=True, wait_timeout=10, include_crops=True)
        return JSONResponse(status_code=200, content=results)
        
    except ValueError as e:
        return JSONResponse(status_code=400, content={"error": str(e)})
    except RuntimeError as e:
        return JSONResponse(status_code=503, content={"error": str(e)})
    except Exception:
        return JSONResponse(status_code=500, content={"error": "Internal server error"})
    finally:
        if os.path.exists(temp_path):
            os.unlink(temp_path)