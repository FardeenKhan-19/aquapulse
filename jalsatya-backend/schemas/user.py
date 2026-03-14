from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=2, max_length=200)
    role: str = Field(..., pattern="^(admin|health_officer)$")
    phone: Optional[str] = None
    assigned_village_ids: Optional[List[UUID]] = []


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None
    assigned_village_ids: Optional[List[UUID]] = None


class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    role: str
    phone: Optional[str]
    assigned_village_ids: Optional[List[UUID]]
    is_active: bool
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    last_login: Optional[datetime]

    model_config = {"from_attributes": True}


class UserListResponse(BaseModel):
    items: List[UserResponse]
    total: int
    page: int
    per_page: int
    pages: int


class AssignVillageRequest(BaseModel):
    village_id: UUID


class ResetPasswordRequest(BaseModel):
    new_password: str = Field(..., min_length=8)
