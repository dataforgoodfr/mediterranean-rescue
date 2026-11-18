"""L'accès à la table des opérations : les requêtes, et rien d'autre. Ni HTTP ni règle métier."""

from collections.abc import Sequence

from sqlmodel import Session, col, select

from app.models import Operation


def list_operations(session: Session) -> Sequence[Operation]:
    """Toutes les opérations, de la plus ancienne à la plus récente (puis par id, pour un ordre
    stable entre deux opérations du même jour)."""
    return session.exec(select(Operation).order_by(col(Operation.date), col(Operation.id))).all()
