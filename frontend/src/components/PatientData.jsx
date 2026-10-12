import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

// One fetch of the patient overview (stats, plan, rewards) shared by every
// patient page and the dashboard layout. Pages call refresh() — or
// setOverview() with a fresh overview from a mutation — after changes.
const PatientDataContext = createContext(null);

export function PatientDataProvider({ children }) {
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const next = await api.patientDashboard();
      setOverview(next);
      setError("");
      return next;
    } catch (apiError) {
      setError(apiError.message);
      return null;
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(() => ({ overview, error, refresh, setOverview }), [overview, error, refresh]);
  return <PatientDataContext.Provider value={value}>{children}</PatientDataContext.Provider>;
}

export function usePatientData() {
  return useContext(PatientDataContext) ?? { overview: null, error: "", refresh: async () => null, setOverview: () => {} };
}
