"""Thin boto3 wrapper. Isolated here so ticket_repository never touches boto3 directly."""

import boto3

from app.config import settings

_resource = None


def get_table():
    global _resource
    if _resource is None:
        _resource = boto3.resource("dynamodb", region_name=settings.aws_region)
    return _resource.Table(settings.dynamodb_table_name)
