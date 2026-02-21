# Gym Workout Progress Tracker - PRD

## Original Problem Statement
App responsive mobile per monitorare i progressi degli allenamenti in palestra con supporto multi-utente.

## Architecture
- **Backend:** FastAPI + MongoDB (motor async)
- **Frontend:** React + Tailwind CSS + shadcn/ui + Recharts + Framer Motion
- **Font:** Manrope
- **Accent Color:** Soft Orange (HSL ~25 90% 60%)
- **Language:** English (all UI)
- **Auth:** Simple profile selection (no passwords)

## Users
- Andrea (amber #F59E0B)
- Roy (blue #3B82F6)
- Romi (green #10B981)

## Features Implemented

### Multi-User System (Feb 21, 2026)
- Profile selection screen with 3 users (Andrea, Roy, Romi)
- Each user has fully independent data (workout plans, exercise logs, sessions)
- Profile persisted in localStorage
- Profile switch via avatar button in dashboard header
- All API endpoints scoped by `user_id` query parameter

### Workout Management
- 3-day workout program (expandable to max 4 days)
- Collapsible day cards (next day expanded, others collapsed)
- "Next" badge on current workout day
- Add new workout day (dialog with name input)
- Delete workout day (with confirmation)

### Exercise Tracking
- Exercise checklist with completion toggle
- Add exercise to a day (with name, sets, reps, load, muscle group)
- Delete exercise from a day
- Edit exercise (temporary session-only or permanent save)
- Muscle group selector dropdown
- Exercise detail sheet with load progression chart (Recharts)
- Load history with ability to add new loads

### Workout Sessions & History
- Complete workout with duration input
- Post-workout report (volume, duration, load changes %)
- Recent history on dashboard with colored borders per day
- Full history page with all completed sessions
- History detail page with stats and exercises performed

### UI/UX
- Dark/Light mode toggle
- Orange accent color
- Blur/softness effects (glass, card-blur, glass-soft)
- SVG muscle group icons (chest, back, quads, hamstrings, shoulders, triceps, biceps, abs)
- Bottom navigation (Home, History)
- Capitalize text across the app

## API Endpoints (all require `?user_id=xxx`)
- `GET /api/profiles` - List profiles (no user_id needed)
- `GET /api/workout-plans` - User's plans
- `GET /api/workout-plans/{day}` - Single plan
- `POST /api/workout-plans` - Create day (max 4)
- `DELETE /api/workout-plans/{day}` - Delete day
- `PUT /api/workout-plans/{day}/exercises/{exId}` - Update exercise
- `POST /api/workout-plans/{day}/exercises` - Add exercise
- `DELETE /api/workout-plans/{day}/exercises/{exId}` - Delete exercise
- `PUT /api/workout-plans/{day}/exercises/{exId}/load` - Update load
- `POST /api/exercise-logs` - Create log
- `GET /api/exercise-logs/{exId}` - Load history
- `POST /api/workout-sessions` - Save session
- `GET /api/workout-sessions` - List sessions
- `GET /api/workout-sessions/{id}` - Session detail
- `GET /api/next-workout` - Next workout info
- `POST /api/seed` - Reseed database

## DB Collections
- `workout_plans`: {user_id, day_number, name, exercises[]}
- `exercise_logs`: {user_id, exercise_id, exercise_name, load, date}
- `workout_sessions`: {user_id, day_number, day_name, completed_at, duration_minutes, exercises[], report}

## Testing
- Backend: 22 pytest tests (100% pass)
- Frontend: All UI flows verified
- Test reports: /app/test_reports/iteration_3.json

## Backlog
- P2: Refactoring - remove History.jsx if fully migrated to Dashboard
- P2: Weekly summary chart on dashboard
- P3: Export/import workout data
