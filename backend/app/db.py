"""La connexion à Postgres, selon le tutoriel officiel :
https://fastapi.tiangolo.com/tutorial/sql-databases/
"""

from typing import Annotated

from fastapi import Depends
from sqlmodel import Session, create_engine

from app.config import settings

# Le moteur ne se connecte qu'à la première requête qui en a besoin. pool_pre_ping écarte une
# connexion coupée avant de la réutiliser : https://docs.sqlalchemy.org/en/21/core/pooling.html
engine = create_engine(settings.database_url, pool_pre_ping=True)


def get_session():
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_session)]
