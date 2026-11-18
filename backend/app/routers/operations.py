"""Les routes des opérations : le HTTP seulement. Le travail se fait dans app/services/."""

from fastapi import APIRouter

from app.db import SessionDep
from app.models import OperationPublic
from app.services import operations as service

router = APIRouter()


@router.get("/api/operations")
def list_operations(session: SessionDep) -> list[OperationPublic]:
    """Every operation, oldest first. Positions are in decimal degrees (WGS 84), north and east
    positive."""
    return service.list_operations(session)
