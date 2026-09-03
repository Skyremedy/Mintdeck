import Link from "next/link"
import { getAdminStats, getSubmissions, getUpcoming } from "../../../lib/queries"
import { formatMintDate, orderTrending } from "../../../lib/format"
import { deleteSubmission, rejectSubmission, resetClicks, setPinnedPosition } from "../../../lib/admin-actions"
import Logo from "../../components/Logo"
import VisitorStats from "../../components/admin/VisitorStats"
import { PinIcon } from "../../components/icons"


export const dynamic = "force-dynamic"

export default async function AdminOverview() {
  const [stats, submissions, upcoming] = await Promise.all([
    getAdminStats(),
    getSubmissions(),
    getUpcoming(),
  ])

  const pending = submissions.filter((s) => s.status === "Pending")
  const trending = orderTrending(upcoming)
  const maxCategory = Math.max(1, ...stats.perCategory.map((c) => c.count))

  return (
    <div className="stack" style={{ paddingTop: 32 }}>
      <div>
        <h1 className="page-title">Overview</h1>
        <p className="page-sub">Traffic, the review queue, and what the Trending tab looks like right now.</p>
      </div>

      <section className="stat-grid">
        <VisitorStats visitors={stats.visitors} />

        <div className="stat-card">
          <div className="stat-card__label">Online now</div>
          <div className="stat-card__value" style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span className="dot dot--pulse" />
            {stats.onlineNow.toLocaleString()}
          </div>
          <div className="stat-card__hint">Active in the last 5 minutes</div>
        </div>

        <div className="stat-card">
          <div className="stat-card__label">Collections</div>
          <div className="stat-card__value">{stats.totalCollections.toLocaleString()}</div>
          <div className="stat-card__hint">
            {stats.upcoming} upcoming · {stats.past} archived
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__label">Tile clicks</div>
          <div className="stat-card__value">{stats.totalClicks.toLocaleString()}</div>
          <div className="stat-card__hint">All-time, drives trending order</div>
        </div>

        <div className="stat-card">
          <div className="stat-card__label">Loves</div>
          <div className="stat-card__value">{stats.loves.toLocaleString()}</div>
          <div className="stat-card__hint">People who loved the project</div>
        </div>
      </section>

      <div className="admin-cols">
        <section className="panel">
          <div className="panel__head">
            <h2 className="section-title">Collections per category</h2>
            <span className="badge">{stats.totalCollections} total</span>
          </div>
          <div className="panel__body">
            {stats.perCategory.map((c) => (
              <div className="bar-row" key={c.category}>
                <span className="table__muted">{c.category}</span>
                <span className="bar-track">
                  <span className="bar-fill" style={{ width: `${(c.count / maxCategory) * 100}%` }} />
                </span>
                <span className="bar-value num">{c.count}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel__head">
            <h2 className="section-title">Pending queue</h2>
            <span className="badge">{pending.length} waiting</span>
          </div>
          {pending.length === 0 ? (
            <div className="table__empty">Nothing to review right now.</div>
          ) : (
            <ul className="list">
              {pending.map((s) => (
                <li key={s.id}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <Logo src={`/api/x-avatar/${s.handle.replace(/^@/, "")}`} name={s.handle} small />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 550 }}>{s.handle}</div>
                      <div className="hint num">
                        {new Date(s.submittedAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="table__actions">
                    <Link
                      className="btn btn--ghost btn--sm"
                      href={`/admin/collections/new?submission=${s.id}&handle=${encodeURIComponent(s.handle)}`}
                    >
                      Add
                    </Link>
                    <form action={rejectSubmission}>
                      <input type="hidden" name="id" value={s.id} />
                      <button className="btn btn--danger btn--sm" type="submit">
                        Reject
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="panel">
        <div className="panel__head">
          <h2 className="section-title">Trending control</h2>
          <span className="badge">Pinned slots hold; the rest fill by clicks</span>
        </div>
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 56 }}>Slot</th>
                <th>Collection</th>
                <th>Mint</th>
                <th style={{ width: 80 }}>Clicks</th>
                <th style={{ width: 80 }}>Loves</th>
                <th style={{ width: 260 }}>Pin</th>
              </tr>
            </thead>
            <tbody>
              {trending.length === 0 ? (
                <tr>
                  <td className="table__empty" colSpan={6}>
                    No upcoming collections to rank.
                  </td>
                </tr>
              ) : (
                trending.map((c, i) => (
                  <tr key={c.id}>
                    <td className="num table__muted">#{i + 1}</td>
                    <td>
                      <span className="table__name">
                        <Logo src={c.logo} name={c.name} small />
                        {c.name}
                        {c.pinnedPosition != null && (
                          <span className="badge badge--live">
                            <PinIcon /> {c.pinnedPosition}
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="table__muted num">{formatMintDate(c.mintAt)}</td>
                    <td className="num">{c.clickCount}</td>
                    <td className="num">{c.loveCount}</td>
                    <td>
                      <div className="table__actions" style={{ justifyContent: "flex-start" }}>
                        <form action={setPinnedPosition} style={{ display: "flex", gap: 6 }}>
                          <input type="hidden" name="id" value={c.id} />
                          <input
                            className="field"
                            style={{ width: 68, height: 30 }}
                            type="number"
                            min="1"
                            name="position"
                            defaultValue={c.pinnedPosition ?? ""}
                            placeholder="—"
                            aria-label={`Pin position for ${c.name}`}
                          />
                          <button className="btn btn--ghost btn--sm" type="submit">
                            Pin
                          </button>
                        </form>
                        {c.pinnedPosition != null && (
                          <form action={setPinnedPosition}>
                            <input type="hidden" name="id" value={c.id} />
                            <input type="hidden" name="position" value="" />
                            <button className="btn btn--ghost btn--sm" type="submit">
                              Unpin
                            </button>
                          </form>
                        )}
                        <form action={resetClicks}>
                          <input type="hidden" name="id" value={c.id} />
                          <button className="btn btn--ghost btn--sm" type="submit">
                            Reset
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {submissions.some((s) => s.status !== "Pending") && (
        <section className="panel">
          <div className="panel__head">
            <h2 className="section-title">Reviewed submissions</h2>
          </div>
          <ul className="list">
            {submissions
              .filter((s) => s.status !== "Pending")
              .slice(0, 12)
              .map((s) => (
                <li key={s.id}>
                  <span>
                    {s.handle}{" "}
                    <span className={`badge ${s.status === "Approved" ? "badge--live" : "badge--danger"}`}>
                      {s.status}
                    </span>
                  </span>
                  <form action={deleteSubmission}>
                    <input type="hidden" name="id" value={s.id} />
                    <button className="btn btn--ghost btn--sm" type="submit">
                      Remove
                    </button>
                  </form>
                </li>
              ))}
          </ul>
        </section>
      )}
    </div>
  )
}
