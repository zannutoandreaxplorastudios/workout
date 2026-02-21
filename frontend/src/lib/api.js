import axios from "axios";

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const client = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

export const api = {
  getWorkoutPlans: () => client.get("/workout-plans").then((r) => r.data),
  getWorkoutPlan: (day) => client.get(`/workout-plans/${day}`).then((r) => r.data),
  updateExerciseLoad: (day, exId, load) =>
    client.put(`/workout-plans/${day}/exercises/${exId}/load`, { load }).then((r) => r.data),
  getExerciseLogs: (exId) => client.get(`/exercise-logs/${exId}`).then((r) => r.data),
  createExerciseLog: (data) => client.post("/exercise-logs", data).then((r) => r.data),
  createWorkoutSession: (data) => client.post("/workout-sessions", data).then((r) => r.data),
  getWorkoutSessions: () => client.get("/workout-sessions").then((r) => r.data),
  getWorkoutSession: (id) => client.get(`/workout-sessions/${id}`).then((r) => r.data),
  getNextWorkout: () => client.get("/next-workout").then((r) => r.data),
  seed: () => client.post("/seed").then((r) => r.data),
  updateExercise: (day, exId, data) =>
    client.put(`/workout-plans/${day}/exercises/${exId}`, data).then((r) => r.data),
};

export const parseLoad = (load) => {
  if (!load || load === "Corpo libero") return 0;
  const match = String(load).match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
};

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });

export const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });

export const formatShortDate = (iso) =>
  new Date(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
