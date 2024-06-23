import bs58 from 'bs58';
import { encryptPayload } from './deeplinksUtils';
import { SolanaSignInInput } from '@solana/wallet-standard-features';

const signIn = (
  signInData: SolanaSignInInput,
  session: string,
  sharedSecret: Uint8Array,
  dappPubkey: Uint8Array
): URLSearchParams => {
  const url = new URL(window.location.href);
  const payload = {
    session,
    ...signInData,
  };
  const [nonce, encryptedPayload] = encryptPayload(payload, sharedSecret);
  return new URLSearchParams({
    dapp_encryption_public_key: bs58.encode(dappPubkey),
    nonce: bs58.encode(nonce),
    app_url: 'https://phantom.app',
    redirect_link: `${url.protocol}//${url.hostname}${url.pathname}#onSignIn`,
    payload: bs58.encode(encryptedPayload),
  });
};

export default signIn;
