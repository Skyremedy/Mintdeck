import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

/**
 * `chain` is which blockchain a collection mints on; `category` is what kind of
 * collection it is. They are independent.
 *
 * Dates are relative so a freshly seeded database always has live upcoming
 * mints. Rows are created in array order, so the last entries are the newest
 * listings and lead the "Just In" tab.
 */
function inDays(days: number, hour = 16, minute = 0): Date {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + days)
  d.setUTCHours(hour, minute, 0, 0)
  return d
}

const collections = [
  {
    name: "Arc Nodes",
    chain: "Arc",
    website: "https://arcnodes.xyz",
    supply: 5000,
    logo: "https://picsum.photos/seed/hlnodes/200",
    category: "GameFi",
    mintAt: inDays(2, 15),
    priceType: "Price",
    priceValue: 25,
    priceCurrency: "USDC",
    twitter: "https://x.com/arcnodes",
    discord: "https://discord.gg/arcnodes",
    opensea: "https://opensea.io/collection/arc-nodes",
    clickCount: 412,
    pinnedPosition: 1,
  },
  {
    name: "Arc Foundry",
    chain: "Arc",
    website: "https://arcfoundry.xyz",
    supply: 10000,
    logo: "https://picsum.photos/seed/arcfoundry/200",
    category: "GameFi",
    mintAt: inDays(4, 18, 30),
    priceType: "Free",
    twitter: "https://x.com/arcfoundry",
    telegram: "https://t.me/arcfoundry",
    clickCount: 388,
  },
  {
    name: "Bloomfield",
    chain: "Base",
    website: "https://bloomfield.art",
    supply: 3333,
    logo: "https://picsum.photos/seed/basebloom/200",
    category: "Art",
    mintAt: inDays(1, 14),
    priceType: "Price",
    priceValue: 12,
    priceCurrency: "USDC",
    twitter: "https://x.com/bloomfield",
    discord: "https://discord.gg/bloomfield",
    telegram: "https://t.me/bloomfield",
    opensea: "https://opensea.io/collection/bloomfield",
    clickCount: 356,
  },
  {
    name: "Sunbird Syndicate",
    chain: "Solana",
    website: "https://sunbirdsyndicate.xyz",
    supply: 8888,
    logo: "https://picsum.photos/seed/sunbirds/200",
    category: "PFP",
    mintAt: inDays(6, 20),
    priceType: "Price",
    priceValue: 18,
    priceCurrency: "USDC",
    twitter: "https://x.com/sunbirdsyndicate",
    discord: "https://discord.gg/sunbirdsyndicate",
    clickCount: 291,
  },
  {
    name: "Ledger Cards",
    chain: "Robinhood",
    website: "https://ledgercards.xyz",
    supply: 25000,
    logo: "https://picsum.photos/seed/rhcards/200",
    category: "PFP",
    mintAt: inDays(9),
    timeTba: true,
    priceType: "Price",
    priceValue: 40,
    priceCurrency: "USDC",
    twitter: "https://x.com/ledgercards",
    clickCount: 244,
  },
  {
    name: "Ethereal Glyphs",
    chain: "Ethereum",
    website: "https://etherealglyphs.art",
    supply: 10000,
    logo: "https://picsum.photos/seed/glyphs/200",
    category: "Art",
    mintAt: inDays(3, 17),
    priceType: "Price",
    priceValue: 45,
    priceCurrency: "USDC",
    twitter: "https://x.com/etherealglyphs",
    discord: "https://discord.gg/etherealglyphs",
    telegram: "https://t.me/etherealglyphs",
    opensea: "https://opensea.io/collection/ethereal-glyphs",
    clickCount: 233,
    pinnedPosition: 3,
  },
  {
    name: "Onchain Cartographers",
    chain: "Ethereum",
    logo: "https://picsum.photos/seed/carto/200",
    category: "Art",
    mintAt: null,
    priceType: "TBA",
    twitter: "https://x.com/onchaincarto",
    discord: "https://discord.gg/onchaincarto",
    clickCount: 187,
  },
  {
    name: "Lightfield",
    chain: "Base",
    website: "https://lightfield.xyz",
    supply: 1111,
    logo: "https://picsum.photos/seed/lightfield/200",
    category: "Art",
    mintAt: inDays(12, 13),
    priceType: "Free",
    twitter: "https://x.com/lightfield",
    opensea: "https://opensea.io/collection/lightfield",
    clickCount: 141,
  },
  {
    name: "Solstice Relics",
    chain: "Solana",
    logo: "https://picsum.photos/seed/solstice/200",
    category: "PFP",
    mintAt: null,
    priceType: "Free",
    twitter: "https://x.com/solsticerelics",
    telegram: "https://t.me/solsticerelics",
    clickCount: 96,
  },
  {
    name: "Arc Terminal Pass",
    chain: "Arc",
    website: "https://arcterminal.xyz",
    supply: 2500,
    logo: "https://picsum.photos/seed/arcterm/200",
    category: "GameFi",
    mintAt: inDays(18, 12),
    priceType: "Price",
    priceValue: 120,
    priceCurrency: "USDC",
    twitter: "https://x.com/arcterminal",
    clickCount: 64,
  },
  // Already closed — lands in the archive on first read.
  {
    name: "Meridian Vaults",
    chain: "Ethereum",
    website: "https://meridianvaults.xyz",
    supply: 7777,
    logo: "https://picsum.photos/seed/meridian/200",
    category: "Art",
    mintAt: inDays(-6, 15),
    priceType: "Price",
    priceValue: 30,
    priceCurrency: "USDC",
    twitter: "https://x.com/meridianvaults",
    opensea: "https://opensea.io/collection/meridian-vaults",
    status: "Past",
    clickCount: 520,
  },
  {
    name: "Sigil Wardens",
    chain: "Hyperliquid",
    supply: 4200,
    logo: "https://picsum.photos/seed/sigils/200",
    category: "GameFi",
    mintAt: inDays(-14, 19),
    priceType: "Free",
    twitter: "https://x.com/sigilwardens",
    status: "Past",
    clickCount: 310,
  },
]

async function main() {
  await prisma.collection.deleteMany()
  await prisma.submission.deleteMany()

  for (const c of collections) {
    await prisma.collection.create({ data: c })
  }

  await prisma.submission.createMany({
    data: [
      { handle: "@fractal_forms" },
      { handle: "@nightshade_labs" },
      { handle: "@zerocity", status: "Rejected", reviewedAt: new Date() },
    ],
  })

  console.log(`Seeded ${collections.length} collections and 3 submissions.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
