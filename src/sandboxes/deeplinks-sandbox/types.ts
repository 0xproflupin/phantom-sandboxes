import { PublicKey } from "@solana/web3.js";

type PhantomEvent = 'connect' | 'disconnect' | 'accountChanged';

type PhantomRequestMethod =
  | 'connect'
  | 'disconnect'
  | 'signAndSendTransaction'
  | 'signAndSendTransactionV0'
  | 'signTransaction'
  | 'signAllTransactions'
  | 'signMessage';

export type Status = 'success' | 'warning' | 'error' | 'info';

export interface TLog {
  status: Status;
  method?: PhantomRequestMethod | Extract<PhantomEvent, 'accountChanged'>;
  message: string;
  confirmation?: {signature: string, link: string};
  messageTwo?: string;
}

export interface LocalStorageParams {
  sharedSecret?: string;
  session?: string;
  phantomWalletPublicKey?: string;
  dappPubkey?: string;
  dappSecretkey?: string;
}

export interface DeeplinkState {
  sharedSecret?: Uint8Array;
  session?: string;
  phantomWalletPublicKey?: PublicKey;
  dappPubkey?: Uint8Array;
  dappSecretkey?: Uint8Array;
}
