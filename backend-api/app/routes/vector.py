from fastapi import APIRouter, UploadFile, File, Body, Depends, HTTPException
from typing import List, Dict, Any, Optional
from fastapi.responses import JSONResponse
import httpx
from app.config.ai_config import get_ai_service_url
from sqlalchemy.ext.asyncio import AsyncSession
from app.config.db_config import get_async_db
from app.services.vector_service import VectorService
from app.controllers.narcotic_image_vector_controller import search_similar_narcotics_with_vector

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

@router.post("/search-vector", response_model=Dict[str, List[Dict[str, Any]]])
async def search_similar_narcotics(
    vector: Optional[List[float]] = Body(None),
    vector_base64: Optional[str] = Body(None),
    top_k: int = Body(3, gt=0),
    similarity_threshold: float = Body(0.05, ge=0.0, le=1.0),
    db: AsyncSession = Depends(get_async_db)
):
    try:
        try:
            vec = VectorService.build_vector_from_inputs(vector=vector, vector_base64=vector_base64)
        except ValueError as ve:
            raise HTTPException(status_code=400, detail=str(ve))

        similar_items = await search_similar_narcotics_with_vector(
            db=db,
            vector=vec,
            top_k=top_k,
            similarity_threshold=similarity_threshold
        )

        return {"results": similar_items}
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error searching similar narcotics: {str(e)}")