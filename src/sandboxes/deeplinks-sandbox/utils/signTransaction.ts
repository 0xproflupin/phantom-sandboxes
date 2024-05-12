import { Transaction, VersionedTransaction } from '@solana/web3.js';
import bs58 from 'bs58';
import { encryptPayload } from './deeplinksUtils';

const signTransaction = (
  transaction: Transaction | VersionedTransaction,
  session: string,
  sharedSecret: Uint8Array,
  dappPubkey: Uint8Array,
): URLSearchParams => {
  const url = new URL(window.location.href);
  const serializedTransaction = bs58.encode(
    transaction.serialize({
      requireAllSignatures: false
    })
  );

  const payload = {
    session,
    transaction: serializedTransaction
  };
  const [nonce, encryptedPayload] = encryptPayload(payload, sharedSecret);
  return new URLSearchParams({
    dapp_encryption_public_key: bs58.encode(dappPubkey),
    nonce: bs58.encode(nonce),
    redirect_link: `${url.protocol}//${url.hostname}${url.pathname}#onSignTransaction`,
    payload: bs58.encode(encryptedPayload)
  });
};

export default signTransaction;
