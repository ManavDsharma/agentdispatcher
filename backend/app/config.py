from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    dynamodb_table_name: Optional[str] = None
    categorization_matrix_table_name: Optional[str] = None
    roster_table_name: Optional[str] = None
    aws_region: Optional[str] = None

    # Explicit AWS credentials, read directly from .env and passed to boto3.
    # Leave both blank to fall back to boto3's own credential chain instead
    # (a shared ~/.aws/credentials profile or an instance role).
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None

    cors_origins: str = "http://localhost:5173"

    # AI Agent bridge — see docs/AI_AGENT_INTEGRATION.md. "local" talks HTTP to
    # dtp_agent's local dev server; "agentcore" talks to a deployed AgentCore
    # Runtime via boto3. Switching later is a pure env change, no code change.
    agent_mode: str = "local"
    agent_local_url: str = "http://localhost:8080/invocations"
    agentcore_runtime_arn: Optional[str] = None
    agentcore_runtime_qualifier: Optional[str] = None

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
        # AWS_REGION= (present but blank) must not win over the default.
        return self.aws_region or "us-east-1"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
