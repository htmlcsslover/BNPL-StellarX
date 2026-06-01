# StellarBNPL - Decentralized Buy Now, Pay Later on Stellar

StellarBNPL is a decentralized Buy Now, Pay Later platform that allows users in the Philippines to access short-term XLM credit from community-funded liquidity pools. Instead of relying on traditional credit scores, users build an on-chain repayment reputation through successful installment payments. Users can purchase products immediately and repay through scheduled installments managed by Soroban smart contracts.

## Core User Roles
- Member: A unified role that can buy, sell, and sponsor liquidity simultaneously.
- Borrower/Buyer: Uses credit offers to purchase products and repays in installments.
- Liquidity Provider (LP) / Sponsor: Deposits XLM into lending pools and earns yield.
- Merchant/Seller: Lists products and receives instant payment from the liquidity pool.

## MVP Architecture

Frontend: Next.js 15, TypeScript, Tailwind CSS
Backend: Node.js, Express (Off-chain indexer, API)
Blockchain: Stellar SDK, Soroban SDK, Freighter Wallet (Testnet)
Database: SQLite

## API Routes (Express API)

- GET /api/products - List available products.
- POST /api/users/register - Register a new member.
- POST /api/users/auth - Authenticate via wallet address.
- GET /api/loans/:wallet - Get user's loans.
- POST /api/loans - Initiate a BNPL loan.
- POST /api/loans/repay - Repay an installment.
- POST /api/pool/deposit - Provide liquidity to the pool.
- GET /api/health - Health check endpoint.

## Hackathon Extras
- Trust Passport: A shareable dynamic profile showing borrower tier, total repaid, and success rate.
- Unified Identity: One wallet address can manage buying, selling, and sponsoring in one dashboard.
- Testnet Faucet: Instantly fund your wallet with testnet XLM for gas and transactions.
