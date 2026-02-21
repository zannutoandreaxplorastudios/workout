"""
Backend API tests for Gym Workout Tracking App
Tests all CRUD operations for workout plans, exercise logs, and workout sessions
"""
import pytest
import requests
import os
import uuid

# Get base URL from environment variable (same as frontend uses)
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    raise ValueError("REACT_APP_BACKEND_URL environment variable not set")


class TestHealthAndRoot:
    """Test basic API health"""
    
    def test_root_endpoint(self):
        """Test root API endpoint returns correct message"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"] == "Gym Tracker API"
        print("✅ Root API endpoint working")


class TestWorkoutPlans:
    """Test workout plan endpoints - GET /api/workout-plans"""
    
    def test_get_all_workout_plans_returns_3_days(self):
        """Verify GET /api/workout-plans returns exactly 3 workout plans"""
        response = requests.get(f"{BASE_URL}/api/workout-plans")
        assert response.status_code == 200
        plans = response.json()
        assert isinstance(plans, list)
        assert len(plans) == 3, f"Expected 3 plans, got {len(plans)}"
        print(f"✅ Found {len(plans)} workout plans")
    
    def test_workout_plans_have_correct_structure(self):
        """Verify each plan has required fields"""
        response = requests.get(f"{BASE_URL}/api/workout-plans")
        plans = response.json()
        
        for plan in plans:
            assert "day_number" in plan
            assert "name" in plan
            assert "exercises" in plan
            assert isinstance(plan["exercises"], list)
            assert len(plan["exercises"]) > 0
        print("✅ All plans have correct structure")
    
    def test_workout_plans_ordered_by_day(self):
        """Verify plans are ordered by day_number (1, 2, 3)"""
        response = requests.get(f"{BASE_URL}/api/workout-plans")
        plans = response.json()
        
        day_numbers = [p["day_number"] for p in plans]
        assert day_numbers == [1, 2, 3], f"Expected [1, 2, 3], got {day_numbers}"
        print("✅ Plans ordered correctly by day number")
    
    def test_all_days_have_addominali_exercise(self):
        """Verify all 3 days have 'Addominali' exercise with 'Corpo libero' load"""
        response = requests.get(f"{BASE_URL}/api/workout-plans")
        plans = response.json()
        
        for plan in plans:
            addominali_exercises = [ex for ex in plan["exercises"] if ex["name"] == "Addominali"]
            assert len(addominali_exercises) == 1, f"Day {plan['day_number']} should have Addominali exercise"
            
            addominali = addominali_exercises[0]
            assert addominali["current_load"] == "Corpo libero", f"Day {plan['day_number']} Addominali should have 'Corpo libero' load, got: {addominali['current_load']}"
        print("✅ All 3 days have Addominali with 'Corpo libero' load")
    
    def test_get_individual_workout_plan(self):
        """Test GET /api/workout-plans/{day_number} for each day"""
        for day in [1, 2, 3]:
            response = requests.get(f"{BASE_URL}/api/workout-plans/{day}")
            assert response.status_code == 200, f"Failed to get plan for day {day}"
            plan = response.json()
            assert plan["day_number"] == day
            assert plan["name"] == f"Giorno {day}"
        print("✅ Individual workout plans accessible")
    
    def test_get_nonexistent_plan_returns_404(self):
        """Test GET /api/workout-plans/99 returns 404"""
        response = requests.get(f"{BASE_URL}/api/workout-plans/99")
        assert response.status_code == 404
        print("✅ Non-existent plan returns 404")


class TestExerciseUpdate:
    """Test exercise update endpoints - PUT /api/workout-plans/{day}/exercises/{exId}"""
    
    def test_update_exercise_name_permanently(self):
        """Test updating exercise name permanently"""
        # Get the first exercise of day 1
        response = requests.get(f"{BASE_URL}/api/workout-plans/1")
        plan = response.json()
        exercise = plan["exercises"][0]
        original_name = exercise["name"]
        exercise_id = exercise["id"]
        
        # Update the exercise name
        test_name = f"TEST_Exercise_{uuid.uuid4().hex[:8]}"
        update_response = requests.put(
            f"{BASE_URL}/api/workout-plans/1/exercises/{exercise_id}",
            json={"name": test_name}
        )
        assert update_response.status_code == 200, f"Update failed: {update_response.text}"
        
        # Verify the update persisted
        verify_response = requests.get(f"{BASE_URL}/api/workout-plans/1")
        verify_plan = verify_response.json()
        updated_exercise = next((ex for ex in verify_plan["exercises"] if ex["id"] == exercise_id), None)
        assert updated_exercise is not None
        assert updated_exercise["name"] == test_name
        
        # Restore original name
        requests.put(
            f"{BASE_URL}/api/workout-plans/1/exercises/{exercise_id}",
            json={"name": original_name}
        )
        print("✅ Exercise name update works permanently")
    
    def test_update_exercise_load_permanently(self):
        """Test updating exercise load updates the workout plan"""
        # Get exercise from day 1
        response = requests.get(f"{BASE_URL}/api/workout-plans/1")
        plan = response.json()
        # Use second exercise (not Addominali which has Corpo libero)
        exercise = plan["exercises"][1]
        original_load = exercise["current_load"]
        exercise_id = exercise["id"]
        
        # Update the load via the dedicated endpoint
        new_load = "99"
        update_response = requests.put(
            f"{BASE_URL}/api/workout-plans/1/exercises/{exercise_id}/load",
            json={"load": new_load}
        )
        assert update_response.status_code == 200
        
        # Verify the update
        verify_response = requests.get(f"{BASE_URL}/api/workout-plans/1")
        verify_plan = verify_response.json()
        updated_exercise = next((ex for ex in verify_plan["exercises"] if ex["id"] == exercise_id), None)
        assert updated_exercise["current_load"] == new_load
        
        # Restore original load
        requests.put(
            f"{BASE_URL}/api/workout-plans/1/exercises/{exercise_id}/load",
            json={"load": original_load}
        )
        print("✅ Exercise load update works via dedicated endpoint")
    
    def test_update_nonexistent_exercise_returns_404(self):
        """Test updating non-existent exercise returns 404"""
        response = requests.put(
            f"{BASE_URL}/api/workout-plans/1/exercises/fake-exercise-id",
            json={"name": "Test"}
        )
        assert response.status_code == 404
        print("✅ Non-existent exercise update returns 404")


class TestExerciseLogs:
    """Test exercise logs endpoints"""
    
    def test_create_and_get_exercise_log(self):
        """Test creating an exercise log and retrieving it"""
        log_data = {
            "exercise_id": "d1-ex0",
            "exercise_name": "Test Exercise",
            "load": "25",
            "sets": 4,
            "reps": 10,
            "day_number": 1
        }
        
        # Create log
        create_response = requests.post(f"{BASE_URL}/api/exercise-logs", json=log_data)
        assert create_response.status_code == 200
        created_log = create_response.json()
        assert "id" in created_log
        assert created_log["load"] == "25"
        
        # Retrieve logs for this exercise
        get_response = requests.get(f"{BASE_URL}/api/exercise-logs/d1-ex0")
        assert get_response.status_code == 200
        logs = get_response.json()
        assert isinstance(logs, list)
        assert len(logs) > 0
        print("✅ Exercise log create and retrieve works")


class TestWorkoutSessions:
    """Test workout session endpoints"""
    
    def test_create_workout_session_with_report(self):
        """Test creating a workout session returns a report"""
        session_data = {
            "day_number": 1,
            "day_name": "Giorno 1",
            "duration_minutes": 45,
            "exercises": [
                {
                    "exercise_id": "d1-ex0",
                    "name": "Panca piana man",
                    "sets": 4,
                    "reps": 4,
                    "load": "16",
                    "muscle_group": "chest",
                    "muscle_label": "Pettorali",
                    "completed": True,
                    "was_modified": False,
                    "original_name": "Panca piana man"
                },
                {
                    "exercise_id": "d1-ex1",
                    "name": "Pressa",
                    "sets": 4,
                    "reps": 4,
                    "load": "90",
                    "muscle_group": "quads",
                    "muscle_label": "Quadricipiti",
                    "completed": True,
                    "was_modified": False,
                    "original_name": "Pressa"
                }
            ]
        }
        
        response = requests.post(f"{BASE_URL}/api/workout-sessions", json=session_data)
        assert response.status_code == 200
        session = response.json()
        
        # Check session has required fields
        assert "id" in session
        assert "day_number" in session
        assert "completed_at" in session
        assert "report" in session
        
        # Check report structure
        report = session["report"]
        assert "total_volume" in report
        assert "total_exercises" in report
        assert "completed_exercises" in report
        assert report["total_exercises"] == 2
        assert report["completed_exercises"] == 2
        
        # Volume calculation: (4 sets * 4 reps * 16 kg) + (4 sets * 4 reps * 90 kg) = 256 + 1440 = 1696
        expected_volume = (4 * 4 * 16) + (4 * 4 * 90)
        assert report["total_volume"] == expected_volume, f"Expected volume {expected_volume}, got {report['total_volume']}"
        
        print(f"✅ Workout session created with report (volume: {report['total_volume']}kg)")
    
    def test_get_workout_sessions(self):
        """Test retrieving all workout sessions"""
        response = requests.get(f"{BASE_URL}/api/workout-sessions")
        assert response.status_code == 200
        sessions = response.json()
        assert isinstance(sessions, list)
        print(f"✅ Retrieved {len(sessions)} workout sessions")
    
    def test_get_individual_session(self):
        """Test retrieving an individual workout session"""
        # First get all sessions
        all_response = requests.get(f"{BASE_URL}/api/workout-sessions")
        sessions = all_response.json()
        
        if len(sessions) > 0:
            session_id = sessions[0]["id"]
            response = requests.get(f"{BASE_URL}/api/workout-sessions/{session_id}")
            assert response.status_code == 200
            session = response.json()
            assert session["id"] == session_id
            print(f"✅ Individual session retrieval works")
        else:
            pytest.skip("No sessions to test")
    
    def test_get_nonexistent_session_returns_404(self):
        """Test getting non-existent session returns 404"""
        response = requests.get(f"{BASE_URL}/api/workout-sessions/fake-session-id")
        assert response.status_code == 404
        print("✅ Non-existent session returns 404")


class TestNextWorkout:
    """Test next workout endpoint"""
    
    def test_get_next_workout(self):
        """Test GET /api/next-workout returns correct structure"""
        response = requests.get(f"{BASE_URL}/api/next-workout")
        assert response.status_code == 200
        data = response.json()
        
        assert "next_day" in data
        assert "last_sessions" in data
        assert data["next_day"] in [1, 2, 3]
        print(f"✅ Next workout day: {data['next_day']}")


class TestSeedEndpoint:
    """Test database seeding endpoint"""
    
    def test_seed_endpoint_exists(self):
        """Test that seed endpoint exists and works"""
        response = requests.post(f"{BASE_URL}/api/seed")
        assert response.status_code == 200
        data = response.json()
        assert data["days"] == 3
        print("✅ Seed endpoint works")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
