import { Connection, Transaction, VersionedTransaction } from '@solana/web3.js';

/**
 * Signs and sends transaction
 * @param   {PhantomProvider} provider    a Phantom Provider
 * @param   {Transaction}     transaction a transaction to sign
 * @returns {Transaction}                 a signed transaction
 */
const signAndSendTransaction = async (
  transaction: Transaction | VersionedTransaction,
  connection: Connection,
  sendTx
): Promise<string> => {
  try {
    const signature = await sendTx(transaction, connection, {skipPreflight: false});
    return signature;
  } catch (error) {
    console.warn(error);
    throw new Error(error.message);
  }
};

export default signAndSendTransaction;
