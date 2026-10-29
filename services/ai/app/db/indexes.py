async def create_indexes(
    database,
):

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