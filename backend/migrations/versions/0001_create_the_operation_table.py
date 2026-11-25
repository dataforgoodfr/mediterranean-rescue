"""La table des opérations, telle que create_all la créait avant Alembic.

Revision ID: 0001
Create Date: 2026-11-25 15:52:57.383551
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "operation",
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("operation_type", sa.String(), nullable=False),
        sa.Column("nb_ops", sa.Integer(), nullable=False),
        sa.Column("nb_survivor", sa.Integer(), nullable=True),
        sa.Column("male", sa.Integer(), nullable=True),
        sa.Column("female", sa.Integer(), nullable=True),
        sa.Column("under_18", sa.Integer(), nullable=True),
        sa.Column("under_18_unacc", sa.Integer(), nullable=True),
        sa.Column("under_5", sa.Integer(), nullable=True),
        sa.Column("pregnant_women", sa.Integer(), nullable=True),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("wind_force", sa.Integer(), nullable=True),
        sa.Column("wave_height", sa.Float(), nullable=True),
        sa.Column("boat_type", sa.String(), nullable=True),
        sa.Column("nb_nationalities", sa.Integer(), nullable=True),
        sa.Column("transfer_type", sa.String(), nullable=True),
        sa.Column("port_disembarkation", sa.String(), nullable=True),
        sa.Column("image_src", sa.String(), nullable=True),
        sa.Column("video_src", sa.String(), nullable=True),
        sa.Column("testimony_name", sa.String(), nullable=True),
        sa.Column("testimony_src", sa.String(), nullable=True),
        sa.Column("id", sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("operation")
