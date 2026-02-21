"""
Backend API tests for Multi-User Gym Workout Tracking App
Tests all CRUD operations with user_id parameter for workout plans, exercises, and sessions
Verifies user data isolation between Andrea, Roy, and Romi profiles
"""
import pytest
import requests
import os
import uuid

# Get base URL from environment variable
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    raise ValueError("REACT_APP_BACKEND_URL environment variable not set")

# User profiles for testing
USERS = ["andrea", "roy", "romi"]


class TestProfiles:
    """Test /api/profiles endpoint"""
    
    def test_get_profiles_returns_3_users(self):
        """GET /api/profiles returns exactly 3 profiles"""
        response = requests.get(f"{BASE_URL}/api/profiles")
        assert response.status_code == 200
        profiles = response.json()
        assert len(profiles) == 3
        
        # Verify profile structure
        for p in profiles:
            assert "id" in p
            assert "name" in p
            assert "color" in p
        
        # Verify specific users exist
        ids = [p["id"] for p in profiles]
        assert "andrea" in ids
        assert "roy" in ids
        assert "romi" in ids
        print("✅ GET /api/profiles returns 3 users with correct structure")
    
    def test_profile_colors_are_correct(self):
        """Verify profile colors match expected values"""
        response = requests.get(f"{BASE_URL}/api/profiles")
        profiles = {p["id"]: p for p in response.json()}
        
        assert profiles["andrea"]["color"] == "#F59E0B"  # Orange/Amber
        assert profiles["roy"]["color"] == "#3B82F6"     # Blue
        assert profiles["romi"]["color"] == "#10B981"    # Green
        print("✅ Profile colors are correct (Andrea=amber, Roy=blue, Romi=green)")


class TestWorkoutPlansMultiUser:
    """Test workout plans with user_id parameter"""
    
    def test_get_workout_plans_requires_user_id(self):
        """GET /api/workout-plans without user_id should fail"""
        response = requests.get(f"{BASE_URL}/api/workout-plans")
        assert response.status_code == 422  # Validation error
        print("✅ GET /api/workout-plans requires user_id param")
    
    def test_get_andrea_workout_plans(self):
        """GET /api/workout-plans?user_id=andrea returns Andrea's plans"""
        response = requests.get(f"{BASE_URL}/api/workout-plans?user_id=andrea")
        assert response.status_code == 200
        plans = response.json()
        assert len(plans) >= 1
        
        # Verify all plans belong to Andrea
        for plan in plans:
            assert plan["user_id"] == "andrea"
            # Verify exercise IDs follow format
            for ex in plan.get("exercises", []):
                assert ex["id"].startswith("andrea-")
        print(f"✅ Andrea has {len(plans)} workout plans")
    
    def test_get_roy_workout_plans(self):
        """GET /api/workout-plans?user_id=roy returns Roy's plans"""
        response = requests.get(f"{BASE_URL}/api/workout-plans?user_id=roy")
        assert response.status_code == 200
        plans = response.json()
        assert len(plans) >= 1
        
        for plan in plans:
            assert plan["user_id"] == "roy"
        print(f"✅ Roy has {len(plans)} workout plans")
    
    def test_get_romi_workout_plans(self):
        """GET /api/workout-plans?user_id=romi returns Romi's plans"""
        response = requests.get(f"{BASE_URL}/api/workout-plans?user_id=romi")
        assert response.status_code == 200
        plans = response.json()
        assert len(plans) >= 1
        
        for plan in plans:
            assert plan["user_id"] == "romi"
        print(f"✅ Romi has {len(plans)} workout plans")
    
    def test_data_isolation_between_users(self):
        """Verify user data is isolated - Andrea's changes don't affect Roy"""
        # Get initial state for both users
        andrea_plans = requests.get(f"{BASE_URL}/api/workout-plans?user_id=andrea").json()
        roy_plans = requests.get(f"{BASE_URL}/api/workout-plans?user_id=roy").json()
        
        # Verify they have same structure but different user_id
        assert len(andrea_plans) == len(roy_plans)
        
        for plan in andrea_plans:
            assert plan["user_id"] == "andrea"
        for plan in roy_plans:
            assert plan["user_id"] == "roy"
        print("✅ User data is properly isolated")


class TestWorkoutDaysCRUD:
    """Test create/delete workout days with max 4 limit"""
    
    def test_get_individual_day_requires_user_id(self):
        """GET /api/workout-plans/1 without user_id should fail"""
        response = requests.get(f"{BASE_URL}/api/workout-plans/1")
        assert response.status_code == 422
        print("✅ Individual day endpoint requires user_id")
    
    def test_get_day_1_for_andrea(self):
        """GET /api/workout-plans/1?user_id=andrea returns Day 1"""
        response = requests.get(f"{BASE_URL}/api/workout-plans/1?user_id=andrea")
        assert response.status_code == 200
        plan = response.json()
        assert plan["day_number"] == 1
        assert plan["user_id"] == "andrea"
        assert "exercises" in plan
        print(f"✅ Andrea's Day 1 has {len(plan['exercises'])} exercises")
    
    def test_create_day_max_4_enforced(self):
        """POST /api/workout-plans creates day but max 4 is enforced"""
        # Get current count
        plans = requests.get(f"{BASE_URL}/api/workout-plans?user_id=andrea").json()
        initial_count = len(plans)
        
        # If already at max, verify error
        if initial_count >= 4:
            response = requests.post(f"{BASE_URL}/api/workout-plans?user_id=andrea", json={})
            assert response.status_code == 400
            assert "Maximum 4" in response.json().get("detail", "")
            print("✅ Max 4 days enforced (already at max)")
            return
        
        # Create a new day
        response = requests.post(f"{BASE_URL}/api/workout-plans?user_id=andrea", json={"name": "TEST_Day"})
        assert response.status_code == 200
        new_day = response.json()
        assert "day_number" in new_day
        assert new_day["user_id"] == "andrea"
        new_day_number = new_day["day_number"]
        
        # Verify persistence
        verify = requests.get(f"{BASE_URL}/api/workout-plans?user_id=andrea").json()
        assert len(verify) == initial_count + 1
        
        # Cleanup - delete the test day
        del_response = requests.delete(f"{BASE_URL}/api/workout-plans/{new_day_number}?user_id=andrea")
        assert del_response.status_code == 200
        
        # Verify cleanup
        final_plans = requests.get(f"{BASE_URL}/api/workout-plans?user_id=andrea").json()
        assert len(final_plans) == initial_count
        print("✅ Create/delete day works with user isolation")
    
    def test_delete_day_requires_user_id(self):
        """DELETE /api/workout-plans/99 without user_id should fail"""
        response = requests.delete(f"{BASE_URL}/api/workout-plans/99")
        assert response.status_code == 422
        print("✅ Delete day requires user_id")


class TestExercisesCRUD:
    """Test add/update/delete exercises"""
    
    def test_add_exercise_to_day(self):
        """POST /api/workout-plans/{day}/exercises adds exercise"""
        # Add exercise to Andrea's day 1
        exercise_data = {
            "name": "TEST_New Exercise",
            "sets": 3,
            "reps": 12,
            "rest_time": "1'",
            "rest_seconds": 60,
            "current_load": "20",
            "muscle_group": "chest",
            "muscle_label": "Chest",
            "notes": ""
        }
        
        response = requests.post(
            f"{BASE_URL}/api/workout-plans/1/exercises?user_id=andrea",
            json=exercise_data
        )
        assert response.status_code == 200
        new_ex = response.json()
        assert "id" in new_ex
        assert new_ex["name"] == "TEST_New Exercise"
        ex_id = new_ex["id"]
        
        # Verify persistence
        plan = requests.get(f"{BASE_URL}/api/workout-plans/1?user_id=andrea").json()
        found = any(ex["id"] == ex_id for ex in plan["exercises"])
        assert found, "New exercise should be in day 1"
        
        # Cleanup
        del_response = requests.delete(
            f"{BASE_URL}/api/workout-plans/1/exercises/{ex_id}?user_id=andrea"
        )
        assert del_response.status_code == 200
        print("✅ Add/delete exercise works correctly")
    
    def test_update_exercise(self):
        """PUT /api/workout-plans/{day}/exercises/{id} updates exercise"""
        # Get first exercise of Andrea's day 1
        plan = requests.get(f"{BASE_URL}/api/workout-plans/1?user_id=andrea").json()
        exercise = plan["exercises"][0]
        original_name = exercise["name"]
        ex_id = exercise["id"]
        
        # Update name
        test_name = f"TEST_Updated_{uuid.uuid4().hex[:6]}"
        response = requests.put(
            f"{BASE_URL}/api/workout-plans/1/exercises/{ex_id}?user_id=andrea",
            json={"name": test_name}
        )
        assert response.status_code == 200
        
        # Verify update
        verify_plan = requests.get(f"{BASE_URL}/api/workout-plans/1?user_id=andrea").json()
        updated_ex = next((ex for ex in verify_plan["exercises"] if ex["id"] == ex_id), None)
        assert updated_ex["name"] == test_name
        
        # Restore original
        requests.put(
            f"{BASE_URL}/api/workout-plans/1/exercises/{ex_id}?user_id=andrea",
            json={"name": original_name}
        )
        print("✅ Update exercise with user_id works")
    
    def test_delete_exercise(self):
        """DELETE /api/workout-plans/{day}/exercises/{id} removes exercise"""
        # Add a test exercise first
        ex_data = {
            "name": "TEST_To Delete",
            "sets": 3,
            "reps": 10,
            "rest_time": "1'",
            "rest_seconds": 60,
            "current_load": "10",
            "muscle_group": "back",
            "muscle_label": "Back"
        }
        add_response = requests.post(
            f"{BASE_URL}/api/workout-plans/1/exercises?user_id=andrea",
            json=ex_data
        )
        ex_id = add_response.json()["id"]
        
        # Delete it
        del_response = requests.delete(
            f"{BASE_URL}/api/workout-plans/1/exercises/{ex_id}?user_id=andrea"
        )
        assert del_response.status_code == 200
        
        # Verify removal
        plan = requests.get(f"{BASE_URL}/api/workout-plans/1?user_id=andrea").json()
        found = any(ex["id"] == ex_id for ex in plan["exercises"])
        assert not found, "Exercise should be deleted"
        print("✅ Delete exercise works correctly")
    
    def test_update_exercise_load(self):
        """PUT /api/workout-plans/{day}/exercises/{id}/load updates load"""
        # Get Andrea's day 1, exercise 1 (skip first which might be bodyweight)
        plan = requests.get(f"{BASE_URL}/api/workout-plans/1?user_id=andrea").json()
        exercise = plan["exercises"][1]  # Second exercise
        original_load = exercise["current_load"]
        ex_id = exercise["id"]
        
        # Update load
        response = requests.put(
            f"{BASE_URL}/api/workout-plans/1/exercises/{ex_id}/load?user_id=andrea",
            json={"load": "99"}
        )
        assert response.status_code == 200
        
        # Verify
        verify_plan = requests.get(f"{BASE_URL}/api/workout-plans/1?user_id=andrea").json()
        updated_ex = next((ex for ex in verify_plan["exercises"] if ex["id"] == ex_id), None)
        assert updated_ex["current_load"] == "99"
        
        # Restore
        requests.put(
            f"{BASE_URL}/api/workout-plans/1/exercises/{ex_id}/load?user_id=andrea",
            json={"load": original_load}
        )
        print("✅ Update exercise load works")


class TestExerciseLogs:
    """Test exercise logging endpoints"""
    
    def test_create_exercise_log(self):
        """POST /api/exercise-logs creates log"""
        log_data = {
            "exercise_id": "andrea-d1-ex0",
            "exercise_name": "Panca piana man",
            "load": "18",
            "sets": 4,
            "reps": 4,
            "day_number": 1
        }
        
        response = requests.post(
            f"{BASE_URL}/api/exercise-logs?user_id=andrea",
            json=log_data
        )
        assert response.status_code == 200
        log = response.json()
        assert "id" in log
        assert log["load"] == "18"
        assert log["user_id"] == "andrea"
        print("✅ Create exercise log works")
    
    def test_get_exercise_logs(self):
        """GET /api/exercise-logs/{id} returns logs"""
        response = requests.get(
            f"{BASE_URL}/api/exercise-logs/andrea-d1-ex0?user_id=andrea"
        )
        assert response.status_code == 200
        logs = response.json()
        assert isinstance(logs, list)
        print(f"✅ Get exercise logs returns {len(logs)} logs")


class TestWorkoutSessions:
    """Test workout session endpoints"""
    
    def test_create_workout_session(self):
        """POST /api/workout-sessions creates session with report"""
        session_data = {
            "day_number": 1,
            "day_name": "Day 1",
            "duration_minutes": 45,
            "exercises": [
                {
                    "exercise_id": "andrea-d1-ex0",
                    "name": "Panca piana man",
                    "sets": 4,
                    "reps": 4,
                    "load": "16",
                    "muscle_group": "chest",
                    "muscle_label": "Chest",
                    "completed": True,
                    "was_modified": False,
                    "original_name": "Panca piana man"
                },
                {
                    "exercise_id": "andrea-d1-ex1",
                    "name": "Pressa",
                    "sets": 4,
                    "reps": 4,
                    "load": "90",
                    "muscle_group": "quads",
                    "muscle_label": "Quads",
                    "completed": True,
                    "was_modified": False,
                    "original_name": "Pressa"
                }
            ]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/workout-sessions?user_id=andrea",
            json=session_data
        )
        assert response.status_code == 200
        session = response.json()
        
        assert "id" in session
        assert session["user_id"] == "andrea"
        assert session["day_number"] == 1
        assert "report" in session
        
        report = session["report"]
        assert "total_volume" in report
        assert "completed_exercises" in report
        assert report["completed_exercises"] == 2
        print(f"✅ Create workout session returns report (volume: {report['total_volume']}kg)")
    
    def test_get_workout_sessions_for_user(self):
        """GET /api/workout-sessions returns user's sessions only"""
        response = requests.get(f"{BASE_URL}/api/workout-sessions?user_id=andrea")
        assert response.status_code == 200
        sessions = response.json()
        
        # All sessions belong to andrea
        for s in sessions:
            assert s["user_id"] == "andrea"
        print(f"✅ Andrea has {len(sessions)} workout sessions")
    
    def test_get_individual_session(self):
        """GET /api/workout-sessions/{id} returns session"""
        # Get a session first
        sessions = requests.get(f"{BASE_URL}/api/workout-sessions?user_id=andrea").json()
        if not sessions:
            pytest.skip("No sessions available")
        
        session_id = sessions[0]["id"]
        response = requests.get(
            f"{BASE_URL}/api/workout-sessions/{session_id}?user_id=andrea"
        )
        assert response.status_code == 200
        session = response.json()
        assert session["id"] == session_id
        print("✅ Get individual session works")


class TestNextWorkout:
    """Test next workout endpoint"""
    
    def test_get_next_workout_for_user(self):
        """GET /api/next-workout returns next day and last sessions"""
        response = requests.get(f"{BASE_URL}/api/next-workout?user_id=andrea")
        assert response.status_code == 200
        data = response.json()
        
        assert "next_day" in data
        assert "last_sessions" in data
        assert "total_days" in data
        assert data["next_day"] in [1, 2, 3, 4]
        print(f"✅ Next workout for Andrea: Day {data['next_day']}")


class TestSeedEndpoint:
    """Test database seeding"""
    
    def test_seed_creates_data_for_all_users(self):
        """POST /api/seed reseeds database for all 3 users"""
        response = requests.post(f"{BASE_URL}/api/seed")
        assert response.status_code == 200
        data = response.json()
        
        assert data["users"] == 3
        assert data["days_per_user"] == 3
        
        # Verify each user has data
        for user in USERS:
            plans = requests.get(f"{BASE_URL}/api/workout-plans?user_id={user}").json()
            assert len(plans) == 3, f"{user} should have 3 days after seed"
        print("✅ Seed creates data for all 3 users")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
