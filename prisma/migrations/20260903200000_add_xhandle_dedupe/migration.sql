-- AlterTable
ALTER TABLE "Collection" ADD COLUMN     "xHandle" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Collection_xHandle_key" ON "Collection"("xHandle");

