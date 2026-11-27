"""Les routes des opérations : le HTTP seulement. Le travail se fait dans app/services/."""

from fastapi import APIRouter

from app.db import SessionDep
from app.models import OperationPublic
from app.services import operations as service

router = APIRouter()


@router.get("/api/operations")
def list_operations(session: SessionDep) -> list[OperationPublic]:
    """Liste les opérations publiées, de la plus ancienne à la plus récente."""
    return service.list_operations(session)
