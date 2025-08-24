from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.config.db_config import get_async_db
from app.schemas.drug_form_schema import DrugForm as DrugFormSchema
from app.models.drug_form_model import DrugForm

router = APIRouter(tags=["narcotics"])

@router.get("/drug-forms", response_model=List[DrugFormSchema])
async def get_drug_forms(db: AsyncSession = Depends(get_async_db)):
    try:
        result = await db.execute(select(DrugForm))
        drug_forms = result.scalars().all()
        return drug_forms
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching drug forms: {str(e)}")