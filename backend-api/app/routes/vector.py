from fastapi import APIRouter
from fastapi.responses import JSONResponse
import httpx
from app.config.ai_config import get_ai_service_url

router = APIRouter(tags=["vectors"])

@router.post("/convert_image_ref_to_vector")
async def convert_image_to_vector():
    ai_service_url = get_ai_service_url()
    target_url = f"{ai_service_url}/api/convert_image_ref_to_vector"

    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
            resp = await client.post(target_url)
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