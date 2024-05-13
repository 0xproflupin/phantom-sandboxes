import bs58 from 'bs58';
import { encryptPayload } from './deeplinksUtils';

const signMessage = (
  message: string,
  session: string,
  sharedSecret: Uint8Array,
  dappPubkey: Uint8Array,
): URLSearchParams => {
  const url = new URL(window.location.href);
  const payload = {
    session,
    message: bs58.encode(Buffer.from(message))
  };
  const [nonce, encryptedPayload] = encryptPayload(payload, sharedSecret);
  return new URLSearchParams({
    dapp_encryption_public_key: bs58.encode(dappPubkey),
    nonce: bs58.encode(nonce),
    redirect_link: `${url.protocol}//${url.hostname}${url.pathname}#onSignMessage`,
    payload: bs58.encode(encryptedPayload)
  });
};

export default signMessage;
