import { sendJson } from "../utils/http.mjs";
import { databaseStatus } from "../config/database.mjs";
import {
  chatCareState,
  exercises,
  formCheckSessions,
  messages,
  patientProfile,
  patients,
  progressData,
} from "../models/appStore.mjs";

export function dashboard(_request, response) {
  return sendJson(response, 200, {
    users: 1284,
    doctors: 42,
    activePatients: 986,
    pendingRefunds: 8,
    revenueIls: 38400,
    systems: [
      ["Authentication", "Operational"],
      ["Exercise plans", "Operational"],
      ["Doctor reviews", "Operational"],
      ["Refund ledger", "Operational"],
    ],
  });
}

export function databaseSnapshot(_request, response) {
  const tables = {
    progressData,
    exercises,
    patients,
    messages,
    patientProfile,
    chatCareState,
    formCheckSessions,
  };

  return sendJson(response, 200, {
    status: databaseStatus(),
    counts: {
      progressData: progressData.length,
      exercises: exercises.length,
      patients: patients.length,
      messages: messages.length,
      formCheckSessions: formCheckSessions.length,
      patientProfile: patientProfile ? 1 : 0,
      chatCareState: chatCareState ? 1 : 0,
    },
    tables,
  });
}
