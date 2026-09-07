import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate, VerifyTokenRequest
from app.utils.firebase_admin import verify_firebase_token

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/auth", tags=["Authentication & User Management"])


@router.post(
    "/verify-token",
    response_model=UserResponse,
    summary="Verify Firebase ID token and sync user profile",
)
async def verify_token_endpoint(
    body: VerifyTokenRequest,
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Accepts Firebase ID token from frontend client, validates claims with Firebase Admin SDK,
    and upserts the user record into PostgreSQL.
    """
    payload = verify_firebase_token(body.id_token)

    firebase_uid = payload.get("uid") or payload.get("sub")
    if not firebase_uid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Firebase ID token missing valid uid claim",
        )

    email = body.email or payload.get("email") or f"{firebase_uid}@maritime.local"
    name = body.name or payload.get("name") or payload.get("display_name")
    company = body.company or "Maritime Logistics Corp"
    role = body.role or "charterer"
    avatar_url = payload.get("picture")

    stmt = select(User).where(User.firebase_uid == firebase_uid)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if user is None and email:
        stmt_email = select(User).where(User.email == email)
        res_email = await db.execute(stmt_email)
        user = res_email.scalar_one_or_none()
        if user is not None:
            user.firebase_uid = firebase_uid
            if name and not user.name:
                user.name = name
            if company and user.company == "Maritime Logistics Corp":
                user.company = company
            if role and user.role == "charterer":
                user.role = role
            if avatar_url and not user.avatar_url:
                user.avatar_url = avatar_url
            await db.commit()
            await db.refresh(user)

    if user is None:
        logger.info(f"Creating new maritime user from token: {email}")
        user = User(
            firebase_uid=firebase_uid,
            email=email,
            name=name or email.split("@")[0].replace(".", " ").title(),
            avatar_url=avatar_url,
            company=company,
            role=role,
            is_active=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    else:
        # Update details if refreshed
        updated = False
        if avatar_url and user.avatar_url != avatar_url:
            user.avatar_url = avatar_url
            updated = True
        if body.name and user.name != body.name:
            user.name = body.name
            updated = True
        if body.company and user.company != body.company:
            user.company = body.company
            updated = True
        if body.role and user.role != body.role:
            user.role = body.role
            updated = True

        if updated:
            await db.commit()
            await db.refresh(user)

    return user


@router.get("/me", response_model=UserResponse, summary="Get current user profile")
async def get_my_profile(
    current_user: User = Depends(get_current_user),
) -> User:
    """Return the authenticated user profile from PostgreSQL."""
    return current_user


@router.put("/me", response_model=UserResponse, summary="Update user profile")
async def update_my_profile(
    profile_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Update profile attributes (name, company, role, avatar_url) for current user."""
    if profile_data.name is not None:
        current_user.name = profile_data.name
    if profile_data.company is not None:
        current_user.company = profile_data.company
    if profile_data.role is not None:
        current_user.role = profile_data.role
    if profile_data.avatar_url is not None:
        current_user.avatar_url = profile_data.avatar_url

    await db.commit()
    await db.refresh(current_user)
    return current_user
