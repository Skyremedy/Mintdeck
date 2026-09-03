"use client"

import { useState, useTransition } from "react"
import { submitHandle } from "../../lib/actions"

export default function SubmissionBox() {
  const [handle, setHandle] = useState("")
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setNote(null)
    startTransition(async () => {
      const res = await submitHandle(handle)
      if (res.ok) {
        setHandle("")
        setNote({ ok: true, text: res.message })
      } else {
        setNote({ ok: false, text: res.error })
      }
    })
  }

  return (
    <section className="submit-card">
      <div className="submit-card__copy">
        <h2>Missing any upcoming mint?</h2>
        <p>Send us the collection&apos;s X handle and we&apos;ll review it.</p>
      </div>

      <form className="submit-form" onSubmit={onSubmit}>
        <label className="sr-only" htmlFor="handle">
          Collection X handle
        </label>
        <input
          id="handle"
          className="field"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder="@collection"
          autoComplete="off"
          maxLength={64}
          disabled={pending}
        />
        <button type="submit" className="btn btn--accent" disabled={pending || !handle.trim()}>
          {pending ? "Sending…" : "Submit"}
        </button>

        {note && (
          <p className={`form-note ${note.ok ? "form-note--ok" : "form-note--err"}`} role="status">
            {note.text}
          </p>
        )}
      </form>
    </section>
  )
}
