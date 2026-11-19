import uuid

from core.rate_limit import limiter
from db.database import get_async_session
from fastapi import APIRouter, Depends, Request
from models.user import User
from schemas.chat import ChatMessageRead
from services.chat_service import (
    change_conversation_title,
    create_conversation,
    create_new_message,
    get_all_conversations,
    get_conversation_messages,
    remove_conversation,
)
from sqlalchemy.ext.asyncio import AsyncSession
from users import current_active_user

router = APIRouter()


@router.get("/")
@limiter.limit("15/minute")
async def get_conversations(
    request: Request,
    db: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    return await get_all_conversations(db, user.id)


@router.post("/")
@limiter.limit("3/minute")
async def create_conv(
    request: Request,
    db: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    return await create_conversation(db, user.id)


@router.patch("/{conversation_id}")
@limiter.limit("4/minute")
async def update_conversation_title(
    conversation_id: uuid.UUID,
    new_title: str,
    request: Request,
    db: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    return await change_conversation_title(db, user.id, conversation_id, new_title)


@router.delete("/{conversation_id}")
@limiter.limit("10/minute")
async def delete_conversation(
    conversation_id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    await remove_conversation(db, user.id, conversation_id)
    return {"message": "Conversation deleted successfully."}


@router.get("/{conversation_id}/messages", response_model=list[ChatMessageRead])
@limiter.limit("15/minute")
async def get_all_conversation_messages(
    conversation_id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    return await get_conversation_messages(db, user.id, conversation_id)


@router.post("/{conversation_id}/messages", response_model=ChatMessageRead)
@limiter.limit("60/minute")
async def add_message_to_conversation(
    conversation_id: uuid.UUID,
    message_content: str,
    request: Request,
    db: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    message = await create_new_message(
        db, user.id, conversation_id, message_content, role="user"
    )
    await db.commit()
    await db.refresh(message, attribute_names=["audio_assets"])
    return message
