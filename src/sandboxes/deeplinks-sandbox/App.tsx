/**
 * @DEV: If the sandbox is throwing dependency errors, chances are you need to clear your browser history.
 * This will trigger a re-install of the dependencies in the sandbox – which should fix things right up.
 * Alternatively, you can fork this sandbox to refresh the dependencies manually.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { Connection, PublicKey } from '@solana/web3.js';
import nacl from "tweetnacl";
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
} from './utils';

import { DeeplinkState, TLog } from './types';

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
      if (deepLinkState.phantomWalletPublicKey !== undefined) setPhantomWalletPublicKey(deepLinkState.phantomWalletPublicKey);
      if (deepLinkState.dappPubkey !== undefined) setDappPubkey(deepLinkState.dappPubkey);
      if (deepLinkState.dappSecretkey !== undefined) setDappSecretkey(deepLinkState.dappSecretkey);
    },
    [setSharedSecret, setSession, setPhantomWalletPublicKey, setDappPubkey, setDappSecretkey]
  );

  const resetDeeplinkState = useCallback(
    () => {
      setSharedSecret(null);
      setSession(null);
      setPhantomWalletPublicKey(null);
      setDappPubkey(null);
      setDappSecretkey(null);
      setLogs([]);
    },
    [setSharedSecret, setSession, setPhantomWalletPublicKey, setDappPubkey, setDappSecretkey]
  );

  const createLog = useCallback(
    (log: TLog) => {
      return setLogs((logs) => [...logs, log]);;
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
    const handleDeepLink = () => {
      const url = new URL(window.location.href);
      const params = url.searchParams;
      if (params.get("errorCode")) {
        createLog({
          status: 'error',
          message: JSON.stringify(Object.fromEntries([...params]), null, 2),
        });
        return;
      }

      const path = url.hash.substring(1);
      if (path.startsWith("onConnect")) {
        const sharedSecretDapp = nacl.box.before(
          bs58.decode(params.get("phantom_encryption_public_key")),
          dappSecretkey
        );

        try {
          const connectData = decryptPayload(
            params.get("data"),
            params.get("nonce"),
            sharedSecretDapp
          );
  
          setLocalStorage({
            sharedSecret: bs58.encode(sharedSecretDapp),
            session: connectData.session,
            phantomWalletPublicKey: connectData.public_key
          });
          setDeeplinkState({
            sharedSecret: sharedSecretDapp,
            session: connectData.session,
            phantomWalletPublicKey: new PublicKey(connectData.public_key),
          });
  
          createLog({
            status: 'info',
            message: JSON.stringify(connectData, null, 2),
          });
        } catch (error) {
          createLog({
            status: 'error',
            message: JSON.stringify(error, null, 2),
          });
        }
      } else if (path.startsWith("onDisconnect")) {
        removeLocalStorage();
        resetDeeplinkState();

        createLog({
          status: 'info',
          message: "Disconnected!",
        });
      } else if (path.startsWith("onSignAndSendTransaction")) {
        try {
          const signAndSendTransactionData = decryptPayload(
            params.get("data"),
            params.get("nonce"),
            sharedSecret
          );
  
          createLog({
            status: 'info',
            message: JSON.stringify(signAndSendTransactionData, null, 2),
          });
        } catch (error) {
          createLog({
            status: 'error',
            message: JSON.stringify(error, null, 2),
          });
        }
      } else if (path.startsWith("onSignAllTransactions")) {
        try {
          const signAllTransactionsData = decryptPayload(
            params.get("data"),
            params.get("nonce"),
            sharedSecret
          );
  
          createLog({
            status: 'info',
            message: JSON.stringify(signAllTransactionsData, null, 2),
          });
        } catch (error) {
          createLog({
            status: 'error',
            message: JSON.stringify(error, null, 2),
          });
        }
      } else if (path.startsWith("onSignTransaction")) {
        try {
          const signTransactionData = decryptPayload(
            params.get("data"),
            params.get("nonce"),
            sharedSecret
          );
  
          createLog({
            status: 'info',
            message: JSON.stringify(signTransactionData, null, 2),
          });
        } catch (error) {
          createLog({
            status: 'error',
            message: JSON.stringify(error, null, 2),
          });
        }
      } else if (path.startsWith("onSignMessage")) {
        try {
          const signMessageData = decryptPayload(
            params.get("data"),
            params.get("nonce"),
            sharedSecret
          );
  
          createLog({
            status: 'info',
            message: JSON.stringify(signMessageData, null, 2),
          });
        } catch (error) {
          createLog({
            status: 'error',
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
    })
    const dappEncryptionPubkey = bs58.encode(kp.publicKey);
    setLocalStorage({dappPubkey: dappEncryptionPubkey, dappSecretkey: bs58.encode(kp.secretKey)});
    const params = new URLSearchParams({
      dapp_encryption_public_key: dappEncryptionPubkey,
      cluster: "mainnet-beta",
      app_url: "https://phantom.app",
      redirect_link: `${url.protocol}//${url.hostname}${url.pathname}#onConnect`,
    });

    createLog({
      status: 'info',
      message: 'Connecting..',
    });

    window.location.href = buildUrl("connect", params);
  }, [createLog, setDeeplinkState]);

  const handleDisconnect = useCallback(async () => {
    const url = new URL(window.location.href);
    resetDeeplinkState();
    removeLocalStorage();
    clearLogs();

    createLog({
      status: 'info',
      message: "Disconnected!",
    });
    window.location.href = `${url.protocol}//${url.hostname}${url.pathname}`;
  }, [resetDeeplinkState, clearLogs, createLog]);

  const handleSignAndSendTransaction = useCallback(async () => {
    const transaction = await createTransferTransaction(phantomWalletPublicKey, connection, createLog);
    const params = signAndSendTransaction(transaction, session, sharedSecret, dappPubkey);
    window.location.href = buildUrl("signAndSendTransaction", params);
  }, [phantomWalletPublicKey, connection, createLog, session, sharedSecret, dappPubkey]);

  const handleSignAllTransactions = useCallback(async () => {
    const transactions = await Promise.all([
      createTransferTransaction(phantomWalletPublicKey, connection, createLog, 100),
      createTransferTransaction(phantomWalletPublicKey, connection, createLog, 101),
      createTransferTransaction(phantomWalletPublicKey, connection, createLog, 102)
    ]);
    const params = signAllTransactions(transactions, session, sharedSecret, dappPubkey);
    window.location.href = buildUrl("signAllTransactions", params);
  }, [phantomWalletPublicKey, connection, createLog, session, sharedSecret, dappPubkey]);

  const handleSignTransaction = useCallback(async () => {
    const transaction = await createTransferTransaction(phantomWalletPublicKey, connection, createLog);
    const params = signTransaction(transaction, session, sharedSecret, dappPubkey);
    window.location.href = buildUrl("signTransaction", params);
  }, [phantomWalletPublicKey, connection, createLog, session, sharedSecret, dappPubkey]);

  const handleSignMessage = useCallback(async () => {
    const message = "To avoid digital dognappers, sign below to authenticate with CryptoCorgis.";
    const params = signMessage(message, session, sharedSecret, dappPubkey);
    window.location.href = buildUrl("signMessage", params);
  }, [session, sharedSecret, dappPubkey]);

  const handleBrowseDeeplink = useCallback(async () => {
    const url = new URL(window.location.href);
    const encodedUrl = encodeURIComponent(`${url.protocol}//${url.hostname}`);
    const encodedRef = encodeURIComponent(`${url.protocol}//${url.hostname}${url.pathname}`);
    window.location.href = `https://phantom.app/ul/browse/${encodedUrl}?ref=${encodedRef}`;
  }, []);

  const connectedMethods = useMemo(() => {
    return [
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
    handleSignAndSendTransaction,
    handleSignTransaction,
    handleSignAllTransactions,
    handleSignMessage,
    handleBrowseDeeplink,
  ]);

  return {
    publicKey: phantomWalletPublicKey || null,
    connectedMethods,
    handleConnect,
    handleBrowseDeeplink,
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
        handleBrowseDeeplink={handleBrowseDeeplink}
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
