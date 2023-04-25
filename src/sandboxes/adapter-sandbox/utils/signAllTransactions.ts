import { Transaction, VersionedTransaction } from '@solana/web3.js';

/**
 * Signs an array of transactions
 * @param   {PhantomProvider} provider     a Phantom provider
 * @param   {Transaction | VersionedTransaction}     transaction1 a transaction to sign
 * @param   {Transaction | VersionedTransaction}     transaction2 a transaction to sign
 * @returns {(Transaction | VersionedTransaction)[]}                an array of signed transactions
 */
const signAllTransactions = async (
  transaction1: Transaction | VersionedTransaction,
  transaction2: Transaction | VersionedTransaction,
  signAllTx
): Promise<(Transaction | VersionedTransaction)[]> => {
  try {
    const transactions = await signAllTx([transaction1, transaction2]);
    return transactions;
  } catch (error) {
    console.warn(error);
    throw new Error(error.message);
  }
};

export default signAllTransactions;
