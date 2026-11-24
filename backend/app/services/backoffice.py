"""Les règles métier du backoffice, entre les routes et l'accès à la base."""

from sqlmodel import Session

from app.crud import operations as crud
from app.dtos import backoffice as dtos
from app.models import OperationBackoffice


def list_operations(
    session: Session, filters: dtos.BackofficeOperationsFilters
) -> list[OperationBackoffice]:
    """Liste les opérations du backoffice selon les filtres donnés,
    et renseigne les champs manquants."""
    operations = [
        OperationBackoffice.model_validate(operation)
        for operation in crud.list_operations(
            session, crud.OperationFilters(**filters.model_dump())
        )
    ]

    omitted_missing_fields = ["missing_fields"]

    for operation in operations:
        missing: list[str] = []
        for field in OperationBackoffice.model_fields:
            if field in omitted_missing_fields:
                continue
            if getattr(operation, field) is None:
                missing.append(field)
        operation.missing_fields = missing if missing else None

    return operations
