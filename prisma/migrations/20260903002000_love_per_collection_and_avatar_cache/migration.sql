-- Remembers every X avatar ever fetched (including misses), so a handle costs
-- at most one upstream request for the life of the app.
CREATE TABLE "XAvatar" (
    "handle" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL,
    "path" TEXT,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Love moves from one row per browser (a single site-wide counter) to one row
-- per (collection, browser). The old rows counted something that no longer
-- exists — a love for the site rather than for a mint — so they are dropped
-- rather than migrated onto an arbitrary collection.
PRAGMA foreign_keys=OFF;
DROP TABLE "Love";
CREATE TABLE "Love" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "collectionId" INTEGER NOT NULL,
    "visitorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Love_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "Love_collectionId_idx" ON "Love"("collectionId");
CREATE UNIQUE INDEX "Love_collectionId_visitorId_key" ON "Love"("collectionId", "visitorId");
PRAGMA foreign_keys=ON;
