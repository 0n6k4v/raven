from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse
from app.services.vector_service import VectorService


_vectorService = VectorService()
router = APIRouter(tags=["vectors"])

@router.post("/convert_image_ref_to_vector")
async def convert_image_to_vector(image: UploadFile = File(...)):
    try:
        image_bytes = await image.read()
        result = _vectorService.create_vector_embedding(image_bytes, segment_first=True)
        return JSONResponse(status_code=200, content=result)
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": "vectorization failed", "detail": str(e)})