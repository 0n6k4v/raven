from fastapi import APIRouter

router = APIRouter(tags=["vectors"])

@router.post("/convert")
async def convert_image_to_vector():
    return {"message": "convert_image_to_vector start"}