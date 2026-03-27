from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration (overridable via environment)."""

    model_config = SettingsConfigDict(env_prefix="SIGNALSCOPE_", env_file=".env", extra="ignore")

    data_dir: Path = Path(__file__).resolve().parent.parent.parent.parent / "data"
    db_path: Path | None = None
    upload_subdir: str = "uploads"
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    def resolved_db_path(self) -> Path:
        if self.db_path is not None:
            return Path(self.db_path)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        return self.data_dir / ".signalscope.db"

    def upload_dir(self) -> Path:
        p = self.data_dir / self.upload_subdir
        p.mkdir(parents=True, exist_ok=True)
        return p

    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
