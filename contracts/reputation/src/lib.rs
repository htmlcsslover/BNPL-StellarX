#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Rep(Address),
    AuthorizedLoanContract,
}

#[derive(Clone, Default)]
#[contracttype]
pub struct Reputation {
    pub successes: u32,
    pub defaults: u32,
}

#[contract]
pub struct ReputationContract;

#[contractimpl]
impl ReputationContract {
    /// Initialize the reputation contract with authorized loan contract address.
    pub fn initialize(env: Env, loan_contract: Address) {
        env.storage().instance().set(&DataKey::AuthorizedLoanContract, &loan_contract);
    }

    /// Record a successful repayment. Only callable by authorized loan contract.
    pub fn record_success(env: Env, borrower: Address) {
        let loan_contract: Address = env.storage().instance().get(&DataKey::AuthorizedLoanContract).expect("contract not initialized");
        loan_contract.require_auth();
        
        let mut rep = Self::get_reputation(env.clone(), borrower.clone());
        rep.successes += 1;
        env.storage().persistent().set(&DataKey::Rep(borrower), &rep);
    }

    /// Record a default/missed payment. Only callable by authorized loan contract.
    pub fn record_default(env: Env, borrower: Address) {
        let loan_contract: Address = env.storage().instance().get(&DataKey::AuthorizedLoanContract).expect("contract not initialized");
        loan_contract.require_auth();
        
        let mut rep = Self::get_reputation(env.clone(), borrower.clone());
        rep.defaults += 1;
        env.storage().persistent().set(&DataKey::Rep(borrower), &rep);
    }

    pub fn get_reputation(env: Env, borrower: Address) -> Reputation {
        env.storage()
            .persistent()
            .get(&DataKey::Rep(borrower))
            .unwrap_or(Reputation {
                successes: 0,
                defaults: 0,
            })
    }

    pub fn get_score(env: Env, borrower: Address) -> u32 {
        let rep = Self::get_reputation(env, borrower);
        // Simple scoring: 10 points per success, -50 per default
        // Minimum score 0
        let score = (rep.successes as i32 * 10) - (rep.defaults as i32 * 50);
        if score < 0 {
            0
        } else {
            score as u32
        }
    }
}
