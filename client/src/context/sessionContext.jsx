import { createContext, useCallback, useContext, useState } from "react";
import api from "../service/api";
import { API_ENDPOINTS } from "../utils/constants";

const SessionContext = createContext();

export const SessionProvider = ({ children }) => {
  const [currentSession, setCurrentSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createSession = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      const response = await api.post(API_ENDPOINTS.SESSION.CREATE);
      const session = response.data?.data?.session;

      setCurrentSession(session);
      return { success: true, session };
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || "Failed to create new session";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const joinSession = useCallback(async (roomId) => {
    try {
      setError(null);
      setLoading(true);

      const response = await api.post(API_ENDPOINTS.SESSION.JOIN, { roomId });
      const session = response.data?.data?.session;

      setCurrentSession(session);
      return { success: true, session };
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || "Failed to join session";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const getSession = useCallback(async (roomId) => {
    try {
      setError(null);
      setLoading(true);

      const response = await api.get(`${API_ENDPOINTS.SESSION.GET}/${roomId}`);
      const session = response.data?.data?.session;

      setCurrentSession(session);
      return { success: true, session };
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || "Failed to get session";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const leaveSession = useCallback(async (roomId) => {
    try {
      setError(null);
      setLoading(true);

      await api.post(API_ENDPOINTS.SESSION.LEAVE, { roomId });

      setCurrentSession(null);
      return { success: true };
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || "Failed to leave session";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const listSessions = useCallback(async (status = "all") => {
    try {
      setError(null);
      setLoading(true);

      const response = await api.get(API_ENDPOINTS.SESSION.LIST, {
        params: { status },
      });

      const sessions =
        response.data?.data?.sessions ||
        response.data?.data?.session ||
        [];

      return { success: true, sessions };
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || "Failed to fetch sessions";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSession = useCallback(() => {
    setCurrentSession(null);
    setError(null);
  }, []);

  const value = {
    currentSession,
    loading,
    error,
    createSession,
    joinSession,
    getSession,
    leaveSession,
    listSessions,
    clearSession,
    setError,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }

  return context;
};

export default SessionContext;