-- CreateTable
CREATE TABLE "Collection" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "logo" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "mintAt" DATETIME,
    "timeTba" BOOLEAN NOT NULL DEFAULT false,
    "supply" INTEGER,
    "priceType" TEXT NOT NULL,
    "priceValue" REAL,
    "priceCurrency" TEXT,
    "twitter" TEXT,
    "discord" TEXT,
    "telegram" TEXT,
    "opensea" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Upcoming',
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "pinnedPosition" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "handle" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "note" TEXT,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" DATETIME
);

-- CreateTable
CREATE TABLE "Visitor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstSeen" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Collection_status_mintAt_idx" ON "Collection"("status", "mintAt");

-- CreateIndex
CREATE INDEX "Collection_category_idx" ON "Collection"("category");

-- CreateIndex
CREATE INDEX "Submission_status_submittedAt_idx" ON "Submission"("status", "submittedAt");

-- CreateIndex
CREATE INDEX "Visitor_lastSeen_idx" ON "Visitor"("lastSeen");

