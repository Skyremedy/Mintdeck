# Build Prompt: Mint Deck

Build a web application called **"Mint Deck"** — an NFT mint discovery platform where users find upcoming NFT collections across chains and platforms, presented like a prediction-market style tile grid (think Polymarket-style cards, not a typical NFT marketplace layout).

Keep the interface **very simple and clean** — minimal colors, generous white space, no clutter. Prioritize readability and fast scanning over decoration. This is a directory/discovery tool, not a trading platform, so the UI should feel light and fast, not busy.

---

## 1. Public Homepage

### Category Navigation
Horizontal tabs/filters at the top of the page:
`Trending | Ethereum | Robinhood | Solana | Arc | Base | Hyperliquid`

Clicking a category filters the tile grid below to show only collections in that category. "Trending" is the default/first view.

### Tile Grid
Collections display as a responsive grid of cards. Each card ("tile") contains, top to bottom:
1. **Collection logo** — top-left corner of the tile
2. **Collection name** — next to or below the logo
3. **Mint Date** and **Mint Time**
4. **Mint Price** — displays one of three states: `Free`, `TBA`, or a specific price value (e.g. "0.08 ETH")
5. **Four social icons** at the bottom of the tile: X (Twitter), Discord, Telegram, OpenSea — each links out to that collection's respective profile/page

Clicking anywhere on a tile (outside the social icons) should register a "click" for trending-ranking purposes.

### Only Upcoming Mints Shown
The homepage only displays collections that are:
- Scheduled with a confirmed date/time, OR
- Marked as `TBA` (still counts as "upcoming" with no confirmed date)

Once a mint's date/time has passed, the system automatically moves it out of the homepage grid and into a separate **Past Mints** page (see section 4). This transition should happen automatically based on date comparison — no manual admin action required.

### Trending Logic
- Tiles in the "Trending" tab rank by **click count**, most-clicked first, automatically updating
- Admin can **pin** any collection to a fixed position in Trending (e.g. lock a collection to position #1 or #3)
- Pinned collections stay fixed; all remaining slots auto-fill with the next-highest-clicked collections, in order, working around the pinned positions

### Submission Box (Bottom of Homepage)
A simple input field where any visitor can submit a **collection handle** (e.g. an X/Twitter handle) requesting that collection be added to Mint Deck.
- This does NOT publish anything live
- Submissions go into a **Pending Queue** inside the admin dashboard for manual review
- Simple confirmation message after submission (e.g. "Thanks — we'll review this soon")

---

## 2. Past Mints Page

A separate page/section listing collections whose mint date has already passed. This is a lighter-weight display than the main tile grid — build it as a simple list/table:
- Logo, Collection name, Category, Mint date, Price it minted at
- No admin editing needed here; entries land here automatically and stay archived

---

## 3. Admin Dashboard (Password-Protected)

A separate, authenticated section only accessible to the site owner (login required — simple username/password auth is sufficient for V1).

### 3a. Overview / Analytics
- **Total Visitors** (all-time count, ideally filterable by Today / 7 Days / 30 Days / All-Time)
- **Online Now** — real-time count of currently active visitors (a visitor counts as "online" if active within the last few minutes)
- **Total Collections** — grand total added to the platform
- **Collections Per Category** — count broken down by Ethereum, Solana, Base, Arc, Hyperliquid, Robinhood (simple list or small bar chart)

### 3b. Pending Queue
- List of user-submitted collection handles awaiting review
- Shows: handle submitted, date/time submitted, status
- Admin can open a submission and convert it into a full collection entry (see 3c) or reject/dismiss it

### 3c. Manage Collections
- **Add New Collection** form with fields:
  - Collection Name
  - Logo (image upload)
  - Category / Chain (select: Ethereum, Solana, Base, Arc, Hyperliquid, Robinhood)
  - Mint Date
  - Mint Time
  - Mint Price Type: `Free` / `TBA` / `Price` (if Price selected, show numeric input)
  - Social links: X, Discord, Telegram, OpenSea (URL fields)
- **Edit Existing Collection** — pull up any currently published (Upcoming) tile and update any field
- **Delete/Unpublish** option

### 3d. Trending Control
- View current Trending tab order
- Pin a collection to a specific position, or unpin it back to auto-ranking
- See live click counts per collection

---

## 4. Data Model (per collection record)
- Name
- Logo (image)
- Category (chain)
- Mint Date
- Mint Time
- Mint Price Type: `Free` | `TBA` | `Price` (+ numeric value if applicable)
- Social links: X, Discord, Telegram, OpenSea
- Status: `Pending` → `Upcoming` (published/live) → `Past` (auto-archived after mint date)
- Click count (for trending)
- Trending state: `Not Pinned` | `Pinned (position #)`

---

## 5. V1 Scope (build this first)
- Public homepage with category tabs, tile grid, submission box
- Past Mints archive page
- Admin login
- Admin dashboard: Analytics, Pending Queue, Manage Collections (add/edit/delete), Trending Control
- Automatic status transition (Upcoming → Past based on date)
- Click-tracking for trending

**Out of scope for V1** (save for V2): user accounts, wallet connection, watchlists/favorites, notifications, per-category visitor breakdown, comments/reviews.

---

## Design Direction
- Simple, minimal, fast-loading interface
- Card-based grid layout, generous spacing, clear typography
- Neutral base palette (dark or light mode — pick one clean direction) with one accent color for interactive elements (buttons, active tab, trending badge)
- Mobile-responsive — many users will browse on phones
