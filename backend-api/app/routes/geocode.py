from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
import os
import httpx
import json
import time
from cachetools import TTLCache, cached
from typing import Optional, Dict, Any
from starlette.concurrency import run_in_threadpool

router = APIRouter(prefix="/geocode", tags=["geocode"])

# In-memory TTL cache (suitable for single-instance deployments).
# For multi-instance production use Redis or other shared cache.
# See: https://cachetools.readthedocs.io/
cache = TTLCache(maxsize=10000, ttl=60 * 60)

# Read LONGDO API key from env (keep secret out of repo)
LONGDO_KEY = os.getenv("LONGDO_API_KEY")

class GeoResponse(BaseModel):
    ok: bool
    data: Optional[Dict[str, Any]] = None
    message: Optional[str] = None

def round_coord_key(lat: float, lng: float, precision: int = 5) -> str:
    return f"{round(lat, precision)}|{round(lng, precision)}"

@cached(cache)
def fetch_longdo_sync(lat: float, lng: float) -> Dict[str, Any]:
    """Blocking, cached sync call to Longdo.

    We keep this function synchronous and run it in a threadpool from the async route
    (to reuse cachetools easily). For high-scale multi-instance deployments prefer
    an async cache or external Redis.

    References:
      - FastAPI concurrency docs: https://fastapi.tiangolo.com/advanced/concurrency/
      - httpx usage: https://www.python-httpx.org/
      - cachetools TTLCache: https://cachetools.readthedocs.io/
    """
    if not LONGDO_KEY:
        raise RuntimeError("LONGDO API key not configured")

    url = (
        f"https://api.longdo.com/map/services/address?lon={lng}&lat={lat}&noelevation=1&key={LONGDO_KEY}"
    )

    # Basic retry/backoff logic for transient network issues
    max_retries = 2
    backoff = 0.5
    for attempt in range(max_retries + 1):
        try:
            with httpx.Client(timeout=10.0) as client:
                r = client.get(url)
                text = r.text
                # Try to parse JSON; if provider returns plain text on error, handle gracefully
                try:
                    data = r.json()
                except Exception:
                    return {"ok": False, "message": text[:1000], "raw": text}

                return {
                    "ok": True,
                    "data": {
                        "aoi": data.get("aoi"),
                        "road": data.get("road"),
                        "province": data.get("province"),
                        "district": data.get("district"),
                        "subdistrict": data.get("subdistrict"),
                        "raw": data,
                    },
                }
        except httpx.RequestError as e:
            if attempt < max_retries:
                time.sleep(backoff * (2 ** attempt))
                continue
            return {"ok": False, "message": str(e)}

@router.get("/reverse", response_model=GeoResponse)
async def reverse_geocode(
    lat: float = Query(..., ge=-90.0, le=90.0, description="Latitude"),
    lng: float = Query(..., ge=-180.0, le=180.0, description="Longitude"),
) -> GeoResponse:
    """Reverse geocode proxy endpoint.

    - Validates coordinates (query params)
    - Runs cached blocking fetch in threadpool to avoid blocking the event loop
    - Returns normalized JSON to clients

    See:
      - FastAPI validation: https://fastapi.tiangolo.com/tutorial/query-params/
      - Running sync in threadpool: https://www.starlette.io/concurrency/
    """
    # Use rounding precision consistent with cache key
    cache_key = round_coord_key(lat, lng, precision=5)
    
    try:
        result = await run_in_threadpool(fetch_longdo_sync, lat, lng)
    except RuntimeError as err:
        raise HTTPException(status_code=500, detail=str(err))

    if result.get("ok"):
        return {"ok": True, "data": result["data"]}

    # Non-ok result: return structured message (400 if provider error, 502 on upstream failure)
    msg = result.get("message", "unknown error")
    # Return 200 with ok:false to keep contract stable for the client; client can decide how to handle
    return {"ok": False, "message": msg}