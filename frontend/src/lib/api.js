import axios from "axios";

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const client = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

export const api = {
  getProfiles: () => client.get("/profiles").then((r) => r.data),
  getWorkoutPlans: (userId) => client.get(`/workout-plans?user_id=${userId}`).then((r) => r.data),
  getWorkoutPlan: (day, userId) => client.get(`/workout-plans/${day}?user_id=${userId}`).then((r) => r.data),
  createWorkoutDay: (userId, data) => client.post(`/workout-plans?user_id=${userId}`, data || {}).then((r) => r.data),
  deleteWorkoutDay: (day, userId) => client.delete(`/workout-plans/${day}?user_id=${userId}`).then((r) => r.data),
  updateExercise: (day, exId, data, userId) =>
    client.put(`/workout-plans/${day}/exercises/${exId}?user_id=${userId}`, data).then((r) => r.data),
  addExercise: (day, data, userId) =>
    client.post(`/workout-plans/${day}/exercises?user_id=${userId}`, data).then((r) => r.data),
  deleteExercise: (day, exId, userId) =>
    client.delete(`/workout-plans/${day}/exercises/${exId}?user_id=${userId}`).then((r) => r.data),
  updateExerciseLoad: (day, exId, load, userId) =>
    client.put(`/workout-plans/${day}/exercises/${exId}/load?user_id=${userId}`, { load }).then((r) => r.data),
  getExerciseLogs: (exId, userId) => client.get(`/exercise-logs/${exId}?user_id=${userId}`).then((r) => r.data),
  createExerciseLog: (data, userId) => client.post(`/exercise-logs?user_id=${userId}`, data).then((r) => r.data),
  createWorkoutSession: (data, userId) => client.post(`/workout-sessions?user_id=${userId}`, data).then((r) => r.data),
  getWorkoutSessions: (userId) => client.get(`/workout-sessions?user_id=${userId}`).then((r) => r.data),
  getWorkoutSession: (id, userId) => client.get(`/workout-sessions/${id}?user_id=${userId}`).then((r) => r.data),
  getNextWorkout: (userId) => client.get(`/next-workout?user_id=${userId}`).then((r) => r.data),
  seed: () => client.post("/seed").then((r) => r.data),
};

export const parseLoad = (load) => {
  if (!load || load === "Bodyweight") return 0;
  const match = String(load).match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
};

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });

export const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

export const formatShortDate = (iso) =>
  new Date(iso).toLocaleDateString("en-US", { day: "2-digit", month: "short" });
