"""L'accès à la table des opérations : les requêtes, et rien d'autre. Ni HTTP ni règle métier."""

from collections.abc import Sequence

from pydantic import BaseModel
from sqlmodel import Session, col, select

from app.models import Operation, OperationState


class OperationFilters(BaseModel):
    state: OperationState | None = None


def list_operations(session: Session, filters: OperationFilters) -> Sequence[Operation]:
    """Les opérations, éventuellement filtrées par état,
    triées de la plus ancienne à la plus récente
    (puis par id, pour un ordre stable entre deux opérations du même jour)."""
    stmt = select(Operation)
    if filters.state is not None:
        stmt = stmt.where(Operation.state == filters.state)

    return session.exec(stmt.order_by(col(Operation.date), col(Operation.id))).all()
