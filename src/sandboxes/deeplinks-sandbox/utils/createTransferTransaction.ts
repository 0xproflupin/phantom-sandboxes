import { Transaction, SystemProgram, Connection, PublicKey } from '@solana/web3.js';
import { TLog } from '../types';

const createTransferTransaction = async (publicKey: PublicKey | undefined, connection: Connection, createLog: (log: TLog) => void, amount?: number): Promise<Transaction> => {
  if (!publicKey) throw new Error("missing public key from user");
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: publicKey,
      toPubkey: publicKey,
      lamports: amount || 100,
    })
  );
  transaction.feePayer = publicKey;
  createLog({
    status: 'info',
    message: 'Getting recent blockhash',
  });
  transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  return transaction;
};

export default createTransferTransaction;
