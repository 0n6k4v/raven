from typing import List, Optional
import base64
import numpy as np

class VectorService:
    @staticmethod
    def decode_base64_vector(vector_base64: str) -> List[float]:
        if not vector_base64:
            raise ValueError("vector_base64 is required")
        raw = base64.b64decode(vector_base64)
        return np.frombuffer(raw, dtype=np.float32).tolist()

    @staticmethod
    def vector_to_pg_literal(vector: List[float]) -> str:
        if not isinstance(vector, (list, tuple)):
            raise ValueError("vector must be a list or tuple")
        return "[" + ",".join(format(float(x), ".8f") for x in vector) + "]"

    @staticmethod
    def build_vector_from_inputs(vector: Optional[List[float]] = None, vector_base64: Optional[str] = None) -> List[float]:
        if vector_base64:
            return VectorService.decode_base64_vector(vector_base64)
        if vector and isinstance(vector, (list, tuple)) and len(vector) > 0:
            return [float(x) for x in vector]

        raise ValueError("Either vector or vector_base64 is required")