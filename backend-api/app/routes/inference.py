import httpx
from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import Dict, Any
from app.config.ai_config import get_ai_service_url

router = APIRouter(tags=["inference"])

@router.post("/object-classify", response_model=Dict[str, Any])
async def analyze_image(image: UploadFile = File(...)):
    ai_service_url = get_ai_service_url()
    target_url = f"{ai_service_url}/api/object-classify"
    
    try:
        file_content = await image.read()
        
        async with httpx.AsyncClient(timeout=300.0) as client:
            try:
                response = await client.post(
                    target_url,
                    files={"image": (image.filename, file_content, image.content_type)},
                    headers={
                        "Accept": "application/json",
                        "User-Agent": "Backend-API/1.0"
                    },
                    timeout=300.0
                )
            except httpx.TimeoutException:
                raise HTTPException(
                    status_code=504,
                    detail="AI service request timed out after 300 seconds"
                )
            except httpx.ConnectError as conn_exc:
                raise HTTPException(
                    status_code=503,
                    detail=f"Could not connect to AI service: {str(conn_exc)}"
                )
            
            if response.status_code != 200:
                text = (response.text or "")[:1000]
                raise HTTPException(
                    status_code=response.status_code, 
                    detail=f"AI service returned {response.status_code}: {text}"
                )
            
            try:
                response_data = response.json()
            except ValueError:
                snippet = (response.text or "")[:1000]
                raise HTTPException(
                    status_code=502,
                    detail=f"AI service returned non-JSON response: {snippet}"
                )

            if not isinstance(response_data, dict):
                raise HTTPException(status_code=502, detail="AI service returned unexpected response type")

            return response_data
            
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=503, 
            detail=f"AI service unavailable: {str(exc)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Internal server error"
        )

@router.post("/firearm-brand-classify", response_model=Dict[str, Any])
async def firearm_brand_classify(image: UploadFile = File(...)):
    ai_service_url = get_ai_service_url()
    target_url = f"{ai_service_url}/api/firearm-brand-classify"

    try:
        file_content = await image.read()

        async with httpx.AsyncClient(timeout=300.0) as client:
            try:
                response = await client.post(
                    target_url,
                    files={"image": (image.filename, file_content, image.content_type)},
                    headers={
                        "Accept": "application/json",
                        "User-Agent": "Backend-API/1.0"
                    },
                    timeout=300.0
                )
            except httpx.TimeoutException:
                raise HTTPException(status_code=504, detail="AI service request timed out after 300 seconds")
            except httpx.ConnectError as conn_exc:
                raise HTTPException(status_code=503, detail=f"Could not connect to AI service: {str(conn_exc)}")

            if response.status_code != 200:
                text = (response.text or "")[:1000]
                raise HTTPException(status_code=response.status_code, detail=f"AI service returned {response.status_code}: {text}")

            try:
                response_data = response.json()
            except ValueError:
                snippet = (response.text or "")[:1000]
                raise HTTPException(status_code=502, detail=f"AI service returned non-JSON response: {snippet}")

            if not isinstance(response_data, dict):
                raise HTTPException(status_code=502, detail="AI service returned unexpected response type")

            return response_data

    except httpx.RequestError as exc:
        raise HTTPException(status_code=503, detail=f"AI service unavailable: {str(exc)}")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error")