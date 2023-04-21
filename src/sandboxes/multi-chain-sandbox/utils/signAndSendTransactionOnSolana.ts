import { Transaction, VersionedTransaction } from '@solana/web3.js';

import { PhantomSolanaProvider } from '../types';

/**
 * Signs and sends transaction
 * @param   {PhantomSolanaProvider} provider    a Phantom solana provider
 * @param   {Transaction}     transaction a transaction to sign
 * @returns {Transaction}                 a signed transaction
 */
const signAndSendTransactionOnSolana = async (
  provider: PhantomSolanaProvider,
  transaction: Transaction | VersionedTransaction
): Promise<string> => {
  try {
    const { signature } = await provider.signAndSendTransaction(transaction);
    return signature;
  } catch (error) {
    console.warn(error);
    throw new Error(error.message);
  }
};

export default signAndSendTransactionOnSolana;
