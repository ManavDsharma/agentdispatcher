from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    servicenow_instance_url: Optional[str] = None
    servicenow_username: Optional[str] = None
    servicenow_password: Optional[str] = None

    # AWS credentials are picked up by boto3's standard credential chain
    # (env vars / shared config / instance role) — not modeled here.
    dynamodb_table_name: Optional[str] = None
    aws_region: str = "us-east-1"

    cors_origins: str = "http://localhost:5173"

    @property
    def servicenow_configured(self) -> bool:
        return bool(
            self.servicenow_instance_url
            and self.servicenow_username
            and self.servicenow_password
        )

    @property
    def dynamodb_configured(self) -> bool:
        return bool(self.dynamodb_table_name)

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
