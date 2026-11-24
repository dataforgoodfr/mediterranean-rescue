from pydantic import BaseModel

from app.models import OperationState


class BackofficeOperationsFilters(BaseModel):
    state: OperationState | None = None
