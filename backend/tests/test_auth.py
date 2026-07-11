import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.settings import SettingsModel

@pytest.mark.asyncio
async def test_register_and_login(client: AsyncClient, db_session: AsyncSession):
    # Setup prerequisite system settings
    setting = SettingsModel(key="referral_bonus_points", value="250", type="int", description="Test Setting")
    db_session.add(setting)
    await db_session.commit()

    # 1. Register a student
    register_payload = {
        "email": "test_student@gth.com",
        "password": "password123",
        "fullName": "Test Student",
        "enrollmentNo": "22CSE999",
        "branch": "CSE",
        "year": 3,
        "batch": "Batch A",
        "skills": "React, TypeScript",
        "bio": "Bootcamp student profile unit test"
    }
    
    reg_response = await client.post("/auth/register", json=register_payload)
    assert reg_response.status_code == 201
    reg_data = reg_response.json()
    assert reg_data["success"] is True
    assert reg_data["user"]["email"] == "test_student@gth.com"
    assert reg_data["user"]["role"] == "STUDENT"

    # 2. Login the student
    login_payload = {
        "email": "test_student@gth.com",
        "password": "password123"
    }
    
    login_response = await client.post("/auth/login", json=login_payload)
    assert login_response.status_code == 200
    login_data = login_response.json()
    assert login_data["success"] is True
    assert login_data["user"]["email"] == "test_student@gth.com"

    # 3. Retrieve current session profile (/auth/me)
    # Extract session cookie
    cookies = login_response.cookies
    me_response = await client.get("/auth/me", cookies=cookies)
    assert me_response.status_code == 200
    me_data = me_response.json()
    assert me_data["user"]["email"] == "test_student@gth.com"
    assert me_data["user"]["student"]["enrollmentNo"] == "22CSE999"
