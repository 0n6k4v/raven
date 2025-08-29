from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse
import httpx
from app.config.ai_config import get_ai_service_url

router = APIRouter(tags=["vectors"])

@router.post("/convert_image_ref_to_vector")
async def convert_image_to_vector(image: UploadFile = File(...)):
    ai_service_url = get_ai_service_url()
    target_url = f"{ai_service_url}/api/convert_image_ref_to_vector"

    try:
        file_bytes = await image.read()
    except Exception as exc:
        return JSONResponse(status_code=400, content={"error": "Failed to read uploaded file", "detail": str(exc)})

    files = {'image': (image.filename or 'image.jpg', file_bytes, image.content_type or 'application/octet-stream')}

    async with httpx.AsyncClient(timeout=600.0) as client:
        try:
            resp = await client.post(target_url, files=files)
        except httpx.RequestError as exc:
            return JSONResponse(status_code=503, content={
                "error": "Failed to contact AI service",
                "detail": str(exc)
            })

    try:
        content = resp.json()
    except ValueError:
        content = {"raw": resp.text}

    return JSONResponse(status_code=resp.status_code, content=content)