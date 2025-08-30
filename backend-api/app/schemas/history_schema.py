from datetime import date, time, datetime
from decimal import Decimal
from typing import Optional, Union, Dict, Any
from pydantic import BaseModel, field_validator, ConfigDict

class HistoryBase(BaseModel):
    exhibit_id: Optional[int] = None
    subdistrict_id: int
    discovery_date: Optional[date] = None
    discovery_time: Optional[time] = None
    discovered_by: str = "system"
    photo_url: Optional[str] = None
    quantity: Optional[Union[Decimal, float]] = None
    latitude: float
    longitude: float
    ai_confidence: Optional[float] = None

    @field_validator('discovery_date', mode='before')
    @classmethod
    def format_date(cls, value):
        if isinstance(value, str):
            try:
                return datetime.strptime(value, "%Y-%m-%d").date()
            except ValueError:
                raise ValueError("Invalid date format, expected YYYY-MM-DD")
        return value

    @field_validator('discovery_time', mode='before')
    @classmethod
    def format_time(cls, value):
        if isinstance(value, str):
            try:
                return datetime.strptime(value, "%H:%M").time()
            except ValueError:
                try:
                    time_obj = datetime.strptime(value, "%H:%M:%S").time()
                    return time(time_obj.hour, time_obj.minute)
                except ValueError:
                    raise ValueError("Invalid time format, expected HH:MM or HH:MM:SS")
        return value

    @field_validator('ai_confidence', mode='before')
    @classmethod
    def validate_confidence(cls, value):
        if value is not None:
            if value < 0 or value > 100:
                raise ValueError("AI confidence must be between 0 and 100")
        return value

class History(HistoryBase):
    id: int
    created_at: datetime
    modified_at: datetime
    modified_by: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

class HistoryWithExhibit(History):
    exhibit: Optional[Dict[str, Any]] = None
    subdistrict_name: Optional[str] = None
    district_name: Optional[str] = None
    province_name: Optional[str] = None
    discoverer_name: Optional[str] = None
    modifier_name: Optional[str] = None