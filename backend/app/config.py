"""Les réglages, lus dans les variables d'environnement ou le fichier `.env` du backend."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # extra="ignore" : une clé d'un autre outil dans le `.env` (DB_PORT…) ne fait pas planter.
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # La base Postgres de `docker compose -f docker-compose.dev.yaml up -d db`, sur le port 5432.
    # Un autre port (DB_PORT) ? Mets la même URL avec ce port dans backend/.env.
    database_url: str = "postgresql+psycopg://rescue:rescue@localhost:5432/rescue_atlas"


settings = Settings()
