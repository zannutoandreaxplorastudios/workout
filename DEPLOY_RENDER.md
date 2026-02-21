# Deploy su Render + MongoDB Atlas (guida passo passo)

Questa app ha:
- **Backend FastAPI** in `backend/server.py`
- **Frontend React (CRA + CRACO)** in `frontend/`
- Connessione DB via variabili ambiente `MONGO_URL` e `DB_NAME`

---

## 1) Prerequisiti

- Repository pushato su GitHub/GitLab/Bitbucket.
- Database già creato su **MongoDB Atlas** (ok, ce l’hai già).
- Account Render: https://render.com

---

## 2) Prepara MongoDB Atlas (sicurezza + connessione)

1. In Atlas apri **Network Access**.
2. Aggiungi IP `0.0.0.0/0` (solo per semplicità iniziale), poi restringi quando hai finito.
3. In **Database Access**, verifica utente/password del DB.
4. Copia la **connection string** (`mongodb+srv://...`).

> Nota: in questa app Render userà la stringa completa dentro `MONGO_URL`.

---

## 3) Deploy del backend su Render (Web Service)

1. Render → **New** → **Web Service**.
2. Collega il repo e seleziona branch (es. `main`).
3. Configura:
   - **Name**: `workout-backend` (a scelta)
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**:
     ```bash
     pip install -r requirements.txt
     ```
   - **Start Command**:
     ```bash
     uvicorn server:app --host 0.0.0.0 --port $PORT
     ```

4. In **Environment Variables** aggiungi:
   - `MONGO_URL` = tua connection string Atlas
   - `DB_NAME` = nome del database (es. `workout`)
   - `CORS_ORIGINS` = URL frontend Render (es. `https://workout-frontend.onrender.com`)

5. Avvia deploy.

6. Quando è online, verifica health endpoint:
   - `GET https://<tuo-backend>.onrender.com/api/`

Dovresti vedere:
```json
{"message":"Gym Tracker API"}
```

---

## 4) Deploy del frontend su Render (Static Site)

1. Render → **New** → **Static Site**.
2. Collega lo stesso repo.
3. Configura:
   - **Name**: `workout-frontend` (a scelta)
   - **Root Directory**: `frontend`
   - **Build Command**:
     ```bash
     yarn install && yarn build
     ```
   - **Publish Directory**: `build`

4. In **Environment Variables** aggiungi:
   - `REACT_APP_BACKEND_URL` = URL backend Render (senza slash finale), esempio:
     `https://workout-backend.onrender.com`

5. Deploy.

---

## 5) Collega CORS tra frontend e backend

Dopo aver creato il frontend, copia il suo URL definitivo e aggiorna nel backend:

- `CORS_ORIGINS=https://<tuo-frontend>.onrender.com`

Poi fai **Manual Deploy** del backend per applicare la variabile aggiornata.

---

## 6) Checklist finale (ordine consigliato)

1. Deploy backend con `MONGO_URL` e `DB_NAME`.
2. Verifica endpoint `/api/`.
3. Deploy frontend con `REACT_APP_BACKEND_URL`.
4. Aggiorna `CORS_ORIGINS` sul backend con URL frontend definitivo.
5. Apri frontend e testa chiamate API.

---

## 7) Troubleshooting rapido

### Errore CORS nel browser
- Controlla `CORS_ORIGINS` nel backend.
- Deve combaciare esattamente con l’origin frontend (`https://...onrender.com`).

### 500 dal backend su query DB
- Verifica `MONGO_URL` e `DB_NAME`.
- Verifica utente/password Atlas e accesso rete.

### Frontend non chiama API giusta
- Verifica `REACT_APP_BACKEND_URL` (senza slash finale).
- Ridistribuisci il frontend dopo cambi env.

### Primo avvio lento su Render Free
- Normale: cold start.

---

## 8) Configurazione minima consigliata (copiabile)

### Backend env
```env
MONGO_URL=mongodb+srv://USER:PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority
DB_NAME=workout
CORS_ORIGINS=https://workout-frontend.onrender.com
```

### Frontend env
```env
REACT_APP_BACKEND_URL=https://workout-backend.onrender.com
```

---

Se vuoi, al prossimo step posso prepararti anche un `render.yaml` (Blueprint) così deployi backend + frontend con 1 click.
