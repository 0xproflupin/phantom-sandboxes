/**
 * @DEV: If the sandbox is throwing dependency errors, chances are you need to clear your browser history.
 * This will trigger a re-install of the dependencies in the sandbox – which should fix things right up.
 * Alternatively, you can fork this sandbox to refresh the dependencies manually.
 */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import styled from 'styled-components';
import '@rainbow-me/rainbowkit/styles.css';
import { connectorsForWallets, RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { phantomWallet, injectedWallet } from '@rainbow-me/rainbowkit/wallets';
import {
  configureChains,
  createConfig,
  WagmiConfig,
  useAccount,
  useSignMessage,
  useSendTransaction,
  usePrepareSendTransaction,
} from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';
import { goerli } from 'wagmi/chains';
import { parseGwei } from 'viem';

import { TLog } from './types';
import { Logs, Sidebar } from './components';
// =============================================================================
// Rainbowkit Configuration
// =============================================================================
// initalize which chains your dapp will use, and set up a provider
const { chains, publicClient } = configureChains([goerli], [publicProvider()]);
const connectors = connectorsForWallets([
  {
    groupName: 'The Best',
    wallets: [phantomWallet({ chains }), injectedWallet({ chains })],
  },
]);

const config = createConfig({
  publicClient,
  connectors,
});

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

const MESSAGE = 'To avoid digital dognappers, sign below to authenticate with CryptoCorgis.';
//0x0000...000 common for burning ETH
// =============================================================================
// Typedefs
// =============================================================================

export type ConnectedMethods =
  | {
      name: string;
      onClick: () => void;
    }
  | {
      name: string;
      onClick: () => Promise<void>;
    };

interface Props {
  // address: string | null;
  // connectedMethods: ConnectedMethods[];
  logs: TLog[];
  clearLogs: () => void;
  createLog: (log: TLog) => void;
  logsVisibility: boolean;
  toggleLogs: () => void;
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * @DEVELOPERS
 * The fun stuff!
 */
const useProps = (): Props => {
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
    setLogsVisibility((logsVisibility) => !logsVisibility);
  };

  return {
    createLog,
    logs,
    clearLogs,
    logsVisibility,
    toggleLogs,
  };
};

// =============================================================================
// Stateless Component
// =============================================================================

const Stateless = React.memo((props: Props) => {
  const { createLog, logs, clearLogs, logsVisibility, toggleLogs } = props;
  const { address, status } = useAccount();

  let prevStatus = useRef(status);
  useEffect(() => {
    switch (status) {
      case 'disconnected':
        if (prevStatus.current === 'disconnected') break;
        createLog({
          status: 'warning',
          method: 'disconnect',
          message: 'user disconnected wallet',
        });
        break;
      case 'connected':
        createLog({
          status: 'success',
          method: 'connect',
          message: `Connected to app with account ${address}}`,
        });
        break;
      case 'connecting':
        createLog({
          status: 'info',
          method: 'connect',
          message: 'user connecting...',
        });
        break;
    }
    prevStatus.current = status;
  }, [createLog, address, status]);

  const { signMessage } = useSignMessage({
    message: MESSAGE,
    onSettled(data, error) {
      if (error) {
        createLog({
          status: 'error',
          method: 'signMessage',
          message: error.message,
        });
        return;
      }
      createLog({
        status: 'success',
        method: 'signMessage',
        message: `Message signed: ${data}`,
      });
    },
  });

  const { config } = usePrepareSendTransaction({
    to: '0x0000000000000000000000000000000000000000', // Common for burning ETH
    value: parseGwei('1', 'wei'),
  });
  const { sendTransaction } = useSendTransaction({
    ...config,
    onSettled(data, error) {
      if (error) {
        createLog({
          status: 'error',
          method: 'eth_sendTransaction',
          message: `Error occurred: ${error.message}`,
        });
        return;
      }
      createLog({
        status: 'success',
        method: 'eth_sendTransaction',
        message: `Transaction success: ${data.hash}`,
      });
    },
  });

  const connectedMethods = useMemo(() => {
    return [
      {
        name: 'Sign Message',
        onClick: () => signMessage(),
      },
      {
        name: 'Send Transaction (burn 1 wei on Goerli)',
        onClick: () => sendTransaction?.(),
      },
    ];
  }, [signMessage, sendTransaction]);

  return (
    <StyledApp>
      <Sidebar
        address={address}
        connectedMethods={connectedMethods}
        logsVisibility={logsVisibility}
        toggleLogs={toggleLogs}
      />
      {logsVisibility && <Logs address={address} logs={logs} clearLogs={clearLogs} />}
    </StyledApp>
  );
});

// =============================================================================
// Main Component
// =============================================================================

const App = () => {
  const props = useProps();

  return (
    <WagmiConfig config={config}>
      <RainbowKitProvider chains={chains} theme={darkTheme()}>
        <Stateless {...props} />
      </RainbowKitProvider>
    </WagmiConfig>
  );
};

export default App;
