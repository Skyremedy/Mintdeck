-- AlterTable
ALTER TABLE "Collection" ADD COLUMN     "chain" TEXT NOT NULL DEFAULT 'Arc';

-- CreateIndex
CREATE INDEX "Collection_chain_idx" ON "Collection"("chain");

