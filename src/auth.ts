const AUTH_KEY = "ui-screen-task-manager:auth";

const VALID_USER_ID = "prateek@69";
const VALID_PASSWORD = "tizlla@69";

export function isAuthenticated(): boolean {
  return localStorage.getItem(AUTH_KEY) === "1";
}

export function login(userId: string, password: string): boolean {
  if (userId === VALID_USER_ID && password === VALID_PASSWORD) {
    localStorage.setItem(AUTH_KEY, "1");
    return true;
  }
  return false;
}

export function logout(): void {
  localStorage.removeItem(AUTH_KEY);
}
