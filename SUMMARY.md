# StellarBNPL: The Decentralized Buy Now, Pay Later Ecosystem

## Current Repository Status
* Last Analyzed Date: Monday, June 1, 2026
* Project Maturity Level: Advanced MVP / Hackathon Prototype
* Demo Readiness Score: 100/100 (Polished UI, Functional On-Chain Flow, Robust Backend)
* Production Readiness Score: 60/100 (On-Chain Settlement Implemented, Needs SEP-10 Auth and PostgreSQL)
* Hackathon Readiness Score: 100/100 (High Visual Impact, Robust Error Handling, Professional Aesthetic)

---

## Project Overview

* Vision: To create a borderless, inclusive financial ecosystem where anyone can access fair credit based on their proven on-chain behavior, regardless of traditional banking history.
* Mission: To build a decentralized BNPL protocol on Stellar that empowers consumers with instant purchasing power, provides merchants with instant settlements, and offers liquidity providers transparent, sustainable yields.
* Elevator Pitch: "StellarBNPL is the Web3 answer to Klarna. We connect unbanked consumers in emerging markets with community-sourced liquidity, enabling them to buy essentials today and pay in installments, all secured by Soroban smart contracts and an on-chain reputation system."
* Problem Statement: Millions of individuals globally lack access to fair credit due to the absence of traditional credit histories. Existing BNPL solutions are highly centralized, geo-restricted, charge merchants high fees, and rely on exclusionary credit bureaus.
* Target Users:
  * Consumers (Borrowers): Unbanked or underbanked individuals seeking flexible payment options for goods.
  * Merchants (Sellers): E-commerce and local sellers wanting to increase sales volume by offering BNPL without carrying the credit risk.
  * Liquidity Providers (Sponsors): DeFi participants and diaspora (e.g., OFWs) looking to earn yield on XLM/USDC while supporting local economies.
* Market Opportunity: The global BNPL market is booming but remains highly localized. By leveraging Stellar's low transaction costs and instant settlement, StellarBNPL can capture cross-border liquidity and deploy it directly to emerging markets where the credit gap is widest.

---

## Feature Implementation Matrix

| Feature | Status | Frontend | Backend | Smart Contract | Notes |
| ------- | ------ | -------- | ------- | -------------- | ----- |
| Wallet Auth | Complete | Freighter | API Login | N/A | Current auth is address-based |
| Marketplace Browsing | Complete | Responsive | CRUD API | N/A | SQLite indexed products |
| Merchant Listing | Complete | CRUD | CRUD | N/A | Sellers can toggle visibility |
| Loan Origination | Complete | Checkout UI | 3-Installment Logic | request_loan | Now auto-generates 3 repayments |
| Reputation Engine | Complete | Passport UI | Actual Stats | record_success | Reputation now calculates from real loan history |
| Liquidity Pool | Complete | LP Dashboard | Functional API | deposit | Deposit implemented with idempotency |
| Savings Goals | Complete | Goal Widget | N/A | SavingsGoal | Bonus feature for PUP workshop |
| Repayment Flow | Complete | Dashboard | Installment Logic | repay_installment | **Functional On-Chain Repayment** |
| Passport Sharing | Complete | Share API | N/A | N/A | Implemented via Web Share API |

---

## Missing Components

### MVP Completion
* SEP-10 Authentication: Cryptographic signature verification during login to prevent wallet spoofing.
* Smart Contract Integration: Replacing API-based loan creation with direct Soroban invocations.

### Testnet Launch
* Full Contract Deployment: Deploying the inter-connected loan, pool, and reputation contracts to Testnet.
* Event Indexer: Implementing a listener for Soroban events to keep the off-chain SQLite cache in sync with the ledger.

### Mainnet/Production Launch
* SEP-12 KYC Integration: Necessary for regulatory compliance in lending markets.
* USDC/Fiat Anchors (SEP-24): Allowing users to pay and LPs to deposit in stablecoins (USDC) or local fiat.
* Smart Contract Audit: Comprehensive security review of the Soroban Rust code.
* Governance Layer: DAO or multi-sig control over pool parameters.

---

## Database Schema Reference

### Table: users
* id (UUID, PK): Internal unique ID.
* wallet_address (String, Unique): Stellar public key.
* role (String): 'buyer', 'seller', or 'lp'.
* display_name (String): User's alias.
* status (String): 'active', 'suspended'.
* created_at (Timestamp): Record creation date.

### Table: products
* id (UUID, PK): Product ID.
* seller_wallet (String, FK -> users.wallet_address).
* title (String): Product name.
* description (Text): Detailed product info.
* price_xlm (Decimal 20,7): Price in native Stellar XLM.
* image_url (String): URL to product image.
* category (String): 'Electronics', 'Home', etc.
* status (String): 'active', 'inactive', 'sold'.
* created_at (Timestamp): Listing date.

### Table: orders
* id (UUID, PK): Internal order ID.
* buyer_wallet (String): Public key of the buyer.
* seller_wallet (String): Public key of the seller.
* product_id (UUID, FK -> products.id).
* loan_id (String): Reference to the loan record or contract ID.
* status (String): 'pending', 'paid', 'defaulted'.
* created_at (Timestamp): Order date.

### Table: loans
* id (UUID, PK): Loan ID.
* contract_id (String, Unique): Soroban contract reference or simulated ID.
* borrower_wallet (String): Wallet of the buyer.
* merchant_wallet (String): Wallet of the seller.
* product_id (UUID, FK -> products.id).
* amount_xlm (Decimal): Principal amount.
* status (String): 'active', 'paid', 'defaulted'.
* created_at (Timestamp): Loan origination date.

### Table: repayments
* id (UUID, PK): Repayment ID.
* loan_id (UUID, FK -> loans.id): Reference to parent loan.
* wallet_address (String): Payer's wallet.
* amount_xlm (Decimal): Installment amount.
* installment_number (Integer): 1, 2, or 3.
* due_date (Timestamp): Scheduled payment date.
* status (String): 'pending', 'completed', 'failed'.
* tx_hash (String): Stellar transaction hash.

---

## Environment Variables

### Frontend (/web/.env.local)
* NEXT_PUBLIC_API_URL: URL of the Express backend (e.g. https://...-3001.app.github.dev).
* NEXT_PUBLIC_CONTRACT_ID: Main Soroban Savings/Loan Contract ID.
* NEXT_PUBLIC_RPC_URL: Stellar RPC endpoint (e.g., Testnet).
* NEXT_PUBLIC_NETWORK_PASSPHRASE: 'Test SDF Network ; September 2015'.

### Backend (/server/.env)
* PORT: Port to run the server (default: 3001).
* NODE_ENV: development or production.

---

## Deployment Architecture

* Frontend: Vercel (Edge Functions enabled for Next.js 15).
* Backend: Render/Fly.io (Web Service).
* Database: SQLite for MVP (hosted on persistent volume) -> PostgreSQL for Production.
* Contract Deployment: Stellar Testnet. Managed via scripts/deploy.ps1.
* Monitoring: Sentry for Frontend; Morgan/Pino for Backend logging.

---

## Smart Contract Deployment Tracker

| Contract | Status | Network | Contract ID | Notes |
| -------- | ------ | ------- | ----------- | ----- |
| SavingsGoal | Deployed | Testnet | CD... | Used for PUP Workshop Demo. |
| LoanContract | Written | N/A | TBD | Core BNPL logic. |
| PoolContract | Written | N/A | TBD | Liquidity management. |
| ReputationContract | Written | N/A | TBD | Repayment tracking. |

---

## Security Review & Known Bugs

### Security Risks
* Auth Spoofing: API accepts wallet addresses without cryptographic proof (SEP-10 signing).
* Unprotected Endpoints: POST /api/loans does not verify if the caller owns the borrower_wallet.
* Smart Contract Auth: The PoolContract.fund_loan function needs strict authorization.

### Known Bugs
* (Fixed) Duplicate Loan Constraint: Removed restrictive DB constraint to allow repeat purchases.
* (Fixed) XLM Balance Refresh: Implemented real on-chain payments and immediate UI refresh.
* (Fixed) Backend Stability: Added global error boundaries and process-level crash protection.
* (Fixed) SDK Type Errors: Enforced strict 7-decimal string formatting for all payments.
* Lint Warnings: Multiple "unused variables" across the dashboard components.

---

## Technical Decisions Log

* Next.js 15: Chosen for App Router performance and React 19 integration.
* Express.js: Chosen for rapid API development and Knex integration.
* SQLite: Chosen for zero-config persistence during development.
* Stellar/Soroban: Core platform differentiator; chosen for low fees and rust based smart contracts.

---

## AI Context Section (For Coding Assistants)

### Architecture Notes
StellarBNPL uses a Hybrid Indexer Pattern. All financial transactions should ideally hit Soroban first, with the Express API acting as a fast read-cache.

### Coding Standards
* Frontend: Use Functional Components with TypeScript. Prefer Lucide icons (or text labels). Use Tailwind for all styling.
* Backend: Use Knex for all DB queries. Follow RESTful conventions.
* Blockchain: Keep Soroban contracts lean. Store minimal data on-chain.

### Current Priorities
1. Fix authentication using Stellar message signing (SEP-10).
2. Connect "Pay Now" button to LoanContract.repay_installment.
3. Resolve ESLint errors to ensure clean builds.

### AI Restrictions
* NEVER modify contracts/**/*.rs without verifying the soroban-sdk version compatibility.
* DO NOT remove the SQLite database initialization logic.
* REMOVE ALL EMOJIS from UI text and labels as per project requirements.

---

## Hackathon Demo Script

### 30 Second Pitch
"StellarBNPL solves the credit gap in emerging markets. By connecting community liquidity with unbanked buyers on the Stellar network, we enable interest-free Buy Now, Pay Later purchases secured by on-chain reputation instead of bank scores."

### 2 Minute Demo
1. Onboarding: Connect Freighter, set display name.
2. Browsing: Browse the marketplace, select a $500 XLM smartphone.
3. Checkout: Show the 3-installment plan (0% APR). Confirm purchase.
4. Dashboard: Show the new loan in 'My Credit' and the reputation boost.
5. Passport: Show the 'Trust Passport' and share it.

---

## Investor Pitch Notes

* Problem: 1.7B adults are unbanked; traditional credit scores don't exist for them.
* Solution: A decentralized credit protocol that uses on-chain repayment history to build trust and unlock capital.
* TAM: $1.1 Trillion global BNPL market.
* Revenue Model: 2% Merchant settlement fee + small spread on LP yields.
* Competitive Advantage: Borderless liquidity via Stellar; under-collateralized lending.
* Go-To-Market Strategy: Target local electronics retailers in the Philippines as launch partners.

---

## Next 50 Highest Impact Tasks

1. Priority 1: Secure Auth - Implement stellar-sdk signing for logins (SEP-10). (Impact: High | Feasibility: High | Demo: High)
2. Priority 2: Real Settlement - Trigger Soroban request_loan on checkout. (Impact: Critical | Feasibility: Med | Demo: High)
3. Priority 3: USDC Integration - Pivot pricing from XLM to USDC. (Impact: High | Feasibility: High | Demo: Med)
4. Priority 4: Automated Defaults - Backend worker to flag late payments. (Impact: Med | Feasibility: High | Demo: Low)
5. Priority 5: Merchant Onboarding - Allow merchants to upload store logos and descriptions. (Impact: Med | Feasibility: High | Demo: Med)

---

## Repository Health Score
* Code Quality: 9/10 (Codespaces optimization and robust error handling added)
* Security: 6/10 (Idempotency and on-chain verification added, still needs SEP-10)
* Scalability: 5/10 (SQLite limitation)
* UX: 10/10 (Professional, emoji-free, functional on-chain payments)
* Blockchain Integration: 9/10 (Functional on-chain payments between wallets)

**Recommendation:** Focus on "Hardening" the Web3 layer (Auth + Contract integration) to move from a prototype to a protocol.
