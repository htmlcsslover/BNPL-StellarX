const knex = require('knex');
const path = require('path');

const db = knex({
  client: 'sqlite3',
  connection: {
    filename: path.join(__dirname, '../stellarbnpl.sqlite'),
  },
  useNullAsDefault: true,
});

async function initDb() {
  const hasUsers = await db.schema.hasTable('users');
  if (!hasUsers) {
    await db.schema.createTable('users', (table) => {
      table.uuid('id').primary();
      table.string('wallet_address').unique().notNullable();
      table.string('role').notNullable(); 
      table.string('display_name');
      table.string('status').defaultTo('active');
      table.timestamp('created_at').defaultTo(db.fn.now());
    });
  }

  const hasProducts = await db.schema.hasTable('products');
  if (!hasProducts) {
    await db.schema.createTable('products', (table) => {
      table.uuid('id').primary();
      table.string('seller_wallet').notNullable();
      table.string('title').notNullable();
      table.text('description');
      table.decimal('price_xlm', 20, 7).notNullable();
      table.string('image_url');
      table.string('category');
      table.string('status').defaultTo('active'); 
      table.timestamp('created_at').defaultTo(db.fn.now());
    });

    const sellerWallet = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
    await db('users').insert({ 
      id: '00000000-0000-0000-0000-000000000001', 
      wallet_address: sellerWallet, 
      role: 'seller',
      display_name: 'Stellar Electronics'
    }).catch(() => {});
    
    await db('products').insert([
      { id: 'p1', seller_wallet: sellerWallet, title: 'Smartphone', description: 'High-end smartphone', price_xlm: 500, image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9', category: 'Electronics' },
      { id: 'p2', seller_wallet: sellerWallet, title: 'Laptop', description: 'Powerful laptop', price_xlm: 1200, image_url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853', category: 'Electronics' },
      { id: 'p3', seller_wallet: sellerWallet, title: 'Headphones', description: 'Noise-cancelling headphones', price_xlm: 250, image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e', category: 'Electronics' },
      { id: 'p4', seller_wallet: sellerWallet, title: 'Home Appliance', description: 'Smart blender', price_xlm: 150, image_url: 'https://images.unsplash.com/photo-1585238341267-1cfec2046a55', category: 'Home' },
    ]).catch(() => {});
  } else {
    // Migration: Ensure price_xlm column exists and is NOT NULL
    const hasPriceXlm = await db.schema.hasColumn('products', 'price_xlm');
    if (!hasPriceXlm) {
      await db.schema.table('products', (table) => {
        table.decimal('price_xlm', 20, 7);
      });
      console.log('Migrated products table: added price_xlm column');
      await db('products').where({ id: 'p1' }).update({ price_xlm: 500 });
      await db('products').where({ id: 'p2' }).update({ price_xlm: 1200 });
      await db('products').where({ id: 'p3' }).update({ price_xlm: 250 });
      await db('products').where({ id: 'p4' }).update({ price_xlm: 150 });
    }
  }

  const hasOrders = await db.schema.hasTable('orders');
  if (!hasOrders) {
    await db.schema.createTable('orders', (table) => {
      table.uuid('id').primary();
      table.string('buyer_wallet').notNullable();
      table.string('seller_wallet').notNullable();
      table.uuid('product_id').references('products.id').onDelete('CASCADE');
      table.uuid('loan_id').references('loans.id').onDelete('CASCADE');
      table.string('status').defaultTo('pending');
      table.timestamp('created_at').defaultTo(db.fn.now());
      table.timestamp('updated_at').defaultTo(db.fn.now());
    });
  } else {
    // Migration: Fix loan_id column to be UUID with proper foreign key
    const loanIdType = await db.raw(`PRAGMA table_info(orders)`);
    const loanIdColumn = loanIdType.find(col => col.name === 'loan_id');
    
    // SQLite doesn't support ALTER COLUMN, so we check if migration was done
    const hasUpdatedAt = await db.schema.hasColumn('orders', 'updated_at');
    if (!hasUpdatedAt) {
      console.log('Note: SQLite limitations prevent altering existing columns. Manual migration may be needed for orders.loan_id');
      try {
        await db.schema.table('orders', (table) => {
          table.timestamp('updated_at').defaultTo(db.fn.now());
        });
      } catch (e) {
        // Column may already exist
      }
    }
  }

  const hasLoans = await db.schema.hasTable('loans');
  if (!hasLoans) {
    await db.schema.createTable('loans', (table) => {
      table.uuid('id').primary();
      table.string('contract_id').unique().notNullable();
      table.string('borrower_wallet').notNullable();
      table.string('merchant_wallet').notNullable();
      table.uuid('product_id').references('products.id').onDelete('CASCADE');
      table.decimal('amount_xlm', 20, 7).notNullable();
      table.enum('status', ['active', 'paid', 'defaulted', 'cancelled']).defaultTo('active');
      table.timestamp('created_at').defaultTo(db.fn.now());
      table.timestamp('updated_at').defaultTo(db.fn.now());
    });
  } else {
    // Migration: Ensure amount_xlm column exists and wallets are NOT NULL
    const hasAmountXlm = await db.schema.hasColumn('loans', 'amount_xlm');
    if (!hasAmountXlm) {
      await db.schema.table('loans', (table) => {
        table.decimal('amount_xlm', 20, 7);
      });
      console.log('Migrated loans table: added amount_xlm column');
    }
    
    const hasUpdatedAt = await db.schema.hasColumn('loans', 'updated_at');
    if (!hasUpdatedAt) {
      try {
        await db.schema.table('loans', (table) => {
          table.timestamp('updated_at').defaultTo(db.fn.now());
        });
        console.log('Migrated loans table: added updated_at column');
      } catch (e) {
        // Column may already exist
      }
    }

    // Surgical migration: Remove the unique constraint if it exists (SQLite doesn't support DROP CONSTRAINT)
    const indexes = await db.raw("PRAGMA index_list('loans')");
    const hasUniqueConstraint = indexes.some(idx => idx.unique === 1 && (idx.origin === 'u' || idx.origin === 'c') && idx.name.includes('borrower_wallet_product_id'));
    
    if (hasUniqueConstraint) {
      console.log('Migrating loans table to remove unique constraint...');
      await db.transaction(async (trx) => {
        // 1. Create temp table
        await trx.schema.createTable('loans_temp', (table) => {
          table.uuid('id').primary();
          table.string('contract_id').unique().notNullable();
          table.string('borrower_wallet').notNullable();
          table.string('merchant_wallet').notNullable();
          table.uuid('product_id').references('products.id').onDelete('CASCADE');
          table.decimal('amount_xlm', 20, 7).notNullable();
          table.enum('status', ['active', 'paid', 'defaulted', 'cancelled']).defaultTo('active');
          table.timestamp('created_at').defaultTo(db.fn.now());
          table.timestamp('updated_at').defaultTo(db.fn.now());
        });
        
        // 2. Copy data to temp
        await trx.raw(`
          INSERT INTO loans_temp (id, contract_id, borrower_wallet, merchant_wallet, product_id, amount_xlm, status, created_at, updated_at)
          SELECT id, contract_id, borrower_wallet, merchant_wallet, product_id, amount_xlm, status, created_at, updated_at FROM loans
        `);
        
        // 3. Drop original table (this also drops its indexes)
        await trx.raw("DROP TABLE loans");
        
        // 4. Recreate original table with new schema
        await trx.schema.createTable('loans', (table) => {
          table.uuid('id').primary();
          table.string('contract_id').unique().notNullable();
          table.string('borrower_wallet').notNullable();
          table.string('merchant_wallet').notNullable();
          table.uuid('product_id').references('products.id').onDelete('CASCADE');
          table.decimal('amount_xlm', 20, 7).notNullable();
          table.enum('status', ['active', 'paid', 'defaulted', 'cancelled']).defaultTo('active');
          table.timestamp('created_at').defaultTo(db.fn.now());
          table.timestamp('updated_at').defaultTo(db.fn.now());
        });
        
        // 5. Copy data back
        await trx.raw(`
          INSERT INTO loans (id, contract_id, borrower_wallet, merchant_wallet, product_id, amount_xlm, status, created_at, updated_at)
          SELECT id, contract_id, borrower_wallet, merchant_wallet, product_id, amount_xlm, status, created_at, updated_at FROM loans_temp
        `);
        
        // 6. Drop temp table
        await trx.raw("DROP TABLE loans_temp");
      });
      console.log('Loans table migrated successfully.');
    }
  }

  // Repayments table for tracking individual payments (MVP: tracks full repayment only)
  const hasRepayments = await db.schema.hasTable('repayments');
  if (!hasRepayments) {
    await db.schema.createTable('repayments', (table) => {
      table.uuid('id').primary();
      table.uuid('loan_id').references('loans.id').onDelete('CASCADE').notNullable();
      table.string('wallet_address').notNullable();  // Repayer address
      table.decimal('amount_xlm', 20, 7).notNullable();
      table.integer('installment_number').nullable(); // 1, 2, or 3
      table.timestamp('due_date').nullable();
      table.enum('status', ['pending', 'completed', 'failed']).defaultTo('pending');
      table.string('tx_hash').nullable();  // Stellar transaction hash (when integrated)
      table.timestamp('created_at').defaultTo(db.fn.now());
    });
    console.log('Created repayments table');
  } else {
    const hasInstallmentNumber = await db.schema.hasColumn('repayments', 'installment_number');
    if (!hasInstallmentNumber) {
      await db.schema.table('repayments', (table) => {
        table.integer('installment_number');
        table.timestamp('due_date');
      });
      console.log('Migrated repayments table: added installment_number and due_date');
    }
  }
}

module.exports = { db, initDb };
