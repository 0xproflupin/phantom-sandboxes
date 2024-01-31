import { Transaction, VersionedTransaction } from '@solana/web3.js';

import { PhantomProvider } from '../types';

/**
 * Signs an array of transactions
 * @param   {PhantomProvider} provider     a Phantom provider
 * @param   {Transaction | VersionedTransaction}     transaction1 a transaction to sign
 * @param   {Transaction | VersionedTransaction}     transaction2 a transaction to sign
 * @returns {(Transaction | VersionedTransaction)[]}                an array of signed transactions
 */
const signAllTransactions = async (
  provider: PhantomProvider,
  transactions: (Transaction | VersionedTransaction)[]
): Promise<(Transaction | VersionedTransaction)[]> => {
  try {
    return await provider.signAllTransactions(transactions);
  } catch (error) {
    console.warn(error);
    throw new Error(error.message);
  }
};

export default signAllTransactions;
