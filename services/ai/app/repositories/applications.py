from datetime import datetime, timezone

from bson import ObjectId
from fastapi.concurrency import run_in_threadpool


VALID_STATUSES = {
    "saved",
    "applied",
    "assessment",
    "interview",
    "offer",
    "rejected",
}


async def get_or_calculate_company_trust(database, job):
    """
    Return cached company trust data when available.
    Otherwise calculate it once and cache it in the jobs collection.
    """

    job_key = {
        "external_id": job.external_id,
        "source": job.source,
    }

    jobs_collection = database["jobs"]

    job_document = await jobs_collection.find_one(
        job_key,
        {"company_trust": 1},
    )

    cached_trust = (
        job_document.get("company_trust")
        if job_document
        else None
    )

    if isinstance(cached_trust, dict):

        cached_score = cached_trust.get("trust_score")

        if (
            isinstance(cached_score, (int, float))
            and not isinstance(cached_score, bool)
            and 0 <= cached_score <= 100
        ):
            return cached_trust

    # Calculate trust only when a valid cached report is unavailable.
    from app.services.company.job_trust import get_company_trust

    report = await run_in_threadpool(
        get_company_trust,
        job,
    )

    trust_data = (
        report.model_dump()
        if hasattr(report, "model_dump")
        else report
    )

    if not isinstance(trust_data, dict):
        raise ValueError("Invalid company trust report")

    trust_score = trust_data.get("trust_score")

    if (
        not isinstance(trust_score, (int, float))
        or isinstance(trust_score, bool)
        or not 0 <= trust_score <= 100
    ):
        raise ValueError("Invalid company trust score")

    now = datetime.now(timezone.utc)

    # Cache the report at job level so other applications
    # for this job can reuse it.
    await jobs_collection.update_one(
        job_key,
        {
            "$set": {
                "company_trust": trust_data,
                "company_trust_updated_at": now,
            },
            "$setOnInsert": job.model_dump(),
        },
        upsert=True,
    )

    return trust_data


async def save_application(
    database,
    user_id,
    job,
    resume,
    application_report,
):

    collection = database["applications"]

    # Trust calculation must not prevent application creation.
    company_trust = None

    try:

        company_trust = await get_or_calculate_company_trust(
            database,
            job,
        )

    except Exception as error:

        print(
            f"Company trust calculation skipped for "
            f"{job.company}: {error}"
        )

    now = datetime.now(timezone.utc)

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

        "created_at": now,

        "updated_at": now,
    }

    # Store both the complete report and a simple numeric field.
    # The numeric field makes MongoDB filtering straightforward.
    if company_trust:

        document["company_trust"] = company_trust

        document["company_trust_score"] = int(
            round(company_trust["trust_score"])
        )

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