"use client"

import { useActionState } from "react"
import { login, type ActionState } from "../../../lib/admin-actions"

export default function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(login, {})

  return (
    <div className="login-wrap">
      <form className="login-card" action={formAction}>
        <div className="wordmark" style={{ marginBottom: 18 }}>
          <span className="wordmark__dot" />
          Mint Deck <span style={{ color: "var(--text-faint)", fontWeight: 500 }}>admin</span>
        </div>

        <input type="hidden" name="next" value={next} />

        <div className="stack" style={{ gap: 14 }}>
          <div className="form-row">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              className="field"
              autoComplete="username"
              defaultValue="admin"
              required
            />
          </div>

          <div className="form-row">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              className="field"
              autoComplete="current-password"
              required
            />
          </div>

          {state.error && (
            <div className="alert" role="alert">
              {state.error}
            </div>
          )}

          <button type="submit" className="btn btn--primary" disabled={pending}>
            {pending ? "Checking…" : "Sign in"}
          </button>
        </div>
      </form>
    </div>
  )
}
