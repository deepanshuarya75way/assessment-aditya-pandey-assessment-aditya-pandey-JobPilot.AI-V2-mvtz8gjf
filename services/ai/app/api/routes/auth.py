from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Request,
)

from app.api.dependencies import get_current_user

from app.schemas.api.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    UserResponse,
)

from app.services.auth import (
    hash_password,
    verify_password,
    create_access_token,
)


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)


@router.post("/register")
async def register(
    request: Request,
    data: RegisterRequest,
):

    database = request.app.state.database
    users = database["users"]

    email = data.email.lower()

    existing_user = await users.find_one({
        "email": email
    })

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="Email already registered",
        )

    password = hash_password(
        data.password
    )

    document = {
        "name": data.name,
        "email": email,
        "password_hash": password,
    }

    result = await users.insert_one(
        document
    )

    user_id = str(
        result.inserted_id
    )

    token = create_access_token(
        user_id
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "name": data.name,
            "email": email,
        },
    }


@router.post("/login")
async def login(
    request: Request,
    data: LoginRequest,
):

    database = request.app.state.database
    users = database["users"]

    email = data.email.lower()

    user = await users.find_one({
        "email": email
    })

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    if not verify_password(
        data.password,
        user["password_hash"],
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    user_id = str(
        user["_id"]
    )

    token = create_access_token(
        user_id
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "name": user["name"],
            "email": user["email"],
        },
    }


@router.get("/me")
async def get_me(
    user=Depends(
        get_current_user
    ),
):

    return {
        "id": user["_id"],
        "name": user["name"],
        "email": user["email"],
    }