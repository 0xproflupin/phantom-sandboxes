/**
 * @DEV: If the sandbox is throwing dependency errors, chances are you need to clear your browser history.
 * This will trigger a re-install of the dependencies in the sandbox – which should fix things right up.
 * Alternatively, you can fork this sandbox to refresh the dependencies manually.
 */
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { useWallet, useConnection, WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';

import {
  createAddressLookupTable,
  // createSignInData,
  createTransferTransaction,
  createTransferTransactionV0,
  extendAddressLookupTable,
  pollSignatureStatus,
  signAllTransactions,
  signAndSendTransaction,
  signAndSendTransactionV0WithLookupTable,
  signMessage,
  // signIn,
  signTransaction,
} from './utils';

import { TLog } from './types';

import { Logs, Sidebar, AutoConnectProvider } from './components';

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

const message = 'To avoid digital dognappers, sign below to authenticate with CryptoCorgis.';

const getConnectionUrl = (network: WalletAdapterNetwork): string => {
  switch (network) {
    case WalletAdapterNetwork.Devnet:
      // NB: This URL will only work for Phantom sandbox apps! Please do not use this for your project.
      return `https://rpc-devnet.helius.xyz/?api-key=${process.env.REACT_APP_HELIUS_API}`;
    case WalletAdapterNetwork.Mainnet:
      // NB: This URL will only work for Phantom sandbox apps! Please do not use this for your project.
      return `https://rpc.helius.xyz/?api-key=${process.env.REACT_APP_HELIUS_API}`;
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

const StatelessApp = ({ network, setNetwork }) => {
  const {
    wallet,
    publicKey,
    connect,
    disconnect,
    signMessage: signMsg,
    signTransaction: signTx,
    signAllTransactions: signAllTx,
    sendTransaction: sendTx,
  } = useWallet();
  const { connection } = useConnection();
  const [logs, setLogs] = useState<TLog[]>([]);
  const [logsVisibility, setLogsVisibility] = useState(false);

  const createLog = useCallback(
    (log: TLog) => {
      return setLogs((logs) => [...logs, log]);
    },
    [setLogs]
  );

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, [setLogs]);

  const toggleLogs = () => {
    setLogsVisibility(!logsVisibility);
  };

  useEffect(() => {
    if (!publicKey || !wallet) return;

    createLog({
      status: 'success',
      method: 'connect',
      message: `Connected to account ${publicKey.toBase58()}`,
    });
  }, [createLog, publicKey, wallet]);

  /** SignAndSendTransaction */
  const handleSignAndSendTransaction = useCallback(async () => {
    if (!publicKey || !wallet) return;

    try {
      const transaction = await createTransferTransaction(publicKey, connection);
      createLog({
        status: 'info',
        method: 'signAndSendTransaction',
        message: `Requesting signature for: ${JSON.stringify(transaction)}`,
      });
      const signature = await signAndSendTransaction(transaction, connection, sendTx);
      createLog({
        status: 'info',
        method: 'signAndSendTransaction',
        message: `Signed and submitted transaction ${signature}.`,
      });
      pollSignatureStatus(signature, connection, createLog);
    } catch (error) {
      createLog({
        status: 'error',
        method: 'signAndSendTransaction',
        message: error.message,
      });
    }
  }, [connection, createLog, publicKey, sendTx, wallet]);

  /** SignAndSendTransactionV0 */
  const handleSignAndSendTransactionV0 = useCallback(async () => {
    if (!publicKey || !wallet) return;

    try {
      const transactionV0 = await createTransferTransactionV0(publicKey, connection);
      createLog({
        status: 'info',
        method: 'signAndSendTransactionV0',
        message: `Requesting signature for: ${JSON.stringify(transactionV0)}`,
      });
      const signature = await signAndSendTransaction(transactionV0, connection, sendTx);
      createLog({
        status: 'info',
        method: 'signAndSendTransactionV0',
        message: `Signed and submitted transactionV0 ${signature}.`,
      });
      pollSignatureStatus(signature, connection, createLog);
    } catch (error) {
      createLog({
        status: 'error',
        method: 'signAndSendTransactionV0',
        message: error.message,
      });
    }
  }, [connection, createLog, publicKey, sendTx, wallet]);

  /** SignAndSendTransactionV0WithLookupTable */
  const handleSignAndSendTransactionV0WithLookupTable = useCallback(async () => {
    if (!publicKey || !wallet) return;
    try {
      const [lookupSignature, lookupTableAddress] = await createAddressLookupTable(
        publicKey,
        connection,
        sendTx,
        await connection.getLatestBlockhash().then((res) => res.blockhash)
      );
      createLog({
        status: 'info',
        method: 'signAndSendTransactionV0WithLookupTable',
        message: `Signed and submitted transactionV0 to make an Address Lookup Table ${lookupTableAddress} with signature: ${lookupSignature}. Please wait for 5-7 seconds after signing the next transaction to be able to see the next transaction popup. This time is needed as newly appended addresses require one slot to warmup before being available to transactions for lookups.`,
      });
      pollSignatureStatus(lookupSignature, connection, createLog);
      const extensionSignature = await extendAddressLookupTable(
        publicKey,
        connection,
        await connection.getLatestBlockhash().then((res) => res.blockhash),
        lookupTableAddress,
        sendTx
      );
      createLog({
        status: 'info',
        method: 'signAndSendTransactionV0WithLookupTable',
        message: `Signed and submitted transactionV0 to extend Address Lookup Table ${extensionSignature}.`,
      });
      pollSignatureStatus(extensionSignature, connection, createLog);
      const signature = await signAndSendTransactionV0WithLookupTable(
        publicKey,
        connection,
        await connection.getLatestBlockhash().then((res) => res.blockhash),
        lookupTableAddress,
        sendTx
      );
      createLog({
        status: 'info',
        method: 'signAndSendTransactionV0WithLookupTable',
        message: `Signed and submitted transactionV0 with Address Lookup Table ${signature}.`,
      });
      pollSignatureStatus(signature, connection, createLog);
    } catch (error) {
      createLog({
        status: 'error',
        method: 'signAndSendTransactionV0WithLookupTable',
        message: error.message,
      });
    }
  }, [connection, createLog, publicKey, sendTx, wallet]);

  /** SignTransaction */
  const handleSignTransaction = useCallback(async () => {
    if (!publicKey || !wallet) return;

    try {
      const transaction = await createTransferTransaction(publicKey, connection);
      createLog({
        status: 'info',
        method: 'signTransaction',
        message: `Requesting signature for: ${JSON.stringify(transaction)}`,
      });
      const signedTransaction = await signTransaction(transaction, signTx);
      createLog({
        status: 'success',
        method: 'signTransaction',
        message: `Transaction signed: ${JSON.stringify(signedTransaction)}`,
      });
    } catch (error) {
      createLog({
        status: 'error',
        method: 'signTransaction',
        message: error.message,
      });
    }
  }, [connection, createLog, publicKey, signTx, wallet]);

  /** SignAllTransactions */
  const handleSignAllTransactions = useCallback(async () => {
    if (!publicKey || !wallet) return;

    try {
      const transactions = [
        await createTransferTransaction(publicKey, connection),
        await createTransferTransaction(publicKey, connection),
      ];
      createLog({
        status: 'info',
        method: 'signAllTransactions',
        message: `Requesting signature for: ${JSON.stringify(transactions)}`,
      });
      const signedTransactions = await signAllTransactions(transactions[0], transactions[1], signAllTx);
      createLog({
        status: 'success',
        method: 'signAllTransactions',
        message: `Transactions signed: ${JSON.stringify(signedTransactions)}`,
      });
    } catch (error) {
      createLog({
        status: 'error',
        method: 'signAllTransactions',
        message: error.message,
      });
    }
  }, [connection, createLog, publicKey, signAllTx, wallet]);

  /** SignMessage */
  const handleSignMessage = useCallback(async () => {
    if (!publicKey || !wallet) return;

    try {
      const signedMessage = await signMessage(message, signMsg);
      createLog({
        status: 'success',
        method: 'signMessage',
        message: `Message signed: ${JSON.stringify(signedMessage)}`,
      });
      return signedMessage;
    } catch (error) {
      createLog({
        status: 'error',
        method: 'signMessage',
        message: error.message,
      });
    }
  }, [createLog, publicKey, signMsg, wallet]);

  // Coming soon!
  // /** SignIn */
  // const handleSignIn = useCallback(async () => {
  //   if (!publicKey || !wallet) return;
  //   const signInData = await createSignInData();

  //   try {
  //     const {account, signedMessage, signature} = await signIn(provider, signInData);
  //     const message = new TextDecoder().decode(signedMessage);
  //     createLog({
  //       status: 'success',
  //       method: 'signIn',
  //       message: `Message signed: ${message} by ${address} with signature ${signature}`,
  //     });
  //   } catch (error) {
  //     createLog({
  //       status: 'error',
  //       method: 'signIn',
  //       message: error.message,
  //     });
  //   }
  // }, [createLog, provider]);

  // /** SignInError */
  // const handleSignInError = useCallback(async () => {
  //   if (!provider) return;
  //   const signInData = await createSignInErrorData(provider.publicKey.toString());

  //   try {
  //     const {address, signedMessage, signature} = await signIn(provider, signInData);
  //     createLog({
  //       status: 'success',
  //       method: 'signMessage',
  //       message: `Message signed: ${JSON.stringify(signedMessage)} by ${address} with signature ${signature}`,
  //     });
  //   } catch (error) {
  //     createLog({
  //       status: 'error',
  //       method: 'signIn',
  //       message: error.message,
  //     });
  //   }
  // }, [createLog, provider]);

  /** Connect */
  const handleConnect = useCallback(async () => {
    if (!publicKey || !wallet) return;

    try {
      await connect();
    } catch (error) {
      createLog({
        status: 'error',
        method: 'connect',
        message: error.message,
      });
    }
  }, [connect, createLog, publicKey, wallet]);

  /** Disconnect */
  const handleDisconnect = useCallback(async () => {
    if (!publicKey || !wallet) return;

    try {
      await disconnect();
      createLog({
        status: 'warning',
        method: 'disconnect',
        message: '👋',
      });
    } catch (error) {
      createLog({
        status: 'error',
        method: 'disconnect',
        message: error.message,
      });
    }
  }, [createLog, disconnect, publicKey, wallet]);

  const connectedMethods = useMemo(() => {
    return [
      {
        name: 'Sign and Send Transaction (Legacy)',
        onClick: handleSignAndSendTransaction,
      },
      {
        name: 'Sign and Send Transaction (v0)',
        onClick: handleSignAndSendTransactionV0,
      },
      {
        name: 'Sign and Send Transaction (v0 + Lookup table)',
        onClick: handleSignAndSendTransactionV0WithLookupTable,
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
        name: 'Disconnect',
        onClick: handleDisconnect,
      },
    ];
  }, [
    handleSignAndSendTransaction,
    handleSignAndSendTransactionV0,
    handleSignAndSendTransactionV0WithLookupTable,
    handleSignTransaction,
    handleSignAllTransactions,
    handleSignMessage,
    handleDisconnect,
  ]);

  return (
    <StyledApp>
      <Sidebar
        publicKey={publicKey}
        connectedMethods={connectedMethods}
        connect={handleConnect}
        network={network}
        setNetwork={setNetwork}
        logsVisibility={logsVisibility}
        toggleLogs={toggleLogs}
      />
      {logsVisibility && <Logs publicKey={publicKey} logs={logs} clearLogs={clearLogs} />}
    </StyledApp>
  );
};

// =============================================================================
// Main Component
// =============================================================================
const App = () => {
  const [network, setNetwork] = useState(WalletAdapterNetwork.Devnet);

  const endpoint = getConnectionUrl(network);

  const wallets = useMemo(
    () => [], // confirmed also with `() => []` for wallet-standard only
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [network]
  );

  return (
    <AutoConnectProvider>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <StatelessApp network={network} setNetwork={setNetwork} />
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </AutoConnectProvider>
  );
};

export default App;
