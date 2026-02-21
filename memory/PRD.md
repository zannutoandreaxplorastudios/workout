# Gym Workout Progress Tracker - PRD

## Problema Originale
App responsive mobile per monitorare i progressi degli allenamenti in palestra. 3 giorni di allenamento, design iOS26-inspired, dark/light mode, nessun login.

## Architettura
- **Backend:** FastAPI + MongoDB (motor async)
- **Frontend:** React + Tailwind CSS + shadcn/ui + Recharts + Framer Motion
- **Font:** Manrope
- **Colore Accento:** Arancione soft (HSL ~25 80% 55%)

## Funzionalità Implementate

### MVP (Completato)
- Dashboard con 3 giorni di allenamento
- Schede allenamento comprimibili (giorno attivo espanso, altri compressi)
- Badge "Prossimo" sul giorno corrente
- Pagina allenamento attivo con checklist esercizi
- Barra progresso allenamento
- Modifica temporanea esercizi (nome, serie, reps, carico) per sessione
- Modifica permanente esercizi con endpoint backend dedicato
- Dettaglio esercizio con grafico progressione carichi (Recharts)
- Aggiunta nuovo carico con storico
- Completamento allenamento con report (volume, durata, variazioni carichi)
- Storico allenamenti nella dashboard con bordi colorati per giorno
- Pagina dettaglio sessione storica
- Dark/Light mode con toggle
- Icone SVG per gruppi muscolari (chest, back, quads, hamstrings, shoulders, triceps, biceps, abs)

### Modifiche UI/Funzionali (Completate)
- Colore accento arancione (sia light che dark mode)
- Carichi come numeri singoli (rimossi "+", "-" dai seed data)
- Esercizio "Addominali" aggiunto a tutti e 3 i giorni
- Capitalizzazione testo in tutta l'app
- Effetti blur/softness migliorati (glass, card-blur, glass-soft)
- Spaziatura verticale aumentata tra componenti
- Endpoint PUT per rinomina/modifica permanente esercizi
- Navigazione HistoryDetail → Dashboard (non più /history)

## API Endpoints
- `GET /api/workout-plans` - Lista piani
- `GET /api/workout-plans/{day}` - Piano singolo
- `PUT /api/workout-plans/{day}/exercises/{exId}` - Modifica esercizio (nome, sets, reps, load)
- `PUT /api/workout-plans/{day}/exercises/{exId}/load` - Aggiorna carico
- `POST /api/exercise-logs` - Crea log carico
- `GET /api/exercise-logs/{exId}` - Storico carichi
- `POST /api/workout-sessions` - Salva sessione
- `GET /api/workout-sessions` - Lista sessioni
- `GET /api/workout-sessions/{id}` - Dettaglio sessione
- `GET /api/next-workout` - Prossimo allenamento
- `POST /api/seed` - Reseed database

## DB Collections
- `workout_plans`: Piani con esercizi per giorno
- `exercise_logs`: Storico carichi per esercizio
- `workout_sessions`: Sessioni completate con report

## Testing
- Backend: 17 pytest tests (100% pass)
- Frontend: Tutti i flussi UI verificati
- Test report: /app/test_reports/iteration_2.json

## Backlog
- P2: Refactoring - rimozione History.jsx se funzionalità completamente migrata
- P2: Ulteriori miglioramenti icone muscoli per esercizi specifici
