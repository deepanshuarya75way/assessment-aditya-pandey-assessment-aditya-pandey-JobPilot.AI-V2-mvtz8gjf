async def create_indexes(database):

    await database["users"].create_index(
        "email",
        unique=True,
    )

    await database["jobs"].create_index(
        [
            ("source", 1),
            ("external_id", 1),
        ],
        unique=True,
    )

    await database["jobs"].create_index(
        "updated_at",
    )

    await database["applications"].create_index(
        [
            ("user_id", 1),
            ("updated_at", -1),
        ]
    )

    await database["applications"].create_index(
        [
            ("user_id", 1),
            ("status", 1),
        ]
    )

    # Supports filtering by stored resume match score.
    await database["applications"].create_index(
        [
            ("user_id", 1),
            ("application.analysis.fit_score", 1),
        ]
    )

    # Saved views are user-specific and ordered by update time.
    await database["pipeline_views"].create_index(
        [
            ("user_id", 1),
            ("updated_at", -1),
        ]
    )

    await database["pipeline_views"].create_index(
        [
            ("user_id", 1),
            ("name", 1),
        ]
    )