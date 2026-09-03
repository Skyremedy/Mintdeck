"use client"

import { THEME_STORAGE_KEY } from "../../lib/theme"

/**
 * Which icon is visible is decided entirely in CSS (see `.theme-toggle__sun`),
 * so the button is correct on the very first paint — before React hydrates and
 * without reading storage during render.
 */
export default function ThemeToggle() {
  const toggle = () => {
    const root = document.documentElement
    const current =
      root.dataset.theme ??
      (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark")
    const next = current === "dark" ? "light" : "dark"
    root.dataset.theme = next
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // Private mode or blocked storage — the choice just won't persist.
    }
  }

  return (
    <button type="button" className="theme-toggle" onClick={toggle} title="Switch theme">
      <span className="sr-only">Switch between light and dark theme</span>
      <svg
        className="theme-toggle__sun"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
      <svg
        className="theme-toggle__moon"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
    </button>
  )
}
