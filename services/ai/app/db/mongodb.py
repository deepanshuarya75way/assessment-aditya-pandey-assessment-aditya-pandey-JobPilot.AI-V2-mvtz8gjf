from pymongo import AsyncMongoClient

from app.core.config import settings


def create_mongo_client():

    return AsyncMongoClient(
        settings.mongodb_uri,
        tls=True,
        serverSelectionTimeoutMS=20000,
        connectTimeoutMS=20000,
    )