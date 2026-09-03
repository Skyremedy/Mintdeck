import Link from "next/link"
import { getPast } from "../../lib/queries"
import { formatMintDate, formatMintTime, formatPrice, formatSupply } from "../../lib/format"
import Logo from "../components/Logo"
import SiteHeader from "../components/SiteHeader"
import SiteFooter from "../components/SiteFooter"
import VisitorPing from "../components/VisitorPing"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Past Arc mints — Mint Deck",
}

export default async function PastMints() {
  const collections = await getPast()

  return (
    <>
      <VisitorPing />
      <SiteHeader />
      <main className="shell">
        <div className="page-head">
          <h1 className="page-title">Past mints</h1>
          <p className="page-sub">
            Arc collections whose mint window has closed. Entries land here automatically — nothing
            is archived by hand.
          </p>
        </div>

        <div className="panel">
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Collection</th>
                  <th>Category</th>
                  <th>Minted</th>
                  <th>Supply</th>
                  <th>Price</th>
                  <th>Loves</th>
                </tr>
              </thead>
              <tbody>
                {collections.length === 0 ? (
                  <tr>
                    <td className="table__empty" colSpan={6}>
                      Nothing archived yet. <Link href="/">See what&apos;s upcoming →</Link>
                    </td>
                  </tr>
                ) : (
                  collections.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <span className="table__name">
                          <Logo src={c.logo} name={c.name} small />
                          {c.twitter ? (
                            <a href={c.twitter} target="_blank" rel="noopener noreferrer">
                              {c.name}
                            </a>
                          ) : (
                            c.name
                          )}
                        </span>
                      </td>
                      <td className="table__muted">{c.category}</td>
                      <td className="table__muted num">
                        {formatMintDate(c.mintAt)}
                        {c.mintAt && !c.timeTba && (
                          <span className="table__muted"> · {formatMintTime(c.mintAt, c.timeTba)}</span>
                        )}
                      </td>
                      <td className="table__muted num">{formatSupply(c.supply)}</td>
                      <td className="num">{formatPrice(c)}</td>
                      <td className="table__muted num">{c.loveCount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
