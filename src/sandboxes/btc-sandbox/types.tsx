type PhantomEvent = 'connect' | 'disconnect' | 'accountChanged';

type PhantomRequestMethod = 'connect' | 'disconnect';

interface ConnectOpts {
  onlyIfTrusted: boolean;
}

export type Status = 'success' | 'warning' | 'error' | 'info';

export interface TLog {
  status: Status;
  method?: PhantomRequestMethod | Extract<PhantomEvent, 'accountChanged'>;
  message: string;
  confirmation?: { signature: string; link: string };
  messageTwo?: string;
}

export type BtcAccount = {
  address: string;
  addressType: 'p2tr' | 'p2wpkh' | 'p2sh' | 'p2pkh';
  publicKey: string;
  purpose: 'payment' | 'ordinals';
};
