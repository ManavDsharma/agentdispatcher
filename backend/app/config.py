from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    servicenow_instance_url: Optional[str] = None
    servicenow_username: Optional[str] = None
    servicenow_password: Optional[str] = None

    similar_issues_api_url: Optional[str] = None
    similar_issues_api_key: Optional[str] = None

    cors_origins: str = "http://localhost:5173"

    @property
    def servicenow_configured(self) -> bool:
        return bool(
            self.servicenow_instance_url
            and self.servicenow_username
            and self.servicenow_password
        )

    @property
    def similar_issues_configured(self) -> bool:
        return bool(self.similar_issues_api_url)

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
