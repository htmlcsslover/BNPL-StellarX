#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Token,
    TotalLiquidity,
    LpBalance(Address),
    AuthorizedLoanContract,
}

#[contract]
pub struct PoolContract;

#[contractimpl]
impl PoolContract {
    /// Initialize the pool with the token address and authorized loan contract.
    pub fn initialize(env: Env, token: Address, loan_contract: Address) {
        if env.storage().instance().has(&DataKey::Token) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::AuthorizedLoanContract, &loan_contract);
        env.storage().instance().set(&DataKey::TotalLiquidity, &0i128);
    }

    pub fn deposit(env: Env, from: Address, amount: i128) {
        from.require_auth();
        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let client = token::Client::new(&env, &token_addr);
        
        client.transfer(&from, &env.current_contract_address(), &amount);

        let mut total: i128 = env.storage().instance().get(&DataKey::TotalLiquidity).unwrap_or(0);
        total += amount;
        env.storage().instance().set(&DataKey::TotalLiquidity, &total);

        let mut lp_balance: i128 = env.storage().persistent().get(&DataKey::LpBalance(from.clone())).unwrap_or(0);
        lp_balance += amount;
        env.storage().persistent().set(&DataKey::LpBalance(from), &lp_balance);
    }

    pub fn withdraw(env: Env, to: Address, amount: i128) {
        to.require_auth();
        let mut lp_balance: i128 = env.storage().persistent().get(&DataKey::LpBalance(to.clone())).unwrap_or(0);
        if lp_balance < amount {
            panic!("insufficient balance");
        }

        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let client = token::Client::new(&env, &token_addr);
        client.transfer(&env.current_contract_address(), &to, &amount);

        lp_balance -= amount;
        env.storage().persistent().set(&DataKey::LpBalance(to), &lp_balance);

        let mut total: i128 = env.storage().instance().get(&DataKey::TotalLiquidity).unwrap();
        total -= amount;
        env.storage().instance().set(&DataKey::TotalLiquidity, &total);
    }

    /// Fund a loan to a merchant. Only callable by authorized loan contract.
    pub fn fund_loan(env: Env, merchant: Address, amount: i128) {
        let loan_contract: Address = env.storage().instance().get(&DataKey::AuthorizedLoanContract).expect("contract not initialized");
        loan_contract.require_auth();
        
        let mut total: i128 = env.storage().instance().get(&DataKey::TotalLiquidity).unwrap();
        if total < amount {
            panic!("insufficient liquidity in pool");
        }

        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let client = token::Client::new(&env, &token_addr);
        client.transfer(&env.current_contract_address(), &merchant, &amount);

        total -= amount;
        env.storage().instance().set(&DataKey::TotalLiquidity, &total);
    }

    /// Receive repayment from borrower. Only callable by authorized loan contract.
    pub fn receive_repayment(env: Env, amount: i128) {
        let loan_contract: Address = env.storage().instance().get(&DataKey::AuthorizedLoanContract).expect("contract not initialized");
        loan_contract.require_auth();
        
        let mut total: i128 = env.storage().instance().get(&DataKey::TotalLiquidity).unwrap();
        total += amount;
        env.storage().instance().set(&DataKey::TotalLiquidity, &total);
    }

    pub fn get_total_liquidity(env: Env) -> i128 {
        env.storage().instance().get(&DataKey::TotalLiquidity).unwrap_or(0)
    }

    pub fn get_lp_balance(env: Env, lp: Address) -> i128 {
        env.storage().persistent().get(&DataKey::LpBalance(lp)).unwrap_or(0)
    }
}
