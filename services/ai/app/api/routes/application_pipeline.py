from datetime import datetime, timezone
import math
import re
from typing import Any

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field

from app.api.dependencies import get_current_user
from app.repositories.applications import get_or_calculate_company_trust
from app.schemas.job import Job


router = APIRouter(
    prefix="/api/applications",
    tags=["Application Pipeline"],
)


VALID_STATUSES = {
    "saved",
    "applied",
    "assessment",
    "interview",
    "offer",
    "rejected",
}


SORT_FIELDS = {
    "updated_at": "updated_at",
    "created_at": "created_at",
    "fit_score": "application.analysis.fit_score",
    "company": "job.company",
    "title": "job.title",
    "company_trust_score": "company_trust_score",
}


SCORE_FIELDS = (
    "application.analysis.fit_score",
    "application.analysis.overall_score",
    "analysis.fit_score",
    "fit_score",
)


TRUST_FIELDS = (
    "company_trust_score",
    "company_trust.trust_score",
)


class PipelineViewCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=60)
    filters: dict[str, Any] = Field(default_factory=dict)


class PipelineViewUpdateRequest(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=60,
    )

    filters: dict[str, Any] | None = None


def build_application_query(
    user_id: str,
    search: str | None,
    status: str | None,
    min_match: float | None,
    max_match: float | None,
    min_trust: float | None,
    max_trust: float | None,
) -> dict:

    conditions = [
        {
            "user_id": user_id
        }
    ]

    # Keyword search.
    if search:

        safe_search = re.escape(
            search.strip()
        )

        if safe_search:

            conditions.append({
                "$or": [
                    {
                        "job.title": {
                            "$regex": safe_search,
                            "$options": "i",
                        }
                    },
                    {
                        "job.company": {
                            "$regex": safe_search,
                            "$options": "i",
                        }
                    },
                    {
                        "job.location": {
                            "$regex": safe_search,
                            "$options": "i",
                        }
                    },
                ]
            })

    # Application stage.
    if status:

        conditions.append({
            "status": status
        })

    # Resume match range.
    if min_match is not None or max_match is not None:

        score_range = {}

        if min_match is not None:
            score_range["$gte"] = min_match

        if max_match is not None:
            score_range["$lte"] = max_match

        conditions.append({
            "$or": [
                {
                    field: score_range
                }
                for field in SCORE_FIELDS
            ]
        })

    # Company trust range.
    if min_trust is not None or max_trust is not None:

        trust_range = {}

        if min_trust is not None:
            trust_range["$gte"] = min_trust

        if max_trust is not None:
            trust_range["$lte"] = max_trust

        conditions.append({
            "$or": [
                {
                    field: trust_range
                }
                for field in TRUST_FIELDS
            ]
        })

    if len(conditions) == 1:
        return conditions[0]

    return {
        "$and": conditions
    }


def normalize_saved_filters(
    filters: dict[str, Any] | None,
) -> dict:

    filters = filters or {}

    search = str(
        filters.get("search") or ""
    ).strip()

    if len(search) > 120:

        raise HTTPException(
            status_code=400,
            detail="Search text cannot exceed 120 characters",
        )

    status = str(
        filters.get("status") or ""
    ).strip()

    if status and status not in VALID_STATUSES:

        raise HTTPException(
            status_code=400,
            detail="Invalid application status in saved view",
        )

    def parse_score(value, field_name):

        if value is None or value == "":
            return None

        try:

            score = float(value)

        except (TypeError, ValueError):

            raise HTTPException(
                status_code=400,
                detail=f"{field_name} must be a number",
            )

        if not 0 <= score <= 100:

            raise HTTPException(
                status_code=400,
                detail=f"{field_name} must be between 0 and 100",
            )

        return score

    min_match = parse_score(
        filters.get("min_match"),
        "Minimum match score",
    )

    max_match = parse_score(
        filters.get("max_match"),
        "Maximum match score",
    )

    min_trust = parse_score(
        filters.get("min_trust"),
        "Minimum trust score",
    )

    max_trust = parse_score(
        filters.get("max_trust"),
        "Maximum trust score",
    )

    if (
        min_match is not None
        and max_match is not None
        and min_match > max_match
    ):

        raise HTTPException(
            status_code=400,
            detail="Minimum match score cannot exceed maximum match score",
        )

    if (
        min_trust is not None
        and max_trust is not None
        and min_trust > max_trust
    ):

        raise HTTPException(
            status_code=400,
            detail="Minimum trust score cannot exceed maximum trust score",
        )

    sort_by = str(
        filters.get("sort_by") or "updated_at"
    )

    if sort_by not in SORT_FIELDS:

        raise HTTPException(
            status_code=400,
            detail="Invalid sorting field in saved view",
        )

    sort_order = str(
        filters.get("sort_order") or "desc"
    ).lower()

    if sort_order not in {"asc", "desc"}:

        raise HTTPException(
            status_code=400,
            detail="Sort order must be asc or desc",
        )

    try:

        page = int(
            filters.get("page", 1)
        )

        page_size = int(
            filters.get("page_size", 10)
        )

    except (TypeError, ValueError):

        raise HTTPException(
            status_code=400,
            detail="Page and page size must be integers",
        )

    if page < 1:

        raise HTTPException(
            status_code=400,
            detail="Page must be at least 1",
        )

    if page_size < 1 or page_size > 50:

        raise HTTPException(
            status_code=400,
            detail="Page size must be between 1 and 50",
        )

    return {
        "search": search,
        "status": status,
        "min_match": min_match,
        "max_match": max_match,
        "min_trust": min_trust,
        "max_trust": max_trust,
        "sort_by": sort_by,
        "sort_order": sort_order,
        "page": page,
        "page_size": page_size,
    }


def serialize_view(document: dict) -> dict:

    document["_id"] = str(
        document["_id"]
    )

    return document


# ============================================================
# APPLICATION FILTERING, SORTING AND PAGINATION
# ============================================================

@router.get("/pipeline")
async def get_application_pipeline(
    request: Request,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=50),
    search: str | None = Query(default=None, max_length=120),
    status: str | None = None,
    min_match: float | None = Query(default=None, ge=0, le=100),
    max_match: float | None = Query(default=None, ge=0, le=100),
    min_trust: float | None = Query(default=None, ge=0, le=100),
    max_trust: float | None = Query(default=None, ge=0, le=100),
    sort_by: str = "updated_at",
    sort_order: str = "desc",
    user=Depends(get_current_user),
):

    if status and status not in VALID_STATUSES:

        raise HTTPException(
            status_code=400,
            detail="Invalid application status",
        )

    if (
        min_match is not None
        and max_match is not None
        and min_match > max_match
    ):

        raise HTTPException(
            status_code=400,
            detail="Minimum match score cannot exceed maximum match score",
        )

    if (
        min_trust is not None
        and max_trust is not None
        and min_trust > max_trust
    ):

        raise HTTPException(
            status_code=400,
            detail="Minimum trust score cannot exceed maximum trust score",
        )

    if sort_by not in SORT_FIELDS:

        raise HTTPException(
            status_code=400,
            detail="Invalid sorting field",
        )

    sort_order = sort_order.lower()

    if sort_order not in {"asc", "desc"}:

        raise HTTPException(
            status_code=400,
            detail="Sort order must be asc or desc",
        )

    database = request.app.state.database

    query = build_application_query(
        user_id=user["_id"],
        search=search,
        status=status,
        min_match=min_match,
        max_match=max_match,
        min_trust=min_trust,
        max_trust=max_trust,
    )

    collection = database["applications"]

    total_count = await collection.count_documents(
        query
    )

    offset = (page - 1) * page_size

    direction = (
        1 if sort_order == "asc" else -1
    )

    cursor = (
        collection
        .find(query)
        .sort([
            (SORT_FIELDS[sort_by], direction),
            ("_id", -1),
        ])
        .skip(offset)
        .limit(page_size)
    )

    applications = []

    async for document in cursor:

        document["_id"] = str(
            document["_id"]
        )

        applications.append(
            document
        )

    total_pages = (
        math.ceil(total_count / page_size)
        if total_count
        else 0
    )

    return {
        "success": True,
        "applications": applications,
        "count": len(applications),
        "total_count": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "has_previous": page > 1 and total_count > 0,
        "has_next": page < total_pages,
    }


# ============================================================
# ONE-TIME BACKFILL FOR EXISTING APPLICATIONS
# ============================================================

@router.post("/trust/backfill")
async def backfill_company_trust_scores(
    request: Request,
    user=Depends(get_current_user),
):

    database = request.app.state.database

    applications_collection = database[
        "applications"
    ]

    cursor = applications_collection.find({
        "user_id": user["_id"],
        "$or": [
            {
                "company_trust_score": {
                    "$exists": False
                }
            },
            {
                "company_trust_score": None
            },
        ],
    })

    unique_jobs = {}

    # Collect distinct jobs which do not have a saved trust score.
    async for application in cursor:

        job_data = application.get("job") or {}

        external_id = (
            application.get("job_external_id")
            or job_data.get("external_id")
        )

        source = (
            application.get("job_source")
            or job_data.get("source")
        )

        if not external_id or not source:
            continue

        key = (external_id, source)

        if key not in unique_jobs:
            unique_jobs[key] = job_data

    updated_applications = 0
    processed_jobs = 0
    failed_jobs = []

    for (external_id, source), job_data in unique_jobs.items():

        try:

            job = Job.model_validate(
                job_data
            )

            # This reuses cached job trust where available.
            trust_data = await get_or_calculate_company_trust(
                database,
                job,
            )

            trust_score = trust_data.get(
                "trust_score"
            )

            if trust_score is None:
                raise ValueError("Trust score missing from report")

            result = await applications_collection.update_many(

                {
                    "user_id": user["_id"],
                    "job_external_id": external_id,
                    "job_source": source,
                },

                {
                    "$set": {
                        "company_trust": trust_data,
                        "company_trust_score": int(
                            round(trust_score)
                        ),
                    }
                },

            )

            updated_applications += result.modified_count

            processed_jobs += 1

        except Exception as error:

            failed_jobs.append({
                "external_id": external_id,
                "source": source,
                "error": str(error),
            })

    return {
        "success": True,
        "processed_jobs": processed_jobs,
        "updated_applications": updated_applications,
        "failed_jobs": failed_jobs,
        "message": (
            "Company trust backfill completed."
            if not failed_jobs
            else "Backfill completed with some failures. You can retry."
        ),
    }


# ============================================================
# LIST SAVED PIPELINE VIEWS
# ============================================================

@router.get("/views")
async def list_pipeline_views(
    request: Request,
    user=Depends(get_current_user),
):

    collection = request.app.state.database[
        "pipeline_views"
    ]

    cursor = (
        collection
        .find({
            "user_id": user["_id"]
        })
        .sort("updated_at", -1)
    )

    views = []

    async for document in cursor:

        views.append(
            serialize_view(document)
        )

    return {
        "success": True,
        "views": views,
    }


# ============================================================
# CREATE SAVED PIPELINE VIEW
# ============================================================

@router.post("/views")
async def create_pipeline_view(
    request: Request,
    data: PipelineViewCreateRequest,
    user=Depends(get_current_user),
):

    name = data.name.strip()

    if not name:

        raise HTTPException(
            status_code=400,
            detail="View name cannot be empty",
        )

    database = request.app.state.database

    collection = database["pipeline_views"]

    existing = await collection.find_one({

        "user_id": user["_id"],

        "name": {
            "$regex": f"^{re.escape(name)}$",
            "$options": "i",
        },

    })

    if existing:

        raise HTTPException(
            status_code=409,
            detail="A saved view with this name already exists",
        )

    now = datetime.now(timezone.utc)

    document = {

        "user_id": user["_id"],

        "name": name,

        "filters": normalize_saved_filters(
            data.filters
        ),

        "created_at": now,

        "updated_at": now,

    }

    result = await collection.insert_one(
        document
    )

    saved_view = await collection.find_one({

        "_id": result.inserted_id,

        "user_id": user["_id"],

    })

    return {
        "success": True,
        "view": serialize_view(saved_view),
    }


# ============================================================
# UPDATE / RENAME SAVED PIPELINE VIEW
# ============================================================

@router.patch("/views/{view_id}")
async def update_pipeline_view(
    request: Request,
    view_id: str,
    data: PipelineViewUpdateRequest,
    user=Depends(get_current_user),
):

    if not ObjectId.is_valid(view_id):

        raise HTTPException(
            status_code=404,
            detail="Saved view not found",
        )

    updates = {}

    collection = request.app.state.database[
        "pipeline_views"
    ]

    if data.name is not None:

        name = data.name.strip()

        if not name:

            raise HTTPException(
                status_code=400,
                detail="View name cannot be empty",
            )

        existing = await collection.find_one({

            "user_id": user["_id"],

            "name": {
                "$regex": f"^{re.escape(name)}$",
                "$options": "i",
            },

            "_id": {
                "$ne": ObjectId(view_id)
            },

        })

        if existing:

            raise HTTPException(
                status_code=409,
                detail="A saved view with this name already exists",
            )

        updates["name"] = name

    if data.filters is not None:

        updates["filters"] = normalize_saved_filters(
            data.filters
        )

    if not updates:

        raise HTTPException(
            status_code=400,
            detail="Provide a view name or filters to update",
        )

    updates["updated_at"] = datetime.now(
        timezone.utc
    )

    result = await collection.update_one(

        {
            "_id": ObjectId(view_id),
            "user_id": user["_id"],
        },

        {
            "$set": updates
        },

    )

    if result.matched_count == 0:

        raise HTTPException(
            status_code=404,
            detail="Saved view not found",
        )

    document = await collection.find_one({

        "_id": ObjectId(view_id),

        "user_id": user["_id"],

    })

    return {
        "success": True,
        "view": serialize_view(document),
    }


# ============================================================
# DELETE SAVED PIPELINE VIEW
# ============================================================

@router.delete("/views/{view_id}")
async def delete_pipeline_view(
    request: Request,
    view_id: str,
    user=Depends(get_current_user),
):

    if not ObjectId.is_valid(view_id):

        raise HTTPException(
            status_code=404,
            detail="Saved view not found",
        )

    result = await request.app.state.database[
        "pipeline_views"
    ].delete_one({

        "_id": ObjectId(view_id),

        "user_id": user["_id"],

    })

    if result.deleted_count == 0:

        raise HTTPException(
            status_code=404,
            detail="Saved view not found",
        )

    return {
        "success": True,
        "message": "Saved view deleted",
    }