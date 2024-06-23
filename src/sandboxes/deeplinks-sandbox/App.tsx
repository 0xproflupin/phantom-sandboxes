/**
 * @DEV: If the sandbox is throwing dependency errors, chances are you need to clear your browser history.
 * This will trigger a re-install of the dependencies in the sandbox – which should fix things right up.
 * Alternatively, you can fork this sandbox to refresh the dependencies manually.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { Connection, PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

import {
  buildUrl,
  decryptPayload,
  setLocalStorage,
  removeLocalStorage,
  createTransferTransaction,
  signTransaction,
  signAndSendTransaction,
  signAllTransactions,
  signMessage,
  getMobileOS,
  signAndSendAllTransactions,
  createSignInErrorData,
  createSignInData,
} from './utils';

import { DeeplinkState, Platform, TLog } from './types';

import { Logs, Sidebar } from './components';

// =============================================================================
// Styled Components
// =============================================================================

const StyledApp = styled.div`
  display: flex;
  flex-direction: row;
  height: 100vh;
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

// =============================================================================
// Constants
// =============================================================================

const getConnectionUrl = (network: string): string => {
  switch (network) {
    case 'devnet':
      // NB: This URL will only work for Phantom sandbox apps! Please do not use this for your project.
      return process.env.REACT_APP_SOLANA_DEVNET_RPC;
    case 'mainnet':
      // NB: This URL will only work for Phantom sandbox apps! Please do not use this for your project.
      return process.env.REACT_APP_SOLANA_MAINNET_RPC;
    default:
      throw new Error(`Invalid network: ${network}`);
  }
};

// =============================================================================
// Typedefs
// =============================================================================
export type ConnectedMethods =
  | {
      name: string;
      onClick: () => Promise<string>;
    }
  | {
      name: string;
      onClick: () => Promise<void>;
    };

interface Props {
  publicKey: PublicKey | null;
  connectedMethods: ConnectedMethods[];
  handleConnect: () => Promise<void>;
  handleBrowseDeeplink: () => Promise<void>;
  handleSignIn: () => Promise<void>;
  logs: TLog[];
  clearLogs: () => void;
  toggleLogs: () => void;
  logsVisibility: boolean;
  network: string;
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * @DEVELOPERS
 * The fun stuff!
 */
const useProps = (): Props => {
  const [network] = useState('mainnet');
  const [connection] = useState(new Connection(getConnectionUrl(network)));
  const [logs, setLogs] = useState<TLog[]>([]);
  const [logsVisibility, setLogsVisibility] = useState(false);
  const [platform, setPlatform] = useState<Platform>(Platform.Other);

  const [dappPubkey, setDappPubkey] = useState<Uint8Array | null>(() => {
    const pubkey = localStorage.getItem('dappPubkey');
    return pubkey ? bs58.decode(pubkey) : null;
  });
  const [dappSecretkey, setDappSecretkey] = useState<Uint8Array | null>(() => {
    const secret = localStorage.getItem('dappSecretkey');
    return secret ? bs58.decode(secret) : null;
  });
  const [sharedSecret, setSharedSecret] = useState<Uint8Array | null>(() => {
    const secret = localStorage.getItem('sharedSecret');
    return secret ? bs58.decode(secret) : null;
  });
  const [session, setSession] = useState<string | null>(localStorage.getItem('session') || null);
  const [phantomWalletPublicKey, setPhantomWalletPublicKey] = useState<PublicKey | null>(() => {
    const key = localStorage.getItem('phantomWalletPublicKey');
    return key ? new PublicKey(key) : null;
  });

  const setDeeplinkState = useCallback(
    (deepLinkState: DeeplinkState) => {
      if (deepLinkState.sharedSecret !== undefined) setSharedSecret(deepLinkState.sharedSecret);
      if (deepLinkState.session !== undefined) setSession(deepLinkState.session);
      if (deepLinkState.phantomWalletPublicKey !== undefined)
        setPhantomWalletPublicKey(deepLinkState.phantomWalletPublicKey);
      if (deepLinkState.dappPubkey !== undefined) setDappPubkey(deepLinkState.dappPubkey);
      if (deepLinkState.dappSecretkey !== undefined) setDappSecretkey(deepLinkState.dappSecretkey);
    },
    [setSharedSecret, setSession, setPhantomWalletPublicKey, setDappPubkey, setDappSecretkey]
  );

  const resetDeeplinkState = useCallback(() => {
    setSharedSecret(null);
    setSession(null);
    setPhantomWalletPublicKey(null);
    setDappPubkey(null);
    setDappSecretkey(null);
    setLogs([]);
  }, [setSharedSecret, setSession, setPhantomWalletPublicKey, setDappPubkey, setDappSecretkey]);

  const createLog = useCallback(
    (log: TLog) => {
      return setLogs((logs) => [...logs, log]);
    },
    [setLogs]
  );

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const toggleLogs = () => {
    setLogsVisibility(!logsVisibility);
  };

  useEffect(() => {
    setPlatform(getMobileOS());
  }, []);

  useEffect(() => {
    const handleDeepLink = () => {
      const url = new URL(window.location.href);
      const params = url.searchParams;
      if (params.get('errorCode')) {
        createLog({
          status: 'error',
          message: JSON.stringify(Object.fromEntries([...params]), null, 2),
        });
        return;
      }

      const path = url.hash.substring(1);
      if (path.startsWith('onConnect')) {
        const sharedSecretDapp = nacl.box.before(
          bs58.decode(params.get('phantom_encryption_public_key')),
          dappSecretkey
        );

        try {
          const connectData = decryptPayload(params.get('data'), params.get('nonce'), sharedSecretDapp);

          setLocalStorage({
            sharedSecret: bs58.encode(sharedSecretDapp),
            session: connectData.session,
            phantomWalletPublicKey: connectData.public_key,
          });
          setDeeplinkState({
            sharedSecret: sharedSecretDapp,
            session: connectData.session,
            phantomWalletPublicKey: new PublicKey(connectData.public_key),
          });

          createLog({
            status: 'info',
            method: 'connect',
            message: JSON.stringify(connectData, null, 2),
          });
        } catch (error) {
          createLog({
            status: 'error',
            method: 'connect',
            message: JSON.stringify(error, null, 2),
          });
        }
      } else if (path.startsWith('onSignIn')) {
        const sharedSecretDapp = nacl.box.before(
          bs58.decode(params.get('phantom_encryption_public_key')),
          dappSecretkey
        );

        try {
          const signInData = decryptPayload(params.get('data'), params.get('nonce'), sharedSecretDapp);

          setLocalStorage({
            sharedSecret: bs58.encode(sharedSecretDapp),
            session: signInData.session,
            phantomWalletPublicKey: signInData.public_key,
          });
          setDeeplinkState({
            sharedSecret: sharedSecretDapp,
            session: signInData.session,
            phantomWalletPublicKey: new PublicKey(signInData.public_key),
          });

          createLog({
            status: 'info',
            method: 'signIn',
            message: JSON.stringify(signInData, null, 2),
          });
        } catch (error) {
          createLog({
            status: 'error',
            method: 'signIn',
            message: JSON.stringify(error, null, 2),
          });
        }
      } else if (path.startsWith('onDisconnect')) {
        removeLocalStorage();
        resetDeeplinkState();

        createLog({
          status: 'info',
          method: 'disconnect',
          message: 'Disconnected!',
        });
      } else if (path.startsWith('onSignAndSendAllTransactions')) {
        try {
          const signAndSendAllTransactionsData = decryptPayload(params.get('data'), params.get('nonce'), sharedSecret);

          createLog({
            status: 'info',
            method: 'signAndSendAllTransactions',
            message: JSON.stringify(signAndSendAllTransactionsData, null, 2),
          });
        } catch (error) {
          createLog({
            status: 'error',
            method: 'signAndSendAllTransactions',
            message: JSON.stringify(error, null, 2),
          });
        }
      } else if (path.startsWith('onSignAndSendTransaction')) {
        try {
          const signAndSendTransactionData = decryptPayload(params.get('data'), params.get('nonce'), sharedSecret);

          createLog({
            status: 'info',
            method: 'signAndSendTransaction',
            message: JSON.stringify(signAndSendTransactionData, null, 2),
          });
        } catch (error) {
          createLog({
            status: 'error',
            method: 'signAndSendTransaction',
            message: JSON.stringify(error, null, 2),
          });
        }
      } else if (path.startsWith('onSignAllTransactions')) {
        try {
          const signAllTransactionsData = decryptPayload(params.get('data'), params.get('nonce'), sharedSecret);

          createLog({
            status: 'info',
            method: 'signAllTransactions',
            message: JSON.stringify(signAllTransactionsData, null, 2),
          });
        } catch (error) {
          createLog({
            status: 'error',
            method: 'signAllTransactions',
            message: JSON.stringify(error, null, 2),
          });
        }
      } else if (path.startsWith('onSignTransaction')) {
        try {
          const signTransactionData = decryptPayload(params.get('data'), params.get('nonce'), sharedSecret);

          createLog({
            status: 'info',
            method: 'signTransaction',
            message: JSON.stringify(signTransactionData, null, 2),
          });
        } catch (error) {
          createLog({
            status: 'error',
            method: 'signTransaction',
            message: JSON.stringify(error, null, 2),
          });
        }
      } else if (path.startsWith('onSignMessage')) {
        try {
          const signMessageData = decryptPayload(params.get('data'), params.get('nonce'), sharedSecret);

          createLog({
            status: 'info',
            method: 'signMessage',
            message: JSON.stringify(signMessageData, null, 2),
          });
        } catch (error) {
          createLog({
            status: 'error',
            method: 'signMessage',
            message: JSON.stringify(error, null, 2),
          });
        }
      }
    };

    handleDeepLink();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createLog, resetDeeplinkState, setDeeplinkState]);

  const handleConnect = useCallback(async () => {
    const url = new URL(window.location.href);
    const kp = nacl.box.keyPair();
    setDeeplinkState({
      dappPubkey: kp.publicKey,
      dappSecretkey: kp.secretKey,
    });
    const dappEncryptionPubkey = bs58.encode(kp.publicKey);
    setLocalStorage({ dappPubkey: dappEncryptionPubkey, dappSecretkey: bs58.encode(kp.secretKey) });
    const params = new URLSearchParams({
      dapp_encryption_public_key: dappEncryptionPubkey,
      cluster: 'mainnet-beta',
      app_url: 'https://phantom.app',
      redirect_link: `${url.protocol}//${url.hostname}${url.pathname}#onConnect`,
    });

    createLog({
      status: 'info',
      message: 'Connecting..',
    });

    window.location.href = buildUrl('connect', params, platform);
  }, [createLog, platform, setDeeplinkState]);

  const handleSignIn = useCallback(async () => {
    const url = new URL(window.location.href);
    const kp = nacl.box.keyPair();
    setDeeplinkState({
      dappPubkey: kp.publicKey,
      dappSecretkey: kp.secretKey,
    });
    const dappEncryptionPubkey = bs58.encode(kp.publicKey);
    setLocalStorage({ dappPubkey: dappEncryptionPubkey, dappSecretkey: bs58.encode(kp.secretKey) });
    const signInData = await createSignInData();
    const params = new URLSearchParams({
      dapp_encryption_public_key: dappEncryptionPubkey,
      cluster: 'mainnet-beta',
      app_url: 'https://phantom.app',
      redirect_link: `${url.protocol}//${url.hostname}${url.pathname}#onSignIn`,
      payload: bs58.encode(Buffer.from(JSON.stringify(signInData))),
    });

    createLog({
      status: 'info',
      message: 'Signing In..',
    });

    window.location.href = buildUrl('signIn', params, platform);
  }, [createLog, platform, setDeeplinkState]);

  const handleSignInError = useCallback(async () => {
    const url = new URL(window.location.href);
    const kp = nacl.box.keyPair();
    setDeeplinkState({
      dappPubkey: kp.publicKey,
      dappSecretkey: kp.secretKey,
    });
    const dappEncryptionPubkey = bs58.encode(kp.publicKey);
    setLocalStorage({ dappPubkey: dappEncryptionPubkey, dappSecretkey: bs58.encode(kp.secretKey) });
    const signInErrorData = await createSignInErrorData();
    const params = new URLSearchParams({
      dapp_encryption_public_key: dappEncryptionPubkey,
      cluster: 'mainnet-beta',
      app_url: 'https://phantom.app',
      redirect_link: `${url.protocol}//${url.hostname}${url.pathname}#onSignIn`,
      payload: bs58.encode(Buffer.from(JSON.stringify(signInErrorData))),
    });

    createLog({
      status: 'info',
      message: 'Signing In..',
    });

    window.location.href = buildUrl('signIn', params, platform);
  }, [createLog, platform, setDeeplinkState]);

  const handleDisconnect = useCallback(async () => {
    const url = new URL(window.location.href);
    resetDeeplinkState();
    removeLocalStorage();
    clearLogs();

    createLog({
      status: 'info',
      message: 'Disconnected!',
    });
    window.location.href = `${url.protocol}//${url.hostname}${url.pathname}`;
  }, [resetDeeplinkState, clearLogs, createLog]);

  const handleSignAndSendAllTransactions = useCallback(async () => {
    const transactions = await Promise.all([
      createTransferTransaction(phantomWalletPublicKey, connection, createLog, 100),
      createTransferTransaction(phantomWalletPublicKey, connection, createLog, 101),
      createTransferTransaction(phantomWalletPublicKey, connection, createLog, 102),
    ]);
    const params = signAndSendAllTransactions(transactions, session, sharedSecret, dappPubkey);
    window.location.href = buildUrl('signAndSendAllTransactions', params, platform);
  }, [phantomWalletPublicKey, connection, createLog, session, sharedSecret, dappPubkey, platform]);

  const handleSignAndSendTransaction = useCallback(async () => {
    const transaction = await createTransferTransaction(phantomWalletPublicKey, connection, createLog);
    const params = signAndSendTransaction(transaction, session, sharedSecret, dappPubkey);
    window.location.href = buildUrl('signAndSendTransaction', params, platform);
  }, [phantomWalletPublicKey, connection, createLog, session, sharedSecret, dappPubkey, platform]);

  const handleSignAllTransactions = useCallback(async () => {
    const transactions = await Promise.all([
      createTransferTransaction(phantomWalletPublicKey, connection, createLog, 100),
      createTransferTransaction(phantomWalletPublicKey, connection, createLog, 101),
      createTransferTransaction(phantomWalletPublicKey, connection, createLog, 102),
    ]);
    const params = signAllTransactions(transactions, session, sharedSecret, dappPubkey);
    window.location.href = buildUrl('signAllTransactions', params, platform);
  }, [phantomWalletPublicKey, connection, createLog, session, sharedSecret, dappPubkey, platform]);

  const handleSignTransaction = useCallback(async () => {
    const transaction = await createTransferTransaction(phantomWalletPublicKey, connection, createLog);
    const params = signTransaction(transaction, session, sharedSecret, dappPubkey);
    window.location.href = buildUrl('signTransaction', params, platform);
  }, [phantomWalletPublicKey, connection, createLog, session, sharedSecret, dappPubkey, platform]);

  const handleSignMessage = useCallback(async () => {
    const message = 'To avoid digital dognappers, sign below to authenticate with CryptoCorgis.';
    const params = signMessage(message, session, sharedSecret, dappPubkey);
    window.location.href = buildUrl('signMessage', params, platform);
  }, [session, sharedSecret, dappPubkey, platform]);

  const handleBrowseDeeplink = useCallback(async () => {
    const url = new URL(window.location.href);
    const encodedUrl = encodeURIComponent(`${url.protocol}//${url.hostname}`);
    const encodedRef = encodeURIComponent(`${url.protocol}//${url.hostname}${url.pathname}`);
    window.location.href =
      platform === Platform.iOS
        ? `phantom://browse/${encodedUrl}?ref=${encodedRef}`
        : `https://phantom.app/ul/browse/${encodedUrl}?ref=${encodedRef}`;
  }, [platform]);

  const connectedMethods = useMemo(() => {
    return [
      {
        name: 'Sign and Send All Transactions',
        onClick: handleSignAndSendAllTransactions,
      },
      {
        name: 'Sign and Send Transaction',
        onClick: handleSignAndSendTransaction,
      },
      {
        name: 'Sign Transaction',
        onClick: handleSignTransaction,
      },
      {
        name: 'Sign All Transactions',
        onClick: handleSignAllTransactions,
      },
      {
        name: 'Sign Message',
        onClick: handleSignMessage,
      },
      {
        name: 'Sign In',
        onClick: handleSignIn,
      },
      {
        name: 'Sign In Error',
        onClick: handleSignInError,
      },
      {
        name: 'Open in Phantom',
        onClick: handleBrowseDeeplink,
      },
      {
        name: 'Disconnect',
        onClick: handleDisconnect,
      },
    ];
  }, [
    handleDisconnect,
    handleSignAndSendAllTransactions,
    handleSignAndSendTransaction,
    handleSignTransaction,
    handleSignAllTransactions,
    handleSignMessage,
    handleSignIn,
    handleSignInError,
    handleBrowseDeeplink,
  ]);

  return {
    publicKey: phantomWalletPublicKey || null,
    connectedMethods,
    handleConnect,
    handleBrowseDeeplink,
    handleSignIn,
    logs,
    clearLogs,
    toggleLogs,
    logsVisibility,
    network,
  };
};

// =============================================================================
// Stateless Component
// =============================================================================

const StatelessApp = React.memo((props: Props) => {
  const {
    publicKey,
    connectedMethods,
    handleConnect,
    handleBrowseDeeplink,
    handleSignIn,
    logs,
    clearLogs,
    logsVisibility,
    toggleLogs,
    network,
  } = props;

  return (
    <StyledApp>
      <Sidebar
        publicKey={publicKey}
        connectedMethods={connectedMethods}
        connect={handleConnect}
        openInPhantom={handleBrowseDeeplink}
        signIn={handleSignIn}
        network={network}
        logsVisibility={logsVisibility}
        toggleLogs={toggleLogs}
      />
      {logsVisibility && <Logs publicKey={publicKey} logs={logs} clearLogs={clearLogs} />}
    </StyledApp>
  );
});

// =============================================================================
// Main Component
// =============================================================================

const App = () => {
  const props = useProps();

  return <StatelessApp {...props} />;
};

export default App;
