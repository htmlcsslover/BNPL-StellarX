#![no_std]
mod test;
use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env, IntoVal, Symbol};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Token,
    Pool,
    Reputation,
    Loan(Address, u64), // (Borrower, LoanID)
    BorrowerLoanCount(Address),
}

#[derive(Clone)]
#[contracttype]
pub struct Loan {
    pub id: u64,
    pub borrower: Address,
    pub merchant: Address,
    pub amount: i128,
    pub installments_total: u32,
    pub installments_paid: u32,
    pub amount_paid: i128,
    pub active: bool,
}

#[contract]
pub struct LoanContract;

#[contractimpl]
impl LoanContract {
    pub fn initialize(env: Env, token: Address, pool: Address, reputation: Address) {
        if env.storage().instance().has(&DataKey::Token) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::Pool, &pool);
        env.storage().instance().set(&DataKey::Reputation, &reputation);
    }

    pub fn request_loan(env: Env, borrower: Address, merchant: Address, amount: i128, installments: u32) -> u64 {
        borrower.require_auth();

        let pool_addr: Address = env.storage().instance().get(&DataKey::Pool).unwrap();
        
        // Call pool to fund the merchant
        env.invoke_contract::<()>(
            &pool_addr,
            &Symbol::new(&env, "fund_loan"),
            soroban_sdk::vec![&env, merchant.into_val(&env), amount.into_val(&env)],
        );

        let mut count: u64 = env.storage().persistent().get(&DataKey::BorrowerLoanCount(borrower.clone())).unwrap_or(0);
        count += 1;

        let loan = Loan {
            id: count,
            borrower: borrower.clone(),
            merchant,
            amount,
            installments_total: installments,
            installments_paid: 0,
            amount_paid: 0,
            active: true,
        };

        env.storage().persistent().set(&DataKey::Loan(borrower.clone(), count), &loan);
        env.storage().persistent().set(&DataKey::BorrowerLoanCount(borrower), &count);

        count
    }

    pub fn repay_installment(env: Env, borrower: Address, loan_id: u64, amount: i128) {
        borrower.require_auth();

        let mut loan: Loan = env.storage().persistent().get(&DataKey::Loan(borrower.clone(), loan_id)).expect("loan not found");
        if !loan.active {
            panic!("loan is not active");
        }

        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let pool_addr: Address = env.storage().instance().get(&DataKey::Pool).unwrap();
        let reputation_addr: Address = env.storage().instance().get(&DataKey::Reputation).unwrap();

        let client = token::Client::new(&env, &token_addr);
        client.transfer(&borrower, &pool_addr, &amount);

        // Notify pool of repayment
        env.invoke_contract::<()>(
            &pool_addr,
            &Symbol::new(&env, "receive_repayment"),
            soroban_sdk::vec![&env, amount.into_val(&env)],
        );

        loan.amount_paid += amount;
        loan.installments_paid += 1;

        if loan.installments_paid >= loan.installments_total {
            loan.active = false;
            // Record success in reputation contract
            env.invoke_contract::<()>(
                &reputation_addr,
                &Symbol::new(&env, "record_success"),
                soroban_sdk::vec![&env, borrower.into_val(&env)],
            );
        }

        env.storage().persistent().set(&DataKey::Loan(borrower, loan_id), &loan);
    }

    pub fn get_loan(env: Env, borrower: Address, loan_id: u64) -> Loan {
        env.storage().persistent().get(&DataKey::Loan(borrower, loan_id)).expect("loan not found")
    }
}
