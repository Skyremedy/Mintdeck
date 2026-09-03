-- Mint Deck narrows from a multi-chain directory to Arc only, so `category`
-- stops meaning "which chain" and starts meaning "what kind of collection".
--
-- Existing rows carry chain names (Ethereum, Solana, Base, Arc, Hyperliquid,
-- Robinhood), none of which are valid categories any more. There is no
-- information in a chain name that maps to a content category, so rather than
-- invent one, everything that is not already a new-style category is filed
-- under 'Art' for an admin to re-categorise.
UPDATE "Collection"
SET "category" = CASE
    WHEN "category" IN ('GameFi', 'PFP', 'Art') THEN "category"
    ELSE 'Art'
END;
