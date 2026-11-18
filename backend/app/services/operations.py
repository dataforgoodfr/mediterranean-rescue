"""Les règles métier des opérations, entre les routes et l'accès à la base. Pour l'instant, une
seule : ne rendre que la forme publique d'une opération."""

from sqlmodel import Session

from app.crud import operations as crud
from app.models import OperationPublic


def list_operations(session: Session) -> list[OperationPublic]:
    return [
        OperationPublic.model_validate(operation) for operation in crud.list_operations(session)
    ]
