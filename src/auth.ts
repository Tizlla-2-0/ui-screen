const AUTH_KEY = "ui-screen:auth";
const AUTH_BASIC_KEY = "ui-screen:basic";

const VALID_USER_ID = "prateek@69";
const VALID_PASSWORD = "tizlla@69";

export function isAuthenticated(): boolean {
  return localStorage.getItem(AUTH_KEY) === "1";
}

export function getAuthHeader(): string | null {
  return localStorage.getItem(AUTH_BASIC_KEY);
}

export function login(userId: string, password: string): boolean {
  if (userId === VALID_USER_ID && password === VALID_PASSWORD) {
    localStorage.setItem(AUTH_KEY, "1");
    localStorage.setItem(AUTH_BASIC_KEY, `Basic ${btoa(`${userId}:${password}`)}`);
    return true;
  }
  return false;
}

export function logout(): void {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(AUTH_BASIC_KEY);
}
