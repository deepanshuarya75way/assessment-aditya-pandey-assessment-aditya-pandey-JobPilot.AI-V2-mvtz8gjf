from fastapi import (
    Depends,
    HTTPException,
    Request,
    status,
)
from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)

from app.services.auth import (
    decode_access_token,
)


security = HTTPBearer()


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(
        security
    ),
):

    token = credentials.credentials

    try:

        user_id = decode_access_token(
            token
        )

    except Exception:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    database = request.app.state.database

    user = await database[
        "users"
    ].find_one({
        "_id": __import__(
            "bson"
        ).ObjectId(user_id)
    })

    if user is None:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    user["_id"] = str(
        user["_id"]
    )

    return user