from app.schemas.job import Job


async def save_job(
    database,
    job: Job,
):

    collection = database["jobs"]

    await collection.update_one(
        {
            "external_id": job.external_id,
            "source": job.source,
        },
        {
            "$set": job.model_dump()
        },
        upsert=True,
    )


async def get_job(
    database,
    external_id: str,
    source: str,
):

    collection = database["jobs"]

    document = await collection.find_one({
        "external_id": external_id,
        "source": source,
    })

    if document is None:
        return None

    document.pop("_id", None)

    return Job.model_validate(
        document
    )


async def get_jobs(
    database,
    limit: int = 50,
    offset: int = 0,
):

    collection = database["jobs"]

    cursor = (
        collection
        .find()
        .sort(
            "updated_at",
            -1,
        )
        .skip(offset)
        .limit(limit)
    )

    jobs = []

    async for document in cursor:

        document.pop("_id", None)

        try:

            jobs.append(
                Job.model_validate(
                    document
                )
            )

        except Exception:

            continue

    return jobs