import os
import cloudinary
import cloudinary.uploader
from fastapi import UploadFile
from dotenv import load_dotenv
from starlette.concurrency import run_in_threadpool

load_dotenv()

cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)

async def upload_image_to_cloudinary(file: UploadFile, folder: str = "firearm_examples"):
    try:
        file.file.seek(0)
    except Exception:
        pass

    result = await run_in_threadpool(
        cloudinary.uploader.upload,
        file.file,
        folder=folder,
        resource_type="image"
    )
    return result
