from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import FileResponse
from starlette.staticfiles import StaticFiles
from motor.motor_asyncio import AsyncIOMotorClient
import os
import re
import logging
import subprocess
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
FRONTEND_BUILD_DIR = ROOT_DIR.parent / "frontend" / "build"
FRONTEND_DIR = ROOT_DIR.parent / "frontend"
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db_name = re.sub(r'\s+', '_', os.environ['DB_NAME'].strip())
if not db_name:
    raise RuntimeError("DB_NAME environment variable cannot be empty")
db = client[db_name]

app = FastAPI()
api_router = APIRouter(prefix="/api")


def ensure_frontend_build():
    if (FRONTEND_BUILD_DIR / "index.html").is_file():
        return
    if not (FRONTEND_DIR / "package.json").is_file():
        return
    try:
        subprocess.run(
            ["npm", "install", "--legacy-peer-deps"],
            cwd=FRONTEND_DIR,
            check=True,
            timeout=180,
        )
        subprocess.run(
            ["npm", "run", "build"],
            cwd=FRONTEND_DIR,
            check=True,
            timeout=180,
        )
    except (OSError, subprocess.SubprocessError) as exc:
        logging.getLogger(__name__).warning("Frontend build unavailable: %s", exc)


def parse_load(load_str: str) -> float:
    if not load_str or load_str == "Bodyweight":
        return 0
    match = re.match(r'(\d+)', str(load_str))
    return float(match.group(1)) if match else 0


PROFILES = [
    {"id": "andrea", "name": "Andrea", "color": "#F59E0B"},
]
WORKOUT_PLAN_VERSION = "andrea-2026-04-26"


class UpdateExerciseRequest(BaseModel):
    name: Optional[str] = None
    sets: Optional[int] = None
    reps: Optional[int] = None
    rep_range: Optional[str] = None
    current_load: Optional[str] = None
    muscle_group: Optional[str] = None
    muscle_label: Optional[str] = None


class AddExerciseRequest(BaseModel):
    name: str
    sets: int = 4
    reps: int = 10
    rep_range: str = ""
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
    rep_range: str = ""
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
            {"name": "Panca piana manubri", "sets": 3, "reps": 10, "rep_range": "6/10", "rest_time": "2.5-3 min", "rest_seconds": 180, "current_load": "16", "muscle_group": "chest", "muscle_label": "Chest"},
            {"name": "Lat machine", "sets": 4, "reps": 10, "rep_range": "6/10", "rest_time": "2.5-3 min", "rest_seconds": 180, "current_load": "0", "muscle_group": "back", "muscle_label": "Back"},
            {"name": "Panca inclinata manubri", "sets": 2, "reps": 12, "rep_range": "8/12", "rest_time": "2 min", "rest_seconds": 120, "current_load": "10", "muscle_group": "chest", "muscle_label": "Upper Chest"},
            {"name": "Alzate laterali cavi", "sets": 3, "reps": 15, "rep_range": "12/15", "rest_time": "60-90 sec", "rest_seconds": 90, "current_load": "7", "muscle_group": "shoulders", "muscle_label": "Shoulders"},
            {"name": "Leg extension", "sets": 2, "reps": 15, "rep_range": "12/15", "rest_time": "90 sec", "rest_seconds": 90, "current_load": "55", "muscle_group": "quads", "muscle_label": "Quads"},
            {"name": "Pushdown cavo", "sets": 2, "reps": 15, "rep_range": "10/15", "rest_time": "60-90 sec", "rest_seconds": 90, "current_load": "35", "muscle_group": "triceps", "muscle_label": "Triceps"},
            {"name": "Curl manubri", "sets": 2, "reps": 15, "rep_range": "10/15", "rest_time": "60-90 sec", "rest_seconds": 90, "current_load": "8", "muscle_group": "biceps", "muscle_label": "Biceps"},
            {"name": "Addominali", "sets": 1, "reps": 0, "rest_time": "10'", "rest_seconds": 600, "current_load": "Bodyweight", "muscle_group": "abs", "muscle_label": "Abs", "notes": "10 min"},
        ]
    },
    {
        "day_number": 2,
        "name": "Day 2",
        "exercises": [
            {"name": "Leg press", "sets": 3, "reps": 12, "rep_range": "8/12", "rest_time": "2.5-3 min", "rest_seconds": 180, "current_load": "90", "muscle_group": "quads", "muscle_label": "Quads"},
            {"name": "Deadlift", "sets": 2, "reps": 10, "rep_range": "6/10", "rest_time": "2.5-3 min", "rest_seconds": 180, "current_load": "0", "muscle_group": "hamstrings", "muscle_label": "Hamstrings"},
            {"name": "Rematore", "sets": 2, "reps": 12, "rep_range": "8/12", "rest_time": "2 min", "rest_seconds": 120, "current_load": "14", "muscle_group": "back", "muscle_label": "Back"},
            {"name": "Pulley", "sets": 3, "reps": 12, "rep_range": "8/12", "rest_time": "2 min", "rest_seconds": 120, "current_load": "30", "muscle_group": "back", "muscle_label": "Back"},
            {"name": "Alzate laterali manubri", "sets": 2, "reps": 15, "rep_range": "12/15", "rest_time": "60-90 sec", "rest_seconds": 90, "current_load": "7", "muscle_group": "shoulders", "muscle_label": "Shoulders"},
            {"name": "Curl EZ", "sets": 2, "reps": 12, "rep_range": "8/12", "rest_time": "90 sec", "rest_seconds": 90, "current_load": "30", "muscle_group": "biceps", "muscle_label": "Biceps"},
            {"name": "Estensioni tricipiti", "sets": 2, "reps": 15, "rep_range": "10/15", "rest_time": "90 sec", "rest_seconds": 90, "current_load": "25", "muscle_group": "triceps", "muscle_label": "Triceps"},
            {"name": "Addominali", "sets": 1, "reps": 0, "rest_time": "10'", "rest_seconds": 600, "current_load": "Bodyweight", "muscle_group": "abs", "muscle_label": "Abs", "notes": "10 min"},
        ]
    },
    {
        "day_number": 3,
        "name": "Day 3",
        "exercises": [
            {"name": "Panca inclinata manubri", "sets": 3, "reps": 12, "rep_range": "8/12", "rest_time": "2-3 min", "rest_seconds": 180, "current_load": "10", "muscle_group": "chest", "muscle_label": "Upper Chest"},
            {"name": "Lat machine", "sets": 3, "reps": 12, "rep_range": "8/12", "rest_time": "2-3 min", "rest_seconds": 180, "current_load": "0", "muscle_group": "back", "muscle_label": "Back"},
            {"name": "Croci petto", "sets": 2, "reps": 15, "rep_range": "12/15", "rest_time": "60-90 sec", "rest_seconds": 90, "current_load": "0", "muscle_group": "chest", "muscle_label": "Chest"},
            {"name": "Rematore macchina", "sets": 2, "reps": 15, "rep_range": "10/15", "rest_time": "2 min", "rest_seconds": 120, "current_load": "30", "muscle_group": "back", "muscle_label": "Back"},
            {"name": "Alzate laterali ai cavi", "sets": 4, "reps": 15, "rep_range": "12/15", "rest_time": "60-90 sec", "rest_seconds": 90, "current_load": "7", "muscle_group": "shoulders", "muscle_label": "Shoulders"},
            {"name": "Curl al cavo", "sets": 2, "reps": 15, "rep_range": "12/15", "rest_time": "60-90 sec", "rest_seconds": 90, "current_load": "30", "muscle_group": "biceps", "muscle_label": "Biceps"},
            {"name": "Pushdown corda", "sets": 2, "reps": 15, "rep_range": "12/15", "rest_time": "60-90 sec", "rest_seconds": 90, "current_load": "25", "muscle_group": "triceps", "muscle_label": "Triceps"},
            {"name": "Addominali", "sets": 1, "reps": 0, "rest_time": "10'", "rest_seconds": 600, "current_load": "Bodyweight", "muscle_group": "abs", "muscle_label": "Abs", "notes": "10 min"},
        ]
    }
]


def build_seed_plan(profile_id: str, day_data: dict) -> dict:
    exercises = []
    for idx, ex in enumerate(day_data["exercises"]):
        exercises.append({"id": f"{profile_id}-d{day_data['day_number']}-ex{idx}", **ex})
    return {
        "id": str(uuid.uuid4()),
        "user_id": profile_id,
        "day_number": day_data["day_number"],
        "name": day_data["name"],
        "exercises": exercises,
    }


async def sync_andrea_workout_plans():
    current = await db.app_meta.find_one({"key": "workout_plan_version"}, {"_id": 0})
    if current and current.get("value") == WORKOUT_PLAN_VERSION:
        return False

    for day_data in SEED_DATA:
        plan = build_seed_plan("andrea", day_data)
        await db.workout_plans.update_one(
            {"user_id": "andrea", "day_number": day_data["day_number"]},
            {"$set": {
                "user_id": plan["user_id"],
                "day_number": plan["day_number"],
                "name": plan["name"],
                "exercises": plan["exercises"],
            }, "$setOnInsert": {"id": plan["id"]}},
            upsert=True,
        )
    await db.app_meta.update_one(
        {"key": "workout_plan_version"},
        {"$set": {"value": WORKOUT_PLAN_VERSION, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    return True


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
            if req.rep_range is not None:
                if req.rep_range:
                    ex["rep_range"] = req.rep_range
                else:
                    ex.pop("rep_range", None)
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
        "rep_range": req.rep_range,
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
    await db.app_meta.delete_one({"key": "workout_plan_version"})
    await sync_andrea_workout_plans()
    return {"message": "Workout plans updated", "users": len(PROFILES), "days_per_user": len(SEED_DATA)}


ensure_frontend_build()

app.include_router(api_router)

if (FRONTEND_BUILD_DIR / "static").exists():
    app.mount("/static", StaticFiles(directory=FRONTEND_BUILD_DIR / "static"), name="static")

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
    updated = await sync_andrea_workout_plans()
    if updated:
        logger.info("Workout plans synced for Andrea")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    if full_path.startswith("api"):
        raise HTTPException(404, "Not found")

    requested_file = FRONTEND_BUILD_DIR / full_path
    if requested_file.is_file():
        return FileResponse(requested_file)

    index_file = FRONTEND_BUILD_DIR / "index.html"
    if index_file.is_file():
        return FileResponse(index_file)

    raise HTTPException(404, "Frontend build not found")
