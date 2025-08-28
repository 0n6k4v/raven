import os
from typing import Optional

def get_ai_service_url() -> str:
    return os.getenv("AI_SERVICE_URL")