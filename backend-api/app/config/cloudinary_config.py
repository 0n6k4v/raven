import os
import cloudinary
import cloudinary.uploader
import logging

logger = logging.getLogger(__name__)
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

    logger.info("Uploading to Cloudinary: folder=%s, filename=%s", folder, getattr(file, 'filename', None))
    try:
        result = await run_in_threadpool(
            cloudinary.uploader.upload,
            file.file,
            folder=folder,
            resource_type="image"
        )
    except Exception as e:
        logger.exception("Cloudinary upload failed: %s", e)
        raise
    else:
        logger.info("Cloudinary upload result: public_id=%s, secure_url=%s", result.get('public_id'), result.get('secure_url'))
        return result

async def delete_image_from_cloudinary(public_id: str, resource_type="image", invalidate: bool = False):
    if not public_id: 
        return {"result": "no_public_id"}
    logger.info("Deleting Cloudinary asset: public_id=%s, resource_type=%s, invalidate=%s", public_id, resource_type, invalidate)
    try:
        result = await run_in_threadpool(
            cloudinary.uploader.destroy,
            public_id,
            resource_type=resource_type,
            invalidate=invalidate
        )
    except Exception as e:
        logger.exception("Cloudinary destroy failed for public_id=%s: %s", public_id, e)
        raise
    else:
        logger.info("Cloudinary destroy result for %s: %s", public_id, result)
        return result
    return result