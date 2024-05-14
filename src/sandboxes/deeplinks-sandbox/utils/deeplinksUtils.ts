import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { LocalStorageParams, Platform } from '../types';

export const buildUrl = (path: string, params: URLSearchParams, platform: Platform) => {
  return platform === Platform.iOS
    ? `phantom://v1/${path}?${params.toString()}`
    : `https://phantom.app/ul/v1/${path}?${params.toString()}`;
};

export const decryptPayload = (data: string, nonce: string, sharedSecret?: Uint8Array) => {
  if (!sharedSecret) throw new Error('missing shared secret');

  const decryptedData = nacl.box.open.after(bs58.decode(data), bs58.decode(nonce), sharedSecret);
  if (!decryptedData) {
    throw new Error('Unable to decrypt data');
  }
  return JSON.parse(Buffer.from(decryptedData).toString('utf8'));
};

export const encryptPayload = (payload: any, sharedSecret?: Uint8Array) => {
  if (!sharedSecret) throw new Error('missing shared secret');

  const nonce = nacl.randomBytes(24);

  const encryptedPayload = nacl.box.after(Buffer.from(JSON.stringify(payload)), nonce, sharedSecret);

  return [nonce, encryptedPayload];
};

export const getLocalStorage = (): LocalStorageParams => {
  const sharedSecret = localStorage.getItem('sharedSecret');
  const session = localStorage.getItem('session');
  const phantomWalletPublicKey = localStorage.getItem('phantomWalletPublicKey');
  const dappPubkey = localStorage.getItem('dappPubkey');
  const dappSecretkey = localStorage.getItem('dappSecretkey');

  return {
    sharedSecret,
    session,
    phantomWalletPublicKey,
    dappPubkey,
    dappSecretkey,
  };
};

export const setLocalStorage = (params: LocalStorageParams) => {
  if (params.sharedSecret !== undefined) localStorage.setItem('sharedSecret', params.sharedSecret);
  if (params.session !== undefined) localStorage.setItem('session', params.session);
  if (params.phantomWalletPublicKey !== undefined)
    localStorage.setItem('phantomWalletPublicKey', params.phantomWalletPublicKey);
  if (params.dappPubkey !== undefined) localStorage.setItem('dappPubkey', params.dappPubkey);
  if (params.dappSecretkey !== undefined) localStorage.setItem('dappSecretkey', params.dappSecretkey);
};

export const removeLocalStorage = () => {
  localStorage.removeItem('sharedSecret');
  localStorage.removeItem('session');
  localStorage.removeItem('phantomWalletPublicKey');
  localStorage.removeItem('dappPubkey');
  localStorage.removeItem('dappSecretkey');
};
