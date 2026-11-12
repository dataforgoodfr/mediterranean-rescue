"""Les réglages, lus dans les variables d'environnement ou le fichier `.env` du backend."""

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # extra="ignore" : une clé d'un autre outil dans le `.env` (DB_PORT…) ne fait pas planter.
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # La base Postgres de `docker compose -f docker-compose.dev.yaml up -d db`, sur le port 5432.
    # Un autre port (DB_PORT) ? Mets la même URL avec ce port dans backend/.env.
    database_url: str = "postgresql+psycopg://rescue:rescue@localhost:5432/rescue_atlas"

    @field_validator("database_url")
    @classmethod
    def use_psycopg(cls, url: str) -> str:
        # Les hébergeurs donnent souvent l'adresse en postgresql:// : SQLAlchemy prendrait alors
        # le pilote psycopg2, qu'on n'installe pas. On passe au pilote psycopg 3.
        # https://docs.sqlalchemy.org/en/21/dialects/postgresql.html#dialect-postgresql-psycopg
        for prefix in ("postgresql://", "postgres://"):
            if url.startswith(prefix):
                return "postgresql+psycopg://" + url.removeprefix(prefix)
        return url


settings = Settings()
