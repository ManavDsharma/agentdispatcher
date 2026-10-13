"""Thin boto3 wrapper. Isolated here so repositories never touch boto3 directly."""

import boto3

from app.config import settings

_resource = None


def _get_resource():
    global _resource
    if _resource is None:
        kwargs = {"region_name": settings.resolved_aws_region}
        if settings.aws_access_key_id and settings.aws_secret_access_key:
            kwargs["aws_access_key_id"] = settings.aws_access_key_id
            kwargs["aws_secret_access_key"] = settings.aws_secret_access_key
        _resource = boto3.resource("dynamodb", **kwargs)
    return _resource


def get_table(table_name: str):
    return _get_resource().Table(table_name)
