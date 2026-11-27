"""Les routes du backoffice : le HTTP seulement. Le travail se fait dans app/services/.
Note: cette partie nécessitera que l'utilisateur soit authentifié.
"""

from typing import Annotated

from fastapi import APIRouter, Query

from app.config import settings
from app.crud import operations as operations_crud
from app.db import SessionDep
from app.models import OperationBackoffice
from app.services import backoffice as service

router = APIRouter()


# Route disponible en dev seulement, tant que l'API du backoffice
# n'est pas utilisée par le front
if settings.dev:

    @router.get("/api/backoffice/operations")
    def list_operations(
        session: SessionDep, filters: Annotated[operations_crud.OperationFilters, Query()]
    ) -> list[OperationBackoffice]:
        """Liste les opérations, de la plus ancienne à la plus récente."""
        operations = service.list_operations(session, filters)

        return operations
