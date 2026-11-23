"""add message corrections

Revision ID: 3c1f0a2b9e6d
Revises: ad016e241aac
Create Date: 2026-11-23

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "3c1f0a2b9e6d"
down_revision: Union[str, Sequence[str], None] = "ad016e241aac"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "message_corrections",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("message_id", sa.Uuid(), nullable=False),
        sa.Column("original", sa.Text(), nullable=False),
        sa.Column("corrected", sa.Text(), nullable=False),
        sa.ForeignKeyConstraint(
            ["message_id"], ["messages.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("message_id"),
    )
    op.create_table(
        "message_correction_changes",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("correction_id", sa.Uuid(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("original", sa.Text(), nullable=False),
        sa.Column("corrected", sa.Text(), nullable=False),
        sa.Column("explanation", sa.Text(), nullable=False),
        sa.ForeignKeyConstraint(
            ["correction_id"], ["message_corrections.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_message_correction_changes_correction_id"),
        "message_correction_changes",
        ["correction_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_message_correction_changes_correction_id"),
        table_name="message_correction_changes",
    )
    op.drop_table("message_correction_changes")
    op.drop_table("message_corrections")