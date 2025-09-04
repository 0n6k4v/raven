import os
import tempfile
import asyncio
from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import JSONResponse
from typing import Any
import io
import numpy as np
from PIL import Image

from app.services.model_segment_service import ModelSegmentService
from app.services.model_brand_service import ModelBrandService
from app.services.model_firearm_model_service import ModelFirearmModelService

router = APIRouter(tags=["inference"])
_model_segment_service = ModelSegmentService()
_model_brand_service = ModelBrandService()

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
        results = await asyncio.to_thread(_model_segment_service.run_segment_model, temp_path, wait_for_model=True, wait_timeout=10, include_crops=True)
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

@router.post("/firearm-brand-classify")
async def firearm_brand_classify(
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
        result = await asyncio.to_thread(_model_brand_service.analyze_gun_brand, temp_path)
        return JSONResponse(status_code=200, content=result)

    except ValueError as e:
        return JSONResponse(status_code=400, content={"error": str(e)})
    except RuntimeError as e:
        return JSONResponse(status_code=503, content={"error": str(e)})
    except Exception:
        return JSONResponse(status_code=500, content={"error": "Internal server error"})
    finally:
        if os.path.exists(temp_path):
            os.unlink(temp_path)

@router.post("/firearm-model-classify")
async def firearm_model_classify(brand: str = Form(...), file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        return JSONResponse(status_code=400, content={"error": "invalid image"})

    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp:
        temp_path = temp.name
        contents = await file.read()
        temp.write(contents)

    svc = ModelFirearmModelService()
    try:
        result = await asyncio.to_thread(svc.classify_firearm_model, temp_path, brand)
        return JSONResponse(status_code=200, content=result)
    except ValueError as e:
        return JSONResponse(status_code=400, content={"error": str(e)})
    except RuntimeError as e:
        return JSONResponse(status_code=503, content={"error": str(e)})
    except Exception:
        return JSONResponse(status_code=500, content={"error": "Internal server error"})
    finally:
        if os.path.exists(temp_path):
            os.unlink(temp_path)