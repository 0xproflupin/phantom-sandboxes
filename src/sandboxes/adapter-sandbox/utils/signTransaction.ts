import { Transaction, VersionedTransaction } from '@solana/web3.js';

/**
 * Signs a transaction
 * @param   {PhantomProvider} provider    a Phantom Provider
 * @param   {Transaction | VersionedTransaction}     transaction a transaction to sign
 * @returns {Transaction | VersionedTransaction}                 a signed transaction
 */
const signTransaction = async (
  transaction: Transaction | VersionedTransaction,
  signTx
): Promise<Transaction | VersionedTransaction> => {
  try {
    const signedTransaction = await signTx(transaction);
    return signedTransaction;
  } catch (error) {
    console.warn(error);
    throw new Error(error.message);
  }
};

export default signTransaction;
