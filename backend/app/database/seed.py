import asyncio
import logging
from datetime import datetime, timedelta
from sqlalchemy import text
from app.database.session import async_session_maker
from app.models.user import User
from app.models.team import Team
from app.models.project import Project
from app.models.task import Task
from app.models.settings import SettingsModel
from app.auth.password import get_password_hash

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("db_seed")

async def seed_data():
    logger.info("Connecting to database for seeding...")
    async with async_session_maker() as session:
        # 1. Clean up existing data in correct dependency order
        logger.info("Cleaning up old database records...")
        await session.execute(text("TRUNCATE TABLE audit_logs CASCADE"))
        await session.execute(text("TRUNCATE TABLE file_uploads CASCADE"))
        await session.execute(text("TRUNCATE TABLE notifications CASCADE"))
        await session.execute(text("TRUNCATE TABLE points_history CASCADE"))
        await session.execute(text("TRUNCATE TABLE referrals CASCADE"))
        await session.execute(text("TRUNCATE TABLE task_submissions CASCADE"))
        await session.execute(text("TRUNCATE TABLE tasks CASCADE"))
        await session.execute(text("TRUNCATE TABLE projects CASCADE"))
        await session.execute(text("TRUNCATE TABLE team_invitations CASCADE"))
        await session.execute(text("TRUNCATE TABLE attendance CASCADE"))
        await session.execute(text("TRUNCATE TABLE announcements CASCADE"))
        await session.execute(text("TRUNCATE TABLE certificates CASCADE"))
        await session.execute(text("TRUNCATE TABLE users CASCADE"))
        await session.execute(text("TRUNCATE TABLE teams CASCADE"))
        await session.execute(text("TRUNCATE TABLE settings CASCADE"))
        await session.commit()

        # 2. Insert Teams
        logger.info("Inserting teams...")
        team_alpha = Team(
            team_name="Team Alpha",
            mentor="Alice Mentor",
            tagline="First to the finish line!"
        )
        team_beta = Team(
            team_name="Team Beta",
            mentor="Bob Mentor",
            tagline="Code hard, play hard!"
        )
        session.add(team_alpha)
        session.add(team_beta)
        await session.flush()  # Generate Team IDs

        # 3. Insert Admin User
        logger.info("Inserting admin profile...")
        admin_email = "yash.khanna@geetauniversity.edu.in"
        admin_user = User(
            full_name="Yash Admin",
            email=admin_email,
            password_hash=get_password_hash("Y1a2s3h4"),
            role="Admin",
            department="Management",
            referral_code="GTH-YASHADMIN",
            total_points=0
        )
        session.add(admin_user)
        await session.flush()  # Generate Admin ID

        # 4. Insert Student Users
        logger.info("Inserting student users...")
        for i in range(1, 11):
            pad_num = str(i).zfill(3)
            student_email = f"student{i}@gth.com"
            enrollment = f"22CSE{pad_num}"
            team_ref = team_alpha if i <= 5 else team_beta
            
            student = User(
                full_name=f"Student {i}",
                email=student_email,
                password_hash=get_password_hash("password123"),
                role="Student",
                department="Computer Science",
                team=team_ref.team_name,
                team_id=team_ref.id,
                referral_code=f"GTH-{enrollment}",
                enrollment_no=enrollment,
                branch="CSE",
                year=3,
                batch="Batch A",
                total_points=i * 10,
                bio=f"Enthusiastic full-stack developer (Student {i}) eager to learn IoT and AI.",
                skills="React, Tailwind CSS, TypeScript, Node.js"
            )
            session.add(student)
            
            # Make first student of each team the leader
            if i == 1:
                team_alpha.leader_id = student.id
            elif i == 6:
                team_beta.leader_id = student.id

        # 5. Insert Projects
        logger.info("Inserting projects...")
        project1 = Project(
            title="Full Stack TechVerse Bootcamp Manager",
            description="Develop a modern, highly interactive bootcamp portal with Next.js App Router and Supabase services.",
            instruction_pdf="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            assigned_to="ALL",
            created_by=admin_user.id
        )
        project2 = Project(
            title="AI Smart Agent & Chat Interface",
            description="Create an intelligent customer-facing chatbot integrating Google Gemini API and LangChain.",
            instruction_pdf="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            assigned_to="BATCH",
            assigned_target="Batch A",
            created_by=admin_user.id
        )
        session.add(project1)
        session.add(project2)

        # 6. Insert Tasks
        logger.info("Inserting tasks...")
        task1 = Task(
            title="Setup Project and Repository",
            description="Initialize a clean Next.js application, configure TailwindCSS, and push the repository to GitHub.",
            rules="Submit a valid GitHub repository URL. Ensure proper README.md.",
            points=50,
            deadline=datetime.utcnow() + timedelta(days=3),
            assigned_to="ALL"
        )
        task2 = Task(
            title="Design Dashboard UI Components",
            description="Implement a highly responsive client dashboard UI containing points metrics and task lists.",
            rules="Use Tailwind CSS and shadcn/ui. Ensure dark mode works correctly.",
            points=100,
            deadline=datetime.utcnow() + timedelta(days=7),
            assigned_to="ALL"
        )
        session.add(task1)
        session.add(task2)

        # 7. Insert System Settings
        logger.info("Inserting settings...")
        settings_data = [
            SettingsModel(key="referral_bonus_points", value="250", type="int", description="Points awarded for a new referral"),
            SettingsModel(key="max_upload_size_mb", value="10", type="int", description="Maximum file upload size in MB"),
            SettingsModel(key="registration_status", value="open", type="string", description="Status of student registration (open/closed)"),
        ]
        for setting in settings_data:
            session.add(setting)

        # Commit all inserts
        await session.commit()
        logger.info("Database seeding completed successfully!")

if __name__ == "__main__":
    asyncio.run(seed_data())
