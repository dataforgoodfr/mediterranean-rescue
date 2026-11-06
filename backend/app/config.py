"""Les réglages, lus dans les variables d'environnement ou le fichier `.env` du backend."""

from typing import Self

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # extra="ignore" : une clé d'un autre outil dans le `.env` (DB_PORT…) ne fait pas planter.
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # La base Postgres de `docker compose -f docker-compose.dev.yaml up -d db`, sur le port 5432.
    # Un autre port (DB_PORT) ? Mets la même URL avec ce port dans backend/.env.
    database_url: str = "postgresql+psycopg://rescue:rescue@localhost:5432/rescue_atlas"

    # Sur Clever Cloud, la base liée à l'app arrive dans POSTGRESQL_ADDON_URI.
    postgresql_addon_uri: str | None = None

    @model_validator(mode="after")
    def use_clever_cloud_database(self) -> Self:
        # DATABASE_URL, s'il est donné, passe avant la base de Clever Cloud.
        if self.postgresql_addon_uri and "database_url" not in self.model_fields_set:
            self.database_url = self.postgresql_addon_uri
        # Une adresse en postgresql:// prendrait le pilote psycopg2, qu'on n'installe pas.
        # https://docs.sqlalchemy.org/en/21/dialects/postgresql.html#dialect-postgresql-psycopg
        for prefix in ("postgresql://", "postgres://"):
            if self.database_url.startswith(prefix):
                self.database_url = "postgresql+psycopg://" + self.database_url.removeprefix(prefix)
        return self


settings = Settings()
