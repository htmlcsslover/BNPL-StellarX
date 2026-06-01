import {
  TransactionBuilder,
  Operation,
  Asset,
  TimeoutInfinite,
  Transaction,
} from '@stellar/stellar-sdk';
import { server, NETWORK_PASSPHRASE } from './stellar';

export type AssetCode = 'XLM';

/**
 * Build a simple payment transaction (XLM).
 */
export async function buildPaymentXDR(
  from: string,
  to: string,
  amount: string,
): Promise<string> {
  const account = await server.getAccount(from);
  const asset = Asset.native();

  const tx = new TransactionBuilder(account, {
    fee: '1000',
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.payment({
        destination: to,
        asset,
        amount,
      }),
    )
    .setTimeout(TimeoutInfinite)
    .build();

  return tx.toXDR();
}

/**
 * Submits a signed XDR to the network.
 */
export async function submitSignedXDR(xdr: string): Promise<string> {
  const tx = new Transaction(xdr, NETWORK_PASSPHRASE);
  const res = await server.sendTransaction(tx);
  if (res.status !== 'PENDING') {
    throw new Error(`Transaction submission failed: ${res.status}`);
  }
  return res.hash;
}

/**
 * Polls for transaction results until it is either SUCCESS or FAILED.
 */
export async function pollTransaction(hash: string): Promise<void> {
  let attempts = 0;
  while (attempts < 60) {
    const res = await server.getTransaction(hash);
    if (res.status === 'SUCCESS') return;
    if (res.status === 'FAILED') {
      throw new Error(`Transaction failed: ${JSON.stringify(res.resultMetaXdr)}`);
    }
    // Still pending, wait 1s
    await new Promise((r) => setTimeout(r, 1000));
    attempts++;
  }
  throw new Error('Transaction polling timed out (60s)');
}
