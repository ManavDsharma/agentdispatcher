"""Shared helpers for turning raw boto3/DynamoDB items into JSON-safe values."""

from decimal import Decimal


def json_safe(value):
    if isinstance(value, Decimal):
        return int(value) if value == value.to_integral_value() else float(value)
    if isinstance(value, dict):
        return {k: json_safe(v) for k, v in value.items()}
    if isinstance(value, list):
        return [json_safe(v) for v in value]
    return value


def json_safe_item(item: dict) -> dict:
    return {k: json_safe(v) for k, v in item.items()}
