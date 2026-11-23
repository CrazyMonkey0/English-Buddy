import uuid
from typing import TYPE_CHECKING

from db.database import Base
from sqlalchemy import ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from models.message import Message


class MessageCorrection(Base):
    __tablename__ = "message_corrections"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    message_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("messages.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    original: Mapped[str] = mapped_column(Text, nullable=False)
    corrected: Mapped[str] = mapped_column(Text, nullable=False)

    message: Mapped["Message"] = relationship(
        "Message",
        back_populates="correction",
    )
    changes: Mapped[list["MessageCorrectionChange"]] = relationship(
        "MessageCorrectionChange",
        back_populates="correction",
        cascade="all, delete-orphan",
        order_by="MessageCorrectionChange.position",
    )


class MessageCorrectionChange(Base):
    __tablename__ = "message_correction_changes"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    correction_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("message_corrections.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    original: Mapped[str] = mapped_column(Text, nullable=False)
    corrected: Mapped[str] = mapped_column(Text, nullable=False)
    explanation: Mapped[str] = mapped_column(Text, nullable=False)

    correction: Mapped[MessageCorrection] = relationship(
        "MessageCorrection",
        back_populates="changes",
    )