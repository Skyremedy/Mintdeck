import Link from "next/link"
import AdminNav from "../../components/admin/AdminNav"
import ThemeToggle from "../../components/ThemeToggle"
import { logout } from "../../../lib/admin-actions"

export const metadata = { title: "Mint Deck admin" }

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="topbar">
        <div className="shell topbar__inner">
          <Link href="/admin" className="wordmark">
            <span className="wordmark__dot" />
            Mint Deck <span style={{ color: "var(--text-faint)", fontWeight: 500 }}>admin</span>
          </Link>
          <div className="topbar__actions">
            <AdminNav />
            <ThemeToggle />
            <Link href="/" className="btn btn--ghost btn--sm">
              View site
            </Link>
            <form action={logout}>
              <button type="submit" className="btn btn--ghost btn--sm">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="shell" style={{ paddingBottom: 64 }}>
        {children}
      </main>
    </>
  )
}
