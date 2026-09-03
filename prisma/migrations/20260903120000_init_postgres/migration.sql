-- CreateTable
CREATE TABLE "Collection" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "mintAt" TIMESTAMP(3),
    "timeTba" BOOLEAN NOT NULL DEFAULT false,
    "supply" INTEGER,
    "priceType" TEXT NOT NULL,
    "priceValue" DOUBLE PRECISION,
    "priceCurrency" TEXT,
    "website" TEXT,
    "twitter" TEXT,
    "discord" TEXT,
    "telegram" TEXT,
    "opensea" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Upcoming',
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "pinnedPosition" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" SERIAL NOT NULL,
    "handle" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "note" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Love" (
    "id" SERIAL NOT NULL,
    "collectionId" INTEGER NOT NULL,
    "visitorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Love_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "XAvatar" (
    "handle" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "path" TEXT,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XAvatar_pkey" PRIMARY KEY ("handle")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "bytes" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visitor" (
    "id" TEXT NOT NULL,
    "firstSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Visitor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Collection_status_mintAt_idx" ON "Collection"("status", "mintAt");

-- CreateIndex
CREATE INDEX "Collection_category_idx" ON "Collection"("category");

-- CreateIndex
CREATE INDEX "Submission_status_submittedAt_idx" ON "Submission"("status", "submittedAt");

-- CreateIndex
CREATE INDEX "Love_collectionId_idx" ON "Love"("collectionId");

-- CreateIndex
CREATE UNIQUE INDEX "Love_collectionId_visitorId_key" ON "Love"("collectionId", "visitorId");

-- CreateIndex
CREATE INDEX "Visitor_lastSeen_idx" ON "Visitor"("lastSeen");

-- AddForeignKey
ALTER TABLE "Love" ADD CONSTRAINT "Love_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

