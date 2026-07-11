import logging
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.models.user import User
from app.services.team import team_service
from app.schemas.team import TeamCreateInput, TeamInviteActionInput, TeamStatusResponse
from app.dependencies.auth import get_current_user

logger = logging.getLogger(__name__)
# Registered as prefix "/team" in master router
router = APIRouter(prefix="/team", tags=["Teams"])

@router.get("", response_model=TeamStatusResponse)
async def get_team_status(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Returns the user's team status or pending invites list.
    """
    return await team_service.get_team_status(db, current_user)

@router.post("")
async def create_team(
    data: TeamCreateInput,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Creates a new team and invites selected students (Leader only).
    """
    return await team_service.create_team(db, current_user, data)

@router.post("/invite-action")
async def process_invite_action(
    data: TeamInviteActionInput,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Accepts or declines a team invitation.
    """
    return await team_service.process_invite_action(db, current_user, data)
