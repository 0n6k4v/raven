from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import base64
import numpy as np

def decode_base64_vector(vector_base64: str) -> List[float]:
    if not vector_base64:
        raise ValueError("vector_base64 is required")
    raw = base64.b64decode(vector_base64)
    return np.frombuffer(raw, dtype=np.float32).tolist()

def vector_to_pg_literal(vector: List[float]) -> str:
    if not isinstance(vector, (list, tuple)):
        raise ValueError("vector must be a list")
    return f"[{','.join(str(float(x)) for x in vector)}]"

async def search_similar_narcotics_with_vector(
    db: AsyncSession,
    vector: Optional[List[float]] = None,
    vector_base64: Optional[str] = None,
    top_k: int = 3,
    similarity_threshold: float = 0.05
) -> List[Dict[str, Any]]:
    if vector_base64:
        vector = decode_base64_vector(vector_base64)
    if not vector or len(vector) == 0:
        raise ValueError("Either vector or vector_base64 is required")

    vector_str = vector_to_pg_literal(vector)

    query = text("""
        WITH query_vector AS (
            SELECT :vector::vector AS v
        ),
        similarity_calc AS (
            SELECT 
                n.id as narcotic_id,
                n.drug_type as drug_type,
                n.drug_category as drug_category,
                n.effect as description,
                1 - (niv.image_vector <=> (SELECT v FROM query_vector)) as similarity
            FROM 
                narcotics_image_vectors niv
            JOIN 
                narcotics n ON niv.narcotic_id = n.id
            ORDER BY 
                niv.image_vector <=> (SELECT v FROM query_vector)
            LIMIT :top_k
        )
        SELECT * FROM similarity_calc
        WHERE similarity > :threshold
    """)

    result = await db.execute(
        query,
        {"vector": vector_str, "top_k": top_k, "threshold": similarity_threshold}
    )
    rows = result.mappings().all()

    similar_items = [
        {
            "narcotic_id": row["narcotic_id"],
            "name": row["drug_type"] or f"ยาเสพติด #{row['narcotic_id']}",
            "drug_type": row["drug_type"],
            "drug_category": row["drug_category"],
            "description": row["description"],
            "similarity": float(row["similarity"])
        }
        for row in rows
    ]

    return similar_items