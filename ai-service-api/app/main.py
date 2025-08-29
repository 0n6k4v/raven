from fastapi import FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware
from app.routes import inference_router, vector_router
from app.services.model_manager_service import ModelManager
import asyncio

def create_app() -> FastAPI:
    app = FastAPI()

    allowed_origins = [
        "http://localhost",
        "http://localhost:8000",
        "http://localhost:8080"
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(inference_router, prefix="/api")
    app.include_router(vector_router, prefix="/api")

    model_mgr = ModelManager()

    @app.get("/", tags=["Health"])
    async def main():
        return {"message": "Raven AI เริ่มต้นทำงานแล้ว"}

    @app.get("/ready", tags=["Health"])
    async def ready():
        if model_mgr.is_ready():
            return {"ready": True}
        return Response(content='{"ready":false}', media_type="application/json", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)

    @app.get("/live", tags=["Health"])
    async def live():
        return {"alive": True}

    @app.on_event("startup")
    async def _startup_wait_models():
        ok = await asyncio.to_thread(model_mgr.wait_for_models, 120)
        if ok:
            print("[startup] models loaded")
            try:
                import importlib
                inference_mod = importlib.import_module("app.routes.inference")
                seg_model = model_mgr.get_segmentation_model()
                if seg_model is not None and hasattr(inference_mod, "_service"):
                    inference_mod._service.set_model(seg_model)
                    print("[startup] segmentation model attached to route service")
            except Exception as e:
                print(f"[startup] failed to attach model to route: {e}")
        else:
            print("[startup] model loading timed out (120s)")

    return app

app = create_app()