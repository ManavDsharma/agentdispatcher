from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # ============================================================
    # DATABASE
    # ============================================================

    dynamodb_table_name: Optional[str] = None
    categorization_matrix_table_name: Optional[str] = None
    roster_table_name: Optional[str] = None

    # ============================================================
    # AWS
    # ============================================================

    aws_region: Optional[str] = None

    # Explicit credentials are supported for local development.
    # In AWS, prefer IAM roles instead of static credentials.
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None

    # ============================================================
    # CORS
    # ============================================================

    cors_origins: str = "http://localhost:5173"

    # ============================================================
    # AI AGENT
    # ============================================================

    # Supported values:
    #   local
    #   agentcore
    agent_mode: str = "local"

    # Used only when AGENT_MODE=local.
    agent_local_url: str = "http://localhost:8080/invocations"

    # AgentCore Runtime ARN.
    agentcore_runtime_arn: Optional[str] = None

    # Optional AgentCore Runtime qualifier.
    agentcore_runtime_qualifier: Optional[str] = None

    # Optional actor used only when authentication does not provide one.
    agent_default_actor: Optional[str] = "dtp-web-user"

    # ============================================================
    # SERVICE NOW
    # ============================================================

    servicenow_instance_url: Optional[str] = None
    servicenow_username: Optional[str] = None
    servicenow_password: Optional[str] = None

    # ============================================================
    # COMPUTED PROPERTIES
    # ============================================================

    @property
    def dynamodb_configured(self) -> bool:
        return bool(self.dynamodb_table_name)

    @property
    def categorization_matrix_configured(self) -> bool:
        return bool(self.categorization_matrix_table_name)

    @property
    def roster_configured(self) -> bool:
        return bool(self.roster_table_name)

    @property
    def resolved_aws_region(self) -> str:
        return self.aws_region or "ap-south-1"

    @property
    def cors_origin_list(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.cors_origins.split(",")
            if origin.strip()
        ]

    @property
    def agentcore_configured(self) -> bool:
        return bool(
            self.agent_mode.strip().lower() == "agentcore"
            and self.agentcore_runtime_arn
        )


settings = Settings()