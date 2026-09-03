import Link from "next/link"
import { createCollection } from "../../../../../lib/admin-actions"
import CollectionForm from "../../../../components/admin/CollectionForm"

export const dynamic = "force-dynamic"

export default async function NewCollection({
  searchParams,
}: {
  searchParams: Promise<{ submission?: string; handle?: string }>
}) {
  const params = await searchParams
  const submissionId = Number(params.submission)
  const fromQueue = Number.isFinite(submissionId) && submissionId > 0

  return (
    <div className="stack" style={{ paddingTop: 32, maxWidth: 820 }}>
      <div>
        <Link href="/admin/collections" className="hint">
          ← Collections
        </Link>
        <h1 className="page-title" style={{ marginTop: 8 }}>
          Add collection
        </h1>
        {fromQueue && params.handle && (
          <p className="page-sub">
            Publishing <strong>{params.handle}</strong> from the pending queue — saving here marks
            the submission approved.
          </p>
        )}
      </div>

      <CollectionForm
        action={createCollection}
        submissionId={fromQueue ? submissionId : undefined}
        submitLabel="Publish collection"
      />
    </div>
  )
}
