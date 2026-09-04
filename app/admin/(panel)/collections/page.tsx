import Link from "next/link"
import { getAllCollections } from "../../../../lib/queries"
import { formatMintDate, formatMintTime, formatPrice, formatSupply } from "../../../../lib/format"
import { deleteCollection } from "../../../../lib/admin-actions"
import Logo from "../../../components/Logo"
import { PinIcon } from "../../../components/icons"

export const dynamic = "force-dynamic"

export default async function ManageCollections() {
  const collections = await getAllCollections()

  return (
    <div className="stack" style={{ paddingTop: 32 }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 className="page-title">Collections</h1>
          <p className="page-sub">
            Add, edit, archive or delete any collection. Upcoming mints archive themselves once
            their window closes.
          </p>
        </div>
        <Link href="/admin/collections/new" className="btn btn--accent">
          Add collection
        </Link>
      </div>

      <section className="panel">
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Collection</th>
                <th>Chain</th>
                <th>Category</th>
                <th>Mint</th>
                <th>Supply</th>
                <th>Price</th>
                <th>Status</th>
                <th style={{ width: 70 }}>Clicks</th>
                <th style={{ width: 70 }}>Loves</th>
                <th style={{ width: 150 }} />
              </tr>
            </thead>
            <tbody>
              {collections.length === 0 ? (
                <tr>
                  <td className="table__empty" colSpan={10}>
                    No collections yet. <Link href="/admin/collections/new">Add the first one →</Link>
                  </td>
                </tr>
              ) : (
                collections.map((c) => (
                  <tr key={c.id}>
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
                    <td className="table__muted">{c.chain}</td>
                    <td className="table__muted">{c.category}</td>
                    <td className="table__muted num">
                      {formatMintDate(c.mintAt)}
                      {c.mintAt && <> · {formatMintTime(c.mintAt, c.timeTba)}</>}
                    </td>
                    <td className="table__muted num">{formatSupply(c.supply)}</td>
                    <td className="num">{formatPrice(c)}</td>
                    <td>
                      <span className={`badge ${c.status === "Upcoming" ? "badge--live" : ""}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="num">{c.clickCount}</td>
                    <td className="num">{c.loveCount}</td>
                    <td>
                      <div className="table__actions">
                        <Link className="btn btn--ghost btn--sm" href={`/admin/collections/${c.id}`}>
                          Edit
                        </Link>
                        <form action={deleteCollection}>
                          <input type="hidden" name="id" value={c.id} />
                          <button className="btn btn--danger btn--sm" type="submit">
                            Delete
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
    </div>
  )
}
