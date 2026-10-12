import { useSyncExternalStore } from "react";

// The signed-in session ({ token, user }) lives in localStorage so it
// survives reloads. Components subscribe through useSession().
const KEY = "rq-session";
const listeners = new Set();

function read() {
  try {
    const session = JSON.parse(localStorage.getItem(KEY));
    return session?.token && session?.user ? session : null;
  } catch {
    return null;
  }
}

let current = read();

export function getSession() {
  return current;
}

export function setSession(session) {
  current = session;
  try {
    if (session) localStorage.setItem(KEY, JSON.stringify(session));
    else localStorage.removeItem(KEY);
  } catch {
    // Storage unavailable: keep the in-memory session for this tab.
  }
  listeners.forEach((listener) => listener());
}

export function clearSession() {
  setSession(null);
}

function subscribe(listener) {
  listeners.add(listener);
  const onStorage = (event) => {
    if (event.key !== KEY) return;
    current = read();
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useSession() {
  return useSyncExternalStore(subscribe, getSession, getSession);
}

export function homePathFor(user) {
  if (user?.role === "doctor") return "/doctor";
  if (user?.role === "admin") return "/admin";
  return "/patient";
}
