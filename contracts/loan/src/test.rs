#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::{Address as _, Events}, Address, Env, IntoVal};
use stellarbnpl_pool::{PoolContract, PoolContractClient};
use stellarbnpl_reputation::{ReputationContract, ReputationContractClient};

#[test]
fn test_loan_lifecycle() {
    let env = Env::default();
    env.mock_all_auths();

    // 1. Setup Token
    let admin = Address::generate(&env);
    let token_id = env.register_stellar_asset_contract(admin.clone());
    let token = token::StellarAssetClient::new(&env, &token_id);

    // 2. Setup Reputation
    let rep_id = env.register(ReputationContract, ());
    let rep_client = ReputationContractClient::new(&env, &rep_id);

    // 3. Setup Pool
    let pool_id = env.register(PoolContract, ());
    let pool_client = PoolContractClient::new(&env, &pool_id);
    pool_client.initialize(&token_id);

    // 4. Setup Loan
    let loan_id = env.register(LoanContract, ());
    let loan_client = LoanContractClient::new(&env, &loan_id);
    loan_client.initialize(&token_id, &pool_id, &rep_id);

    // 5. LP deposits into Pool
    let lp = Address::generate(&env);
    token.mint(&lp, &1000);
    pool_client.deposit(&lp, &1000);
    assert_eq!(pool_client.get_total_liquidity(), 1000);

    // 6. Borrower requests loan
    let borrower = Address::generate(&env);
    let merchant = Address::generate(&env);
    let loan_amount = 300;
    let installments = 3;
    
    let id = loan_client.request_loan(&borrower, &merchant, &loan_amount, &installments);
    assert_eq!(id, 1);

    // Merchant should have received the funds
    assert_eq!(token::Client::new(&env, &token_id).balance(&merchant), 300);
    // Pool liquidity should be down
    assert_eq!(pool_client.get_total_liquidity(), 700);

    // 7. Borrower repays installments
    token.mint(&borrower, &300);
    
    // Repay 1st installment
    loan_client.repay_installment(&borrower, &1, &100);
    let loan = loan_client.get_loan(&borrower, &1);
    assert_eq!(loan.installments_paid, 1);
    assert_eq!(loan.amount_paid, 100);
    assert_eq!(loan.active, true);

    // Repay 2nd installment
    loan_client.repay_installment(&borrower, &1, &100);
    
    // Repay 3rd installment
    loan_client.repay_installment(&borrower, &1, &100);
    
    let loan = loan_client.get_loan(&borrower, &1);
    assert_eq!(loan.installments_paid, 3);
    assert_eq!(loan.active, false);

    // 8. Reputation should be updated
    let rep = rep_client.get_reputation(&borrower);
    assert_eq!(rep.successes, 1);
    assert_eq!(rep_client.get_score(&borrower), 10);

    // Pool liquidity should be back up
    assert_eq!(pool_client.get_total_liquidity(), 1000);
}
