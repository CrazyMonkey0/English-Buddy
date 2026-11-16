import uuid

from fastapi import HTTPException, status
from models.conversation import Conversation
from models.message import Message
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


async def create_conversation(session: AsyncSession, user_id: str) -> uuid.UUID:
    new_conv_id = uuid.uuid4()
    # Assuming you have a Conversation model to create a new conversation
    new_conversation = Conversation(id=new_conv_id, user_id=user_id)
    session.add(new_conversation)
    await session.commit()
    return new_conv_id


async def get_all_conversations(
    session: AsyncSession, user_id: str
) -> list[Conversation]:
    stmt = select(Conversation).where(Conversation.user_id == user_id)
    result = await session.execute(stmt)
    conversations = result.scalars().all()
    return conversations


async def remove_conversation(
    session: AsyncSession, user_id: str, conv_id: uuid.UUID
) -> None:
    stmt = select(Conversation).where(
        Conversation.id == conv_id, Conversation.user_id == user_id
    )
    result = await session.execute(stmt)
    conversation = result.scalar_one_or_none()

    if conversation:
        await session.delete(conversation)
        await session.commit()
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found"
        )


async def change_conversation_title(
    session: AsyncSession, user_id: str, conv_id: uuid.UUID, new_title: str
) -> str | None:
    stmt = select(Conversation).where(
        Conversation.user_id == user_id, Conversation.id == conv_id
    )
    result = await session.execute(stmt)
    conversation = result.scalar_one_or_none()

    if conversation:
        conversation.title = new_title
        await session.commit()
        return new_title
    return None


async def get_formatted_context(
    session: AsyncSession, conv_id: uuid.UUID, limit: int = 6
) -> list[dict[str, str]]:
    stmt = (
        select(Message)
        .where(Message.conversation_id == conv_id)
        .order_by(Message.created_at.desc())
        .limit(limit)
    )

    result = await session.execute(stmt)
    messages = result.scalars().all()

    final_context = [
        {"role": "system", "content": "You are a friendly English Teacher."}
    ]

    for m in reversed(messages):
        final_context.append({"role": m.role, "content": m.content})

    return final_context


async def get_conversation_messages(
    session: AsyncSession, user_id: str, conv_id: uuid.UUID
) -> list[Message]:
    stmt = (
        select(Message)
        .where(
            Message.conversation_id == conv_id,
            Message.conversation.has(user_id=user_id),
        )
        .order_by(Message.created_at.desc())
    )
    result = await session.execute(stmt)
    messages = result.scalars().all()
    return messages


async def create_new_message(
    session: AsyncSession,
    user_id: str,
    conv_id: uuid.UUID,
    content: str,
    role: str,
) -> Message:

    stmt = select(Conversation).where(
        Conversation.id == conv_id,
        Conversation.user_id == user_id,
    )

    result = await session.execute(stmt)
    conversation = result.scalar_one_or_none()

    if conversation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found"
        )

    new_msg = Message(
        conversation=conversation,
        role=role,
        content=content,
    )

    session.add(new_msg)
    await session.commit()
    await session.refresh(new_msg)

    return new_msg


async def create_bot_message(
    session: AsyncSession, conv_id: uuid.UUID, content: str
) -> Message:
    new_msg = Message(conversation_id=conv_id, role="assistant", content=content)
    session.add(new_msg)
    await session.commit()
    await session.refresh(new_msg)

    return new_msg
