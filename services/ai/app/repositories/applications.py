from datetime import datetime, timezone

from bson import ObjectId


VALID_STATUSES = {
    "saved",
    "applied",
    "assessment",
    "interview",
    "offer",
    "rejected",
}


async def save_application(
    database,
    user_id,
    job,
    resume,
    application_report,
):

    collection = database["applications"]

    document = {

        "user_id": user_id,

        "job_external_id": job.external_id,

        "job_source": job.source,

        "job": job.model_dump(),

        "resume": resume.model_dump(),

        "application": (
            application_report.model_dump()
            if hasattr(
                application_report,
                "model_dump",
            )
            else application_report
        ),

        "status": "saved",

        "created_at": datetime.now(
            timezone.utc
        ),

        "updated_at": datetime.now(
            timezone.utc
        ),
    }

    result = await collection.insert_one(
        document
    )

    return str(
        result.inserted_id
    )


async def get_applications(
    database,
    user_id,
    limit: int = 50,
    offset: int = 0,
    status: str | None = None,
):

    collection = database["applications"]

    query = {
        "user_id": user_id
    }

    if status is not None:

        query["status"] = status

    cursor = (
        collection
        .find(query)
        .sort(
            "updated_at",
            -1,
        )
        .skip(offset)
        .limit(limit)
    )

    applications = []

    async for document in cursor:

        document["_id"] = str(
            document["_id"]
        )

        applications.append(
            document
        )

    return applications


async def get_application(
    database,
    user_id,
    application_id,
):

    if not ObjectId.is_valid(
        application_id
    ):
        return None

    collection = database["applications"]

    document = await collection.find_one({
        "_id": ObjectId(
            application_id
        ),
        "user_id": user_id,
    })

    if document is None:
        return None

    document["_id"] = str(
        document["_id"]
    )

    return document


async def update_application_status(
    database,
    user_id,
    application_id,
    status,
):

    if status not in VALID_STATUSES:

        raise ValueError(
            f"Invalid status: {status}"
        )

    if not ObjectId.is_valid(
        application_id
    ):
        return False

    collection = database["applications"]

    result = await collection.update_one(

        {
            "_id": ObjectId(
                application_id
            ),
            "user_id": user_id,
        },

        {
            "$set": {
                "status": status,
                "updated_at": datetime.now(
                    timezone.utc
                ),
            }
        },
    )

    return result.modified_count > 0