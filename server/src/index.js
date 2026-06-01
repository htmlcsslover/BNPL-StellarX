const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { db, initDb } = require('./db');
const { v4: uuidv4 } = require('uuid');

dotenv.config();

const app = express();

// Codespaces specific CORS handling
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://potential-space-enigma-5gq4gvq4wggq3pxww-3000.app.github.dev'
];

app.use(cors({
  origin: function(origin, callback) {
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) !== -1 || origin.includes('.app.github.dev')){
      return callback(null, true);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Idempotency-Key', 'X-Wallet-Address']
}));

app.use(express.json());

const PORT = process.env.PORT || 3001;

// In-memory cache for idempotency - persists across requests but lost on server restart
// TODO: Migrate to database for production
const idempotencyCache = new Map();

function withIdempotency(req, res, next) {
  const key = req.body.idempotency_key || req.headers['x-idempotency-key'];
  if (!key) return next();
  
  if (idempotencyCache.has(key)) {
    console.log(`Idempotency hit for key: ${key}`);
    return res.json(idempotencyCache.get(key));
  }
  
  const originalJson = res.json;
  res.json = (data) => {
    idempotencyCache.set(key, data);
    return originalJson.call(res, data);
  };
  
  next();
}

/// Authorization middleware: extracts wallet from request header or body
/// In production, this would verify a JWT token (SEP-10 signed)
/// For MVP, we accept X-Wallet-Address header for demo purposes
function extractWalletAddress(req, res, next) {
  // Production: Verify JWT Bearer token
  // MVP: Accept X-Wallet-Address header (clearly marked as demo-only)
  const walletFromHeader = req.headers['x-wallet-address'];
  const walletFromBody = req.body.wallet_address || req.body.borrower_wallet;
  
  req.authenticatedWallet = walletFromHeader || walletFromBody;
  next();
}

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, status: "running", timestamp: new Date().toISOString() });
});

// --- USER ROUTES ---

app.post('/api/users/register', extractWalletAddress, async (req, res) => {
  const { wallet_address, role, display_name } = req.body;
  if (!wallet_address) return res.status(400).json({ error: 'Wallet address required' });
  
  // Validate wallet address format (Stellar pubkey is 56 chars, starts with 'G')
  if (!/^G[A-Z2-7]{55}$/.test(wallet_address)) {
    return res.status(400).json({ error: 'Invalid Stellar wallet address format' });
  }

  try {
    const existing = await db('users').where({ wallet_address }).first();
    if (existing) return res.json(existing);

    const user = { 
      id: uuidv4(), 
      wallet_address, 
      role: role || 'buyer', 
      display_name: display_name || wallet_address.slice(0, 6),
      status: 'active'
    };
    await db('users').insert(user);
    res.json(user);
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users/auth', extractWalletAddress, async (req, res) => {
  const { wallet_address } = req.body;
  if (!wallet_address) return res.status(400).json({ error: 'Wallet address required' });

  // Validate wallet address format
  if (!/^G[A-Z2-7]{55}$/.test(wallet_address)) {
    return res.status(400).json({ error: 'Invalid Stellar wallet address format' });
  }

  try {
    let user = await db('users').where({ wallet_address }).first();
    if (!user) {
      // Auto-register if not found (for demo convenience, but log it)
      console.log(`Auto-registering user: ${wallet_address}`);
      user = { 
        id: uuidv4(), 
        wallet_address, 
        role: 'buyer', 
        display_name: wallet_address.slice(0, 6),
        status: 'active'
      };
      await db('users').insert(user);
    }
    
    // In production: Sign and return JWT token with wallet_address as subject
    // For MVP: Return user object with wallet confirmation
    res.json({ 
      ...user,
      _auth_note: 'MVP auth - in production this would return a JWT token signed via SEP-10'
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/profile/:wallet', async (req, res) => {
  try {
    const user = await db('users').where({ wallet_address: req.params.wallet }).first();
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const loans = await db('loans').where({ borrower_wallet: req.params.wallet });
    const paidLoans = loans.filter(l => l.status === 'paid');
    
    const reputation = {
      score: 450 + (paidLoans.length * 10),
      tier: 'Gold',
      success_rate: '100%',
      total_loans: loans.length,
      total_repaid: paidLoans.reduce((acc, l) => acc + (parseFloat(l.amount_xlm) || 0), 0)
    };
    
    res.json({ ...user, reputation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- PRODUCT ROUTES ---

app.get('/api/products', async (req, res) => {
  try {
    const products = await db('products')
      .join('users', 'products.seller_wallet', 'users.wallet_address')
      .where('products.status', 'active')
      .select('products.*', 'users.display_name as seller_name');
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/products/seller/:wallet', async (req, res) => {
  try {
    const products = await db('products').where({ seller_wallet: req.params.wallet });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/products', withIdempotency, async (req, res) => {
  const { seller_wallet, title, description, price_xlm, image_url, category } = req.body;
  
  if (!seller_wallet || !title || !price_xlm) {
    return res.status(400).json({ error: 'Missing required fields: seller_wallet, title, price_xlm' });
  }

  const parsedPrice = parseFloat(price_xlm);
  if (isNaN(parsedPrice)) {
    return res.status(400).json({ error: 'Invalid price_xlm' });
  }

  try {
    const product = {
      id: uuidv4(),
      seller_wallet,
      title,
      description: description || '',
      price_xlm: parsedPrice,
      image_url: image_url || '',
      category: category || 'Electronics',
      status: 'active'
    };
    await db('products').insert(product);
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- LOAN ROUTES ---

app.get('/api/loans/:wallet', async (req, res) => {
  try {
    const wallet = req.params.wallet;
    
    // Validate wallet format
    if (!/^G[A-Z2-7]{55}$/.test(wallet)) {
      return res.status(400).json({ error: 'Invalid Stellar wallet address format' });
    }
    
    const loans = await db('loans')
      .where({ borrower_wallet: wallet })
      .orWhere({ merchant_wallet: wallet });
    res.json(loans);
  } catch (error) {
    console.error('Get loans error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/loans', extractWalletAddress, withIdempotency, async (req, res) => {
  const { borrower_wallet, merchant_wallet, product_id, amount_xlm } = req.body;
  
  // Verify all required fields exist
  if (!borrower_wallet || !merchant_wallet || !product_id || amount_xlm === undefined || amount_xlm === null) {
    return res.status(400).json({ error: 'Missing borrower, merchant, product, or amount' });
  }
  
  // Parse and validate amount EARLY
  const parsedAmount = parseFloat(amount_xlm);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: 'Invalid amount_xlm - must be a positive number' });
  }
  
  // Validate wallet formats
  if (!/^G[A-Z2-7]{55}$/.test(borrower_wallet) || !/^G[A-Z2-7]{55}$/.test(merchant_wallet)) {
    return res.status(400).json({ error: 'Invalid wallet address format' });
  }
  
  // SECURITY: Verify requester owns the borrower wallet
  // MVP: Check header; Production: Verify JWT token signature
  const requestingWallet = req.headers['x-wallet-address'] || req.body.authenticated_wallet;
  if (requestingWallet && requestingWallet !== borrower_wallet) {
    return res.status(403).json({ 
      error: 'Cannot create loan for another user - wallet mismatch',
      requesting: requestingWallet,
      attempting_to_borrow_as: borrower_wallet
    });
  }

  try {
    // Verify merchant exists
    const merchant = await db('users').where({ wallet_address: merchant_wallet }).first();
    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    // Verify product exists
    const product = await db('products').where({ id: product_id }).first();
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if loan already exists (prevent duplicates)
    const existing = await db('loans')
      .where({ borrower_wallet, product_id, status: 'active' })
      .first();
    if (existing) {
      console.log(`Duplicate loan request prevented: ${borrower_wallet} for product ${product_id}`);
      return res.json(existing);
    }

    // Create loan record
    const loan = {
      id: uuidv4(),
      contract_id: `loan_${uuidv4().slice(0, 8)}`,
      borrower_wallet,
      merchant_wallet,
      product_id,
      amount_xlm: parsedAmount,
      status: 'active'
    };
    await db('loans').insert(loan);

    // Create order record
    await db('orders').insert({
      id: uuidv4(),
      buyer_wallet: borrower_wallet,
      seller_wallet: merchant_wallet,
      product_id,
      loan_id: loan.id,
      status: 'pending'
    });

    console.log(`Loan created: ${loan.id} (${borrower_wallet} → ${merchant_wallet})`);
    res.json(loan);
  } catch (error) {
    console.error('Create loan error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/loans/repay', extractWalletAddress, withIdempotency, async (req, res) => {
  const { loan_id, amount_xlm, wallet_address } = req.body;
  
  if (!loan_id || !amount_xlm) {
    return res.status(400).json({ error: 'Missing loan_id or amount_xlm' });
  }
  
  if (!wallet_address) {
    return res.status(400).json({ error: 'wallet_address required' });
  }
  
  // Validate wallet format
  if (!/^G[A-Z2-7]{55}$/.test(wallet_address)) {
    return res.status(400).json({ error: 'Invalid wallet address format' });
  }
  
  // SECURITY: Verify repayer owns the wallet
  const requestingWallet = req.headers['x-wallet-address'];
  if (requestingWallet && requestingWallet !== wallet_address) {
    return res.status(403).json({ 
      error: 'Cannot repay on behalf of another user',
      attempting_to_repay_as: wallet_address,
      authenticated_as: requestingWallet
    });
  }

  try {
    const loan = await db('loans').where({ id: loan_id }).first();
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }
    
    // SECURITY: Verify wallet matches borrower
    if (loan.borrower_wallet !== wallet_address) {
      return res.status(403).json({ 
        error: 'Wallet does not own this loan',
        loan_owner: loan.borrower_wallet,
        attempting_wallet: wallet_address
      });
    }
    
    if (loan.status === 'paid') {
      return res.json({ message: 'Repayment already processed', loan_id, status: 'paid' });
    }

    // In production: Verify actual token transfer on Soroban contract
    // MVP: Update database status
    await db('loans').where({ id: loan_id }).update({ status: 'paid' });
    await db('orders').where({ loan_id }).update({ status: 'paid' });

    console.log(`Loan repaid: ${loan_id} (${wallet_address})`);
    res.json({ message: 'Repayment successful', loan_id, status: 'paid' });
  } catch (error) {
    console.error('Repay loan error:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- POOL ROUTES ---

app.post('/api/pool/deposit', extractWalletAddress, withIdempotency, async (req, res) => {
  const { wallet_address, amount_xlm } = req.body;
  
  if (!wallet_address || !amount_xlm) {
    return res.status(400).json({ error: 'Invalid wallet address or amount' });
  }
  
  // Validate wallet format
  if (!/^G[A-Z2-7]{55}$/.test(wallet_address)) {
    return res.status(400).json({ error: 'Invalid Stellar wallet address format' });
  }
  
  const parsedAmount = parseFloat(amount_xlm);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number' });
  }
  
  // SECURITY: Verify requester owns the wallet
  const requestingWallet = req.headers['x-wallet-address'];
  if (requestingWallet && requestingWallet !== wallet_address) {
    return res.status(403).json({ 
      error: 'Cannot deposit on behalf of another user',
      attempting_to_deposit_as: wallet_address,
      authenticated_as: requestingWallet
    });
  }

  try {
    // Verify depositor exists as a user
    const user = await db('users').where({ wallet_address }).first();
    if (!user) {
      return res.status(404).json({ error: 'User not found - please register first' });
    }

    // In production: Verify actual token transfer to PoolContract on-chain
    // MVP: Simulate deposit with updated stats
    console.log(`Pool deposit: ${parsedAmount} XLM from ${wallet_address}`);
    res.json({ 
      ok: true, 
      message: 'Deposit successful', 
      amount_xlm: parsedAmount,
      depositor: wallet_address,
      stats: {
        total_liquidity: 150000 + parsedAmount,
        active_loans: 45,
        repayment_success_rate: 0.96,
        total_funded: 280000
      }
    });
  } catch (error) {
    console.error('Pool deposit error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/pool/stats', async (req, res) => {
  res.json({
    total_liquidity: 150000,
    active_loans: 45,
    repayment_success_rate: 0.96,
    total_funded: 280000
  });
});

// Start server
initDb().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
});
