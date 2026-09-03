import { getUpcoming } from "../lib/queries"
import HomeClient from "./components/HomeClient"
import SiteHeader from "./components/SiteHeader"
import SiteFooter from "./components/SiteFooter"
import VisitorPing from "./components/VisitorPing"

// Click counts and the upcoming/past split both move on their own, so the grid
// is re-rendered on request rather than served from a long-lived cache entry.
export const dynamic = "force-dynamic"

export default async function Home() {
  const collections = await getUpcoming()

  return (
    <>
      <VisitorPing />
      <SiteHeader />
      <main className="shell">
        <HomeClient collections={collections} />
      </main>
      <SiteFooter />
    </>
  )
}
