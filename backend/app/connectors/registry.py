"""Registered ticket platforms. Add a new platform by adding one entry here."""

from app.connectors.custom import CustomConnector
from app.connectors.servicenow import ServiceNowConnector

CONNECTORS = {
    "servicenow": ServiceNowConnector(),
    "custom": CustomConnector(),
}
