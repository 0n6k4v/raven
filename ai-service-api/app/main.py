from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import inference_router

def create_app() -> FastAPI:
    app = FastAPI()

    allowed_origins = [
        "http://localhost",
        "http://localhost:8000",
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(inference_router, prefix="/api")

    @app.get("/", tags=["Health"])
    async def main():
        return {"message": "Raven AI เริ่มต้นทำงานแล้ว"}

    return app

app = create_app()