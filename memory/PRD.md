# Gym Workout Tracker - PRD

## Problem Statement
App mobile-first per monitorare progressi in palestra. 3 giorni di workout pre-caricati con esercizi, serie, ripetizioni, tempi di recupero e carichi. Interfaccia iOS26-like minimal e moderna.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI + Framer Motion + Recharts
- **Backend**: FastAPI + MongoDB (Motor async driver)
- **Theme**: "Soft Performance" - Dark/Light mode with rose accent, Manrope font

## User Persona
- Single gym-goer who wants a clean, fast mobile interface to track workouts
- Italian language interface
- No authentication needed

## Core Requirements
1. 3 workout days pre-loaded from user's gym plan
2. Exercise checklist during workout sessions
3. Weight/load progression tracking with charts
4. Muscle group icons per exercise
5. Workout history with dates, times, duration
6. Session reports (volume, load changes %, time)
7. Modify exercises for current session only
8. Modify sets/reps/weight with full history
9. Dark/Light mode toggle

## What's Implemented (2026-02-21)
- [x] Full backend API with all CRUD endpoints
- [x] Auto-seeding of 3 workout days from user's gym plan
- [x] Dashboard with 3 day cards, "PROSSIMO" badge, exercise previews
- [x] Active Workout page with exercise checklist and progress bar
- [x] Exercise Detail Sheet with load progression chart (Recharts AreaChart)
- [x] Add new load permanently (updates plan + creates log entry)
- [x] Edit Exercise Dialog (session-only modification)
- [x] Complete Workout flow with duration input and auto-calculated report
- [x] Post-workout report: volume, load changes with %, completion stats
- [x] History page with chronological workout list
- [x] History Detail with full session report
- [x] Dark/Light mode toggle with localStorage persistence
- [x] Muscle group color-coded icons (lucide-react)
- [x] Bottom navigation (Home, Storico)
- [x] Mobile-first responsive design (max-w-md)
- [x] Framer Motion animations (card entry, stagger)
- [x] Glassmorphism effects on sticky headers and bottom nav

## Testing Results
- Backend: 100% pass rate
- Frontend: 95% pass rate (dev preview badge overlap only)

## Prioritized Backlog
### P1
- Rest timer (user declined for now)
- Export workout data (PDF/share)

### P2
- Weekly/monthly stats dashboard
- Personal records (PR) tracking
- Exercise swap suggestions by muscle group
- Multi-user support with auth

### P3
- Apple Health / Google Fit integration
- Custom workout plan editor
- Progressive overload suggestions (AI-powered)
