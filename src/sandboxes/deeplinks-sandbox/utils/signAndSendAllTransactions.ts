import { Transaction, VersionedTransaction } from '@solana/web3.js';
import bs58 from 'bs58';
import { encryptPayload } from './deeplinksUtils';

const signAndSendAllTransactions = (
  transactions: (Transaction | VersionedTransaction)[],
  session: string,
  sharedSecret: Uint8Array,
  dappPubkey: Uint8Array
): URLSearchParams => {
  const url = new URL(window.location.href);
  const serializedTransactions = transactions.map((t) =>
    bs58.encode(
      t.serialize({
        requireAllSignatures: false,
      })
    )
  );

  const payload = {
    session,
    transactions: serializedTransactions,
  };
  const [nonce, encryptedPayload] = encryptPayload(payload, sharedSecret);
  return new URLSearchParams({
    dapp_encryption_public_key: bs58.encode(dappPubkey),
    nonce: bs58.encode(nonce),
    redirect_link: `${url.protocol}//${url.hostname}${url.pathname}#onSignAllTransactions`,
    payload: bs58.encode(encryptedPayload),
  });
};

export default signAndSendAllTransactions;
