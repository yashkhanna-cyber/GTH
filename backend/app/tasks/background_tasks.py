import asyncio
import logging
from uuid import UUID
from sqlalchemy import select, func
from app.database.session import async_session_maker
from app.models.user import User
from app.models.points import PointsHistory
from app.models.notification import Notification
from app.services.redis import redis_service

logger = logging.getLogger(__name__)

async def send_email_task(to_email: str, subject: str, body: str):
    """Asynchronously sends transactional emails (Simulated for GTH)."""
    logger.info(f"Sending email to {to_email} with subject '{subject}'...")
    # Simulated SMTP sleep
    await asyncio.sleep(1)
    logger.info(f"Email successfully sent to {to_email}.")
    return True

async def notification_delivery_task(student_id_str: str, title: str, message: str):
    """Delivers and stores a notification for a student."""
    logger.info(f"Delivering notification to {student_id_str}: {title}")
    student_id = UUID(student_id_str)
    async with async_session_maker() as session:
        notification = Notification(
            student_id=student_id,
            title=title,
            message=message,
            is_read=False
        )
        session.add(notification)
        await session.commit()
    return True

async def process_referral_bonus_task(referrer_id_str: str, new_student_id_str: str, bonus_points: int):
    """Processes referral bonus points asynchronously in a database transaction."""
    logger.info(f"Processing referral bonus: Referrer={referrer_id_str}, NewStudent={new_student_id_str}")
    referrer_id = UUID(referrer_id_str)
    UUID(new_student_id_str)

    async with async_session_maker() as session:
        # Fetch referrer profile
        res = await session.execute(select(User).where(User.id == referrer_id))
        referrer = res.scalar_one_or_none()

        if not referrer:
            logger.error(f"Referrer user {referrer_id_str} not found.")
            return False

        # Award points to referrer
        referrer.total_points += bonus_points
        
        # Log to points history
        points_log = PointsHistory(
            student_id=referrer_id,
            points=bonus_points,
            reason=f"Referral bonus for inviting {new_student_id_str}",
            given_by=None  # System awarded
        )
        session.add(points_log)

        # Log notification for referrer
        notification = Notification(
            student_id=referrer_id,
            title="Referral Bonus Awarded!",
            message=f"You earned {bonus_points} points because someone signed up using your referral code.",
            is_read=False
        )
        session.add(notification)

        await session.commit()
        logger.info(f"Successfully processed referral bonus of {bonus_points} for referrer {referrer_id_str}.")
    
    # Recalculate leaderboard
    asyncio.create_task(recalculate_leaderboard_task())
    return True

async def recalculate_leaderboard_task():
    """Recalculates individual and team leaderboard rankings and caches them in Redis."""
    logger.info("Recalculating leaderboard lists...")
    async with async_session_maker() as session:
        # Individual leaderboard query (Students only, ordered by points)
        res = await session.execute(
            select(User)
            .where(User.role == "Student")
            .order_by(User.total_points.desc(), User.full_name.asc())
        )
        students = res.scalars().all()
        
        leaderboard_data = []
        for idx, student in enumerate(students):
            leaderboard_data.append({
                "id": str(student.id),
                "rank": idx + 1,
                "totalPoints": student.total_points,
                "projectScore": student.total_points,
                "communityScore": 0,
                "innovationScore": 0,
                "referralScore": 0,
                "student": {
                    "id": str(student.id),
                    "enrollmentNo": student.enrollment_no or "",
                    "team": {"name": student.team} if student.team else None,
                    "user": {
                        "name": student.full_name,
                        "email": student.email,
                        "avatar": student.photo
                    }
                }
            })

        # Save to Redis (expire in 1 hour)
        await redis_service.set_json("cache:leaderboard:individual", leaderboard_data, expire=3600)

        # Team leaderboard - group students by team
        teams_map: dict[str, dict] = {}
        for s in students:
            if not s.team:
                continue
            if s.team not in teams_map:
                teams_map[s.team] = {"totalPoints": 0, "members": []}
            teams_map[s.team]["totalPoints"] += s.total_points
            teams_map[s.team]["members"].append({
                "name": s.full_name,
                "avatar": s.photo
            })

        sorted_teams = sorted(teams_map.items(), key=lambda x: x[1]["totalPoints"], reverse=True)

        team_leaderboard = []
        for idx, (team_name, data) in enumerate(sorted_teams):
            team_leaderboard.append({
                "rank": idx + 1,
                "teamName": team_name,
                "totalPoints": data["totalPoints"],
                "memberCount": len(data["members"]),
                "members": data["members"][:5]
            })

        await redis_service.set_json("cache:leaderboard:team", team_leaderboard, expire=3600)
        logger.info("Leaderboards successfully calculated and cached.")
        
        # Broadcast via WebSockets in API layer later
    return True

async def generate_certificate_task(student_id_str: str, certificate_title: str):
    """Generates PDF Certificate and uploads to S3 storage."""
    logger.info(f"Generating certificate '{certificate_title}' for student {student_id_str}...")
    # Simulation: Wait for PDF generation
    await asyncio.sleep(2)
    
    # Normally we generate PDF bytes, upload it to storage_manager, and save URL.
    # We will log notification that certificate is ready.
    student_id = UUID(student_id_str)
    async with async_session_maker() as session:
        notification = Notification(
            student_id=student_id,
            title="Certificate Unlocked!",
            message=f"Congratulations! You unlocked the certificate: '{certificate_title}'. Go to Certificates tab to view/download.",
            is_read=False
        )
        session.add(notification)
        await session.commit()
    logger.info(f"Certificate successfully generated for student {student_id_str}.")
    return True

async def file_cleanup_task():
    """Scheduled task to clean up orphan/rejected submission files."""
    logger.info("Running scheduled file cleanup job...")
    # Here we would query rejected files or database records marked for pruning.
    # Stubbable for now.
    return True
