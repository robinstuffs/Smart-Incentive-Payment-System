"""Bank and profile expansion

Revision ID: 002_bank_and_profile_expansion
Revises: 0af1a5f5aab2
Create Date: 2026-06-25 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '002_bank_and_profile_expansion'
down_revision = '0af1a5f5aab2'
branch_labels = None
depends_on = None


def upgrade():
    # Create bank table
    op.create_table('bank',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('abbreviation', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )

    # Add extended profile fields to user
    with op.batch_alter_table('user', schema=None) as batch_op:
        batch_op.add_column(sa.Column('surname', sa.String(length=120), nullable=True))
        batch_op.add_column(sa.Column('firstname', sa.String(length=120), nullable=True))
        batch_op.add_column(sa.Column('middlename', sa.String(length=120), nullable=True))
        batch_op.add_column(sa.Column('phone_number', sa.String(length=20), nullable=True))
        batch_op.add_column(sa.Column('street_address', sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column('area_district', sa.String(length=120), nullable=True))
        batch_op.add_column(sa.Column('city', sa.String(length=120), nullable=True))
        batch_op.add_column(sa.Column('lga', sa.String(length=120), nullable=True))
        batch_op.add_column(sa.Column('state', sa.String(length=120), nullable=True))
        batch_op.add_column(sa.Column('country', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('postal_code', sa.String(length=20), nullable=True))
        batch_op.add_column(sa.Column('account_name', sa.String(length=200), nullable=True))
        batch_op.add_column(sa.Column('account_number', sa.String(length=20), nullable=True))
        batch_op.add_column(sa.Column('bank_id', sa.Integer(), nullable=True))
        batch_op.create_foreign_key('fk_user_bank_id', 'bank', ['bank_id'], ['id'])

    # Add payment detail snapshot columns to payment
    with op.batch_alter_table('payment', schema=None) as batch_op:
        batch_op.add_column(sa.Column('account_name', sa.String(length=200), nullable=True))
        batch_op.add_column(sa.Column('account_number', sa.String(length=20), nullable=True))
        batch_op.add_column(sa.Column('bank_name', sa.String(length=150), nullable=True))
        batch_op.add_column(sa.Column('bank_abbreviation', sa.String(length=20), nullable=True))


def downgrade():
    with op.batch_alter_table('payment', schema=None) as batch_op:
        batch_op.drop_column('bank_abbreviation')
        batch_op.drop_column('bank_name')
        batch_op.drop_column('account_number')
        batch_op.drop_column('account_name')

    with op.batch_alter_table('user', schema=None) as batch_op:
        batch_op.drop_constraint('fk_user_bank_id', type_='foreignkey')
        batch_op.drop_column('bank_id')
        batch_op.drop_column('account_number')
        batch_op.drop_column('account_name')
        batch_op.drop_column('postal_code')
        batch_op.drop_column('country')
        batch_op.drop_column('state')
        batch_op.drop_column('lga')
        batch_op.drop_column('city')
        batch_op.drop_column('area_district')
        batch_op.drop_column('street_address')
        batch_op.drop_column('phone_number')
        batch_op.drop_column('middlename')
        batch_op.drop_column('firstname')
        batch_op.drop_column('surname')

    op.drop_table('bank')
