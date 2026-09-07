import uuid
from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field

UserRole = Literal["charterer", "ship_owner", "broker", "port_authority", "admin"]


class UserBase(BaseModel):
    email: EmailStr = Field(..., description="User corporate or official email address")
    name: Optional[str] = Field(None, description="User full name")
    company: Optional[str] = Field("Maritime Logistics Corp", description="Organization or company name")
    role: UserRole = Field("charterer", description="Maritime role")
    avatar_url: Optional[str] = Field(None, description="Avatar photo URL")


class UserCreate(UserBase):
    firebase_uid: str = Field(..., description="Firebase Unique Identifier (UID)")


class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, description="Updated full name")
    company: Optional[str] = Field(None, description="Updated company name")
    role: Optional[UserRole] = Field(None, description="Updated maritime role")
    avatar_url: Optional[str] = Field(None, description="Updated avatar photo URL")


class VerifyTokenRequest(BaseModel):
    id_token: str = Field(..., description="Firebase ID token string from frontend client")
    name: Optional[str] = Field(None, description="Optional user full name")
    company: Optional[str] = Field(None, description="Optional user company")
    role: Optional[str] = Field(None, description="Optional user role")
    email: Optional[str] = Field(None, description="Optional user email override")


class UserResponse(BaseModel):
    id: uuid.UUID
    firebase_uid: str
    email: EmailStr
    name: Optional[str] = None
    company: Optional[str] = None
    role: str
    avatar_url: Optional[str] = None
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
