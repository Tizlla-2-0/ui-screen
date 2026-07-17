import { useState, type FormEvent } from "react";
import { login } from "../auth";

type Props = {
  onSuccess: () => void;
};

export function Login({ onSuccess }: Props) {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const ok = login(userId.trim(), password);
    if (!ok) {
      setError("Invalid user ID or password");
      return;
    }
    setError(null);
    onSuccess();
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-brand">
          <h1>UI Screen & Task Manager</h1>
          <p className="muted">Sign in to continue</p>
        </div>

        {error && (
          <div className="banner error" role="alert">
            {error}
          </div>
        )}

        <label className="field">
          <span>User ID</span>
          <input
            className="input"
            type="text"
            autoComplete="username"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Enter user ID"
            required
          />
        </label>

        <label className="field">
          <span>Password</span>
          <input
            className="input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            required
          />
        </label>

        <button type="submit" className="btn btn-primary login-submit">
          Sign in
        </button>
      </form>
    </div>
  );
}
