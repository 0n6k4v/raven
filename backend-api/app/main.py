from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import app.models
from app.routes import ( 
    auth_router, user_router, role_router, 
    province_router, district_router, subdistrict_router, 
    narcotic_router, drug_form_router 
)

def create_app() -> FastAPI:
    app = FastAPI()

    allowed_origins = [
        "http://localhost",
        "http://frontend",
        "http://localhost:80",
        "http://frontend:80"
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth_router, prefix="/api")
    app.include_router(user_router, prefix="/api")
    app.include_router(role_router, prefix="/api")
    app.include_router(province_router, prefix="/api")
    app.include_router(district_router, prefix="/api")
    app.include_router(subdistrict_router, prefix="/api")
    app.include_router(narcotic_router, prefix="/api")
    app.include_router(drug_form_router, prefix="/api")

    @app.get("/", tags=["Health"])
    async def main():
        return {"message": "Raven API เริ่มต้นทำงานแล้ว"}

    return app

app = create_app()