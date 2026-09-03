import Link from "next/link"
import { notFound } from "next/navigation"
import { getCollection } from "../../../../../lib/queries"
import { updateCollection } from "../../../../../lib/admin-actions"
import CollectionForm from "../../../../components/admin/CollectionForm"

export const dynamic = "force-dynamic"

export default async function EditCollection({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const numericId = Number(id)
  if (!Number.isInteger(numericId)) notFound()

  const collection = await getCollection(numericId)
  if (!collection) notFound()

  return (
    <div className="stack" style={{ paddingTop: 32, maxWidth: 820 }}>
      <div>
        <Link href="/admin/collections" className="hint">
          ← Collections
        </Link>
        <h1 className="page-title" style={{ marginTop: 8 }}>
          {collection.name}
        </h1>
        <p className="page-sub">
          {collection.clickCount.toLocaleString()} tile clicks ·{" "}
          {collection.pinnedPosition != null
            ? `pinned to #${collection.pinnedPosition}`
            : "automatic trending rank"}
        </p>
      </div>

      <CollectionForm action={updateCollection} collection={collection} submitLabel="Save changes" />
    </div>
  )
}
