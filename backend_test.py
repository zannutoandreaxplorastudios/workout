import requests
import json
import sys
from datetime import datetime

class GymTrackerAPITester:
    def __init__(self):
        self.base_url = "https://workout-progress-log-1.preview.emergentagent.com/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.passed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                self.passed_tests.append(name)
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, response.text
            else:
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:200] if hasattr(response, 'text') else str(response)
                })
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            self.failed_tests.append({
                "test": name,
                "error": str(e)
            })
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "/", 200)

    def test_get_workout_plans(self):
        """Test getting all workout plans"""
        success, response = self.run_test("Get Workout Plans", "GET", "/workout-plans", 200)
        if success and isinstance(response, list):
            print(f"Found {len(response)} workout plans")
            if len(response) == 3:
                print("✅ Correct number of workout plans (3)")
                return True, response
            else:
                print(f"❌ Expected 3 plans, got {len(response)}")
        return success, response

    def test_get_workout_plan(self, day_number):
        """Test getting specific workout plan"""
        return self.run_test(f"Get Workout Plan Day {day_number}", "GET", f"/workout-plans/{day_number}", 200)

    def test_get_next_workout(self):
        """Test getting next workout"""
        success, response = self.run_test("Get Next Workout", "GET", "/next-workout", 200)
        if success and isinstance(response, dict):
            if 'next_day' in response:
                print(f"✅ Next workout day: {response['next_day']}")
                return True, response
        return success, response

    def test_create_workout_session(self):
        """Test creating a workout session"""
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
                }
            ]
        }
        success, response = self.run_test("Create Workout Session", "POST", "/workout-sessions", 200, session_data)
        if success and isinstance(response, dict) and 'id' in response:
            print(f"✅ Created session with ID: {response['id']}")
            return True, response
        return success, response

    def test_create_exercise_log(self):
        """Test creating an exercise log"""
        log_data = {
            "exercise_id": "d1-ex0",
            "exercise_name": "Panca piana man",
            "load": "17",
            "sets": 4,
            "reps": 4,
            "day_number": 1
        }
        return self.run_test("Create Exercise Log", "POST", "/exercise-logs", 200, log_data)

    def test_update_exercise_load(self):
        """Test updating exercise load"""
        load_data = {"load": "18"}
        return self.run_test("Update Exercise Load", "PUT", "/workout-plans/1/exercises/d1-ex0/load", 200, load_data)

    def test_get_exercise_logs(self):
        """Test getting exercise logs"""
        return self.run_test("Get Exercise Logs", "GET", "/exercise-logs/d1-ex0", 200)

    def test_get_workout_sessions(self):
        """Test getting all workout sessions"""
        return self.run_test("Get Workout Sessions", "GET", "/workout-sessions", 200)

def main():
    print("🏋️ Starting Gym Tracker API Tests...")
    print(f"Testing against: https://workout-progress-log-1.preview.emergentagent.com/api")
    
    tester = GymTrackerAPITester()
    
    # Test basic endpoints
    tester.test_root_endpoint()
    
    # Test workout plans
    success, plans = tester.test_get_workout_plans()
    if success:
        # Test individual workout plans
        for day in [1, 2, 3]:
            tester.test_get_workout_plan(day)
    
    # Test next workout
    tester.test_get_next_workout()
    
    # Test exercise operations
    tester.test_create_exercise_log()
    tester.test_update_exercise_load()
    tester.test_get_exercise_logs()
    
    # Test workout session operations
    tester.test_create_workout_session()
    tester.test_get_workout_sessions()

    # Print final results
    print(f"\n📊 BACKEND TEST RESULTS:")
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"Success rate: {round((tester.tests_passed / tester.tests_run) * 100, 1)}%")
    
    if tester.failed_tests:
        print(f"\n❌ Failed Tests:")
        for failure in tester.failed_tests:
            print(f"  - {failure.get('test', 'Unknown')}: {failure.get('error', failure.get('actual', 'Unknown error'))}")
    
    print(f"\n✅ Passed Tests:")
    for test in tester.passed_tests:
        print(f"  - {test}")

    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())