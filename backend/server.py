from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import re
import logging
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")


def parse_load(load_str: str) -> float:
    if not load_str or load_str == "Bodyweight":
        return 0
    match = re.match(r'(\d+)', str(load_str))
    return float(match.group(1)) if match else 0


PROFILES = [
    {"id": "andrea", "name": "Andrea", "color": "#F59E0B"},
    {"id": "roy", "name": "Roy", "color": "#3B82F6"},
    {"id": "romi", "name": "Romi", "color": "#10B981"},
]


class UpdateExerciseRequest(BaseModel):
    name: Optional[str] = None
    sets: Optional[int] = None
    reps: Optional[int] = None
    current_load: Optional[str] = None
    muscle_group: Optional[str] = None
    muscle_label: Optional[str] = None


class AddExerciseRequest(BaseModel):
    name: str
    sets: int = 4
    reps: int = 10
    rest_time: str = "1'"
    rest_seconds: int = 60
    current_load: str = "0"
    muscle_group: str = "chest"
    muscle_label: str = "Chest"
    notes: str = ""


class UpdateLoadRequest(BaseModel):
    load: str


class ExerciseLogCreate(BaseModel):
    exercise_id: str
    exercise_name: str
    load: str
    sets: int = 0
    reps: int = 0
    day_number: int = 0


class SessionExercise(BaseModel):
    exercise_id: str
    name: str
    sets: int
    reps: int
    load: str
    muscle_group: str
    muscle_label: str
    completed: bool = True
    was_modified: bool = False
    original_name: str = ""


class WorkoutSessionCreate(BaseModel):
    day_number: int
    day_name: str
    duration_minutes: int
    exercises: List[SessionExercise]


class CreateDayRequest(BaseModel):
    name: Optional[str] = None


SEED_DATA = [
    {
        "day_number": 1,
        "name": "Day 1",
        "exercises": [
            {"name": "Panca piana man", "sets": 4, "reps": 4, "rest_time": "2'", "rest_seconds": 120, "current_load": "16", "muscle_group": "chest", "muscle_label": "Chest"},
            {"name": "Pressa", "sets": 4, "reps": 4, "rest_time": "2'", "rest_seconds": 120, "current_load": "90", "muscle_group": "quads", "muscle_label": "Quads"},
            {"name": "Rematore man", "sets": 4, "reps": 4, "rest_time": "2'", "rest_seconds": 120, "current_load": "14", "muscle_group": "back", "muscle_label": "Back"},
            {"name": "Alzate laterali", "sets": 4, "reps": 10, "rest_time": "1'", "rest_seconds": 60, "current_load": "7", "muscle_group": "shoulders", "muscle_label": "Shoulders"},
            {"name": "Push down barra", "sets": 4, "reps": 10, "rest_time": "1'", "rest_seconds": 60, "current_load": "35", "muscle_group": "triceps", "muscle_label": "Triceps"},
            {"name": "Curl man", "sets": 4, "reps": 10, "rest_time": "1'", "rest_seconds": 60, "current_load": "8", "muscle_group": "biceps", "muscle_label": "Biceps"},
            {"name": "Addominali", "sets": 1, "reps": 0, "rest_time": "10'", "rest_seconds": 600, "current_load": "Bodyweight", "muscle_group": "abs", "muscle_label": "Abs", "notes": "10 min"},
        ]
    },
    {
        "day_number": 2,
        "name": "Day 2",
        "exercises": [
            {"name": "Panca 30\u00b0", "sets": 4, "reps": 8, "rest_time": "1'30''", "rest_seconds": 90, "current_load": "10", "muscle_group": "chest", "muscle_label": "Upper Chest"},
            {"name": "Leg extension", "sets": 4, "reps": 8, "rest_time": "1'30''", "rest_seconds": 90, "current_load": "55", "muscle_group": "quads", "muscle_label": "Quads"},
            {"name": "Rouder mach", "sets": 4, "reps": 8, "rest_time": "1'30''", "rest_seconds": 90, "current_load": "30", "muscle_group": "back", "muscle_label": "Back"},
            {"name": "Arnold press", "sets": 4, "reps": 8, "rest_time": "1'30''", "rest_seconds": 90, "current_load": "10", "muscle_group": "shoulders", "muscle_label": "Shoulders"},
            {"name": "Face pull", "sets": 4, "reps": 10, "rest_time": "1'", "rest_seconds": 60, "current_load": "30", "muscle_group": "shoulders", "muscle_label": "Rear Delts"},
            {"name": "Curl corda", "sets": 4, "reps": 10, "rest_time": "1'", "rest_seconds": 60, "current_load": "30", "muscle_group": "biceps", "muscle_label": "Biceps"},
            {"name": "Addominali", "sets": 1, "reps": 0, "rest_time": "10'", "rest_seconds": 600, "current_load": "Bodyweight", "muscle_group": "abs", "muscle_label": "Abs", "notes": "10 min"},
        ]
    },
    {
        "day_number": 3,
        "name": "Day 3",
        "exercises": [
            {"name": "Panca piana man", "sets": 4, "reps": 12, "rest_time": "1'", "rest_seconds": 60, "current_load": "30", "muscle_group": "chest", "muscle_label": "Chest"},
            {"name": "Leg curl", "sets": 4, "reps": 12, "rest_time": "1'", "rest_seconds": 60, "current_load": "40", "muscle_group": "hamstrings", "muscle_label": "Hamstrings"},
            {"name": "Pulley", "sets": 4, "reps": 12, "rest_time": "1'", "rest_seconds": 60, "current_load": "30", "muscle_group": "back", "muscle_label": "Back"},
            {"name": "Alzate posteriori", "sets": 4, "reps": 15, "rest_time": "1'", "rest_seconds": 60, "current_load": "10", "muscle_group": "shoulders", "muscle_label": "Rear Delts"},
            {"name": "Push down triangolo", "sets": 4, "reps": 15, "rest_time": "1'", "rest_seconds": 60, "current_load": "25", "muscle_group": "triceps", "muscle_label": "Triceps"},
            {"name": "Curl 60\u00b0 man", "sets": 4, "reps": 15, "rest_time": "1'", "rest_seconds": 60, "current_load": "6", "muscle_group": "biceps", "muscle_label": "Biceps"},
            {"name": "Addominali", "sets": 1, "reps": 0, "rest_time": "10'", "rest_seconds": 600, "current_load": "Bodyweight", "muscle_group": "abs", "muscle_label": "Abs", "notes": "10 min"},
        ]
    }
]


@api_router.get("/")
async def root():
    return {"message": "Gym Tracker API"}


@api_router.get("/profiles")
async def get_profiles():
    return PROFILES


@api_router.get("/workout-plans")
async def get_workout_plans(user_id: str = Query(...)):
    return await db.workout_plans.find({"user_id": user_id}, {"_id": 0}).sort("day_number", 1).to_list(10)


@api_router.get("/workout-plans/{day_number}")
async def get_workout_plan(day_number: int, user_id: str = Query(...)):
    plan = await db.workout_plans.find_one({"user_id": user_id, "day_number": day_number}, {"_id": 0})
    if not plan:
        raise HTTPException(404, "Plan not found")
    return plan


@api_router.post("/workout-plans")
async def create_workout_day(user_id: str = Query(...), req: CreateDayRequest = CreateDayRequest()):
    existing = await db.workout_plans.find({"user_id": user_id}, {"_id": 0}).sort("day_number", -1).to_list(10)
    if len(existing) >= 4:
        raise HTTPException(400, "Maximum 4 workout days allowed")
    next_num = (existing[0]["day_number"] + 1) if existing else 1
    name = req.name if req.name else f"Day {next_num}"
    plan = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "day_number": next_num,
        "name": name,
        "exercises": []
    }
    await db.workout_plans.insert_one(plan)
    plan.pop("_id", None)
    return plan


@api_router.delete("/workout-plans/{day_number}")
async def delete_workout_day(day_number: int, user_id: str = Query(...)):
    result = await db.workout_plans.delete_one({"user_id": user_id, "day_number": day_number})
    if result.deleted_count == 0:
        raise HTTPException(404, "Plan not found")
    return {"message": "Day deleted"}


@api_router.put("/workout-plans/{day_number}/exercises/{exercise_id}")
async def update_exercise(day_number: int, exercise_id: str, req: UpdateExerciseRequest, user_id: str = Query(...)):
    plan = await db.workout_plans.find_one({"user_id": user_id, "day_number": day_number})
    if not plan:
        raise HTTPException(404, "Plan not found")
    updated = False
    for ex in plan["exercises"]:
        if ex["id"] == exercise_id:
            if req.name is not None:
                ex["name"] = req.name
            if req.sets is not None:
                ex["sets"] = req.sets
            if req.reps is not None:
                ex["reps"] = req.reps
            if req.current_load is not None:
                ex["current_load"] = req.current_load
            if req.muscle_group is not None:
                ex["muscle_group"] = req.muscle_group
            if req.muscle_label is not None:
                ex["muscle_label"] = req.muscle_label
            updated = True
            break
    if not updated:
        raise HTTPException(404, "Exercise not found")
    await db.workout_plans.update_one(
        {"user_id": user_id, "day_number": day_number},
        {"$set": {"exercises": plan["exercises"]}}
    )
    return {"message": "Exercise updated"}


@api_router.post("/workout-plans/{day_number}/exercises")
async def add_exercise(day_number: int, req: AddExerciseRequest, user_id: str = Query(...)):
    plan = await db.workout_plans.find_one({"user_id": user_id, "day_number": day_number})
    if not plan:
        raise HTTPException(404, "Plan not found")
    ex_id = str(uuid.uuid4())[:8]
    exercise = {
        "id": ex_id,
        "name": req.name,
        "sets": req.sets,
        "reps": req.reps,
        "rest_time": req.rest_time,
        "rest_seconds": req.rest_seconds,
        "current_load": req.current_load,
        "muscle_group": req.muscle_group,
        "muscle_label": req.muscle_label,
        "notes": req.notes,
    }
    plan["exercises"].append(exercise)
    await db.workout_plans.update_one(
        {"user_id": user_id, "day_number": day_number},
        {"$set": {"exercises": plan["exercises"]}}
    )
    return exercise


@api_router.delete("/workout-plans/{day_number}/exercises/{exercise_id}")
async def delete_exercise(day_number: int, exercise_id: str, user_id: str = Query(...)):
    plan = await db.workout_plans.find_one({"user_id": user_id, "day_number": day_number})
    if not plan:
        raise HTTPException(404, "Plan not found")
    original_len = len(plan["exercises"])
    plan["exercises"] = [ex for ex in plan["exercises"] if ex["id"] != exercise_id]
    if len(plan["exercises"]) == original_len:
        raise HTTPException(404, "Exercise not found")
    await db.workout_plans.update_one(
        {"user_id": user_id, "day_number": day_number},
        {"$set": {"exercises": plan["exercises"]}}
    )
    return {"message": "Exercise deleted"}


@api_router.put("/workout-plans/{day_number}/exercises/{exercise_id}/load")
async def update_exercise_load(day_number: int, exercise_id: str, req: UpdateLoadRequest, user_id: str = Query(...)):
    plan = await db.workout_plans.find_one({"user_id": user_id, "day_number": day_number})
    if not plan:
        raise HTTPException(404, "Plan not found")
    ex_name = ""
    for ex in plan["exercises"]:
        if ex["id"] == exercise_id:
            ex["current_load"] = req.load
            ex_name = ex["name"]
            break
    else:
        raise HTTPException(404, "Exercise not found")
    await db.workout_plans.update_one(
        {"user_id": user_id, "day_number": day_number},
        {"$set": {"exercises": plan["exercises"]}}
    )
    log_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "exercise_id": exercise_id,
        "exercise_name": ex_name,
        "load": req.load,
        "date": datetime.now(timezone.utc).isoformat(),
        "day_number": day_number
    }
    await db.exercise_logs.insert_one(log_doc)
    return {"message": "Load updated", "new_load": req.load}


@api_router.post("/exercise-logs")
async def create_exercise_log(log: ExerciseLogCreate, user_id: str = Query(...)):
    log_id = str(uuid.uuid4())
    log_doc = {
        "id": log_id,
        "user_id": user_id,
        "exercise_id": log.exercise_id,
        "exercise_name": log.exercise_name,
        "load": log.load,
        "sets": log.sets,
        "reps": log.reps,
        "date": datetime.now(timezone.utc).isoformat(),
        "day_number": log.day_number
    }
    await db.exercise_logs.insert_one(log_doc)
    if log.day_number > 0:
        plan = await db.workout_plans.find_one({"user_id": user_id, "day_number": log.day_number})
        if plan:
            for ex in plan["exercises"]:
                if ex["id"] == log.exercise_id:
                    ex["current_load"] = log.load
                    break
            await db.workout_plans.update_one(
                {"user_id": user_id, "day_number": log.day_number},
                {"$set": {"exercises": plan["exercises"]}}
            )
    return await db.exercise_logs.find_one({"id": log_id}, {"_id": 0})


@api_router.get("/exercise-logs/{exercise_id}")
async def get_exercise_logs(exercise_id: str, user_id: str = Query(...)):
    return await db.exercise_logs.find(
        {"user_id": user_id, "exercise_id": exercise_id}, {"_id": 0}
    ).sort("date", 1).to_list(1000)


@api_router.post("/workout-sessions")
async def create_workout_session(session: WorkoutSessionCreate, user_id: str = Query(...)):
    prev = await db.workout_sessions.find_one(
        {"user_id": user_id, "day_number": session.day_number}, {"_id": 0},
        sort=[("completed_at", -1)]
    )
    load_changes = []
    if prev:
        prev_map = {ex["exercise_id"]: ex for ex in prev["exercises"]}
        for ex in session.exercises:
            if ex.exercise_id in prev_map:
                prev_load = parse_load(prev_map[ex.exercise_id]["load"])
                curr_load = parse_load(ex.load)
                if prev_load > 0 and curr_load != prev_load:
                    pct = round(((curr_load - prev_load) / prev_load) * 100, 1)
                    load_changes.append({
                        "exercise_name": ex.name,
                        "previous_load": prev_map[ex.exercise_id]["load"],
                        "current_load": ex.load,
                        "change_pct": pct
                    })
    total_volume = sum(
        ex.sets * ex.reps * parse_load(ex.load)
        for ex in session.exercises if ex.completed
    )
    report = {
        "total_volume": total_volume,
        "total_exercises": len(session.exercises),
        "completed_exercises": sum(1 for ex in session.exercises if ex.completed),
        "load_changes": load_changes
    }
    session_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "day_number": session.day_number,
        "day_name": session.day_name,
        "completed_at": datetime.now(timezone.utc).isoformat(),
        "duration_minutes": session.duration_minutes,
        "exercises": [ex.model_dump() for ex in session.exercises],
        "report": report
    }
    await db.workout_sessions.insert_one(session_doc)
    session_doc.pop("_id", None)
    return session_doc


@api_router.get("/workout-sessions")
async def get_workout_sessions(user_id: str = Query(...)):
    return await db.workout_sessions.find({"user_id": user_id}, {"_id": 0}).sort("completed_at", -1).to_list(1000)


@api_router.get("/workout-sessions/{session_id}")
async def get_workout_session(session_id: str, user_id: str = Query(...)):
    session = await db.workout_sessions.find_one({"user_id": user_id, "id": session_id}, {"_id": 0})
    if not session:
        raise HTTPException(404, "Session not found")
    return session


@api_router.get("/next-workout")
async def get_next_workout(user_id: str = Query(...)):
    plans = await db.workout_plans.find({"user_id": user_id}, {"_id": 0}).sort("day_number", 1).to_list(10)
    day_numbers = [p["day_number"] for p in plans]
    last_sessions = {}
    for day in day_numbers:
        s = await db.workout_sessions.find_one(
            {"user_id": user_id, "day_number": day}, {"_id": 0}, sort=[("completed_at", -1)]
        )
        if s:
            last_sessions[str(day)] = {
                "completed_at": s["completed_at"],
                "duration_minutes": s.get("duration_minutes", 0)
            }
    last = await db.workout_sessions.find_one(
        {"user_id": user_id}, {"_id": 0, "day_number": 1}, sort=[("completed_at", -1)]
    )
    next_day = day_numbers[0] if day_numbers else 1
    if last and day_numbers:
        try:
            current_idx = day_numbers.index(last["day_number"])
            next_day = day_numbers[(current_idx + 1) % len(day_numbers)]
        except ValueError:
            next_day = day_numbers[0]
    return {"next_day": next_day, "last_sessions": last_sessions, "total_days": len(day_numbers)}


@api_router.post("/seed")
async def seed_database():
    await db.workout_plans.delete_many({})
    await db.exercise_logs.delete_many({})
    await db.workout_sessions.delete_many({})
    for profile in PROFILES:
        for day_data in SEED_DATA:
            exercises = []
            for idx, ex in enumerate(day_data["exercises"]):
                exercises.append({"id": f"{profile['id']}-d{day_data['day_number']}-ex{idx}", **ex})
            await db.workout_plans.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": profile["id"],
                "day_number": day_data["day_number"],
                "name": day_data["name"],
                "exercises": exercises
            })
    return {"message": "Database seeded", "users": len(PROFILES), "days_per_user": len(SEED_DATA)}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup():
    count = await db.workout_plans.count_documents({"user_id": {"$exists": True}})
    if count == 0:
        await db.workout_plans.delete_many({})
        await db.exercise_logs.delete_many({})
        await db.workout_sessions.delete_many({})
        for profile in PROFILES:
            for day_data in SEED_DATA:
                exercises = []
                for idx, ex in enumerate(day_data["exercises"]):
                    exercises.append({"id": f"{profile['id']}-d{day_data['day_number']}-ex{idx}", **ex})
                await db.workout_plans.insert_one({
                    "id": str(uuid.uuid4()),
                    "user_id": profile["id"],
                    "day_number": day_data["day_number"],
                    "name": day_data["name"],
                    "exercises": exercises
                })
        logger.info(f"Database seeded for {len(PROFILES)} users")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
