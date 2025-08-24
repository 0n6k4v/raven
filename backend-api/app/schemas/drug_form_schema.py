from pydantic import BaseModel

class DrugFormBase(BaseModel):
    name: str

class DrugForm(DrugFormBase):
    id: int

    class Config:
        from_attributes = True