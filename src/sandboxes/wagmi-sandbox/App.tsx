/**
 * @DEV: If the sandbox is throwing dependency errors, chances are you need to clear your browser history.
 * This will trigger a re-install of the dependencies in the sandbox – which should fix things right up.
 * Alternatively, you can fork this sandbox to refresh the dependencies manually.
 */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import styled from 'styled-components';
import {
  configureChains,
  createConfig,
  WagmiConfig,
  useAccount,
  useSignMessage,
  useSendTransaction,
  usePrepareSendTransaction,
  useDisconnect,
} from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';
import { goerli } from 'wagmi/chains';

import { TLog } from './types';

import { Logs, Sidebar } from './components';
import { parseGwei } from 'viem';
import { PhantomConnector } from 'phantom-wagmi-connector';

// =============================================================================
// wagmi configuration
// =============================================================================
const { publicClient, webSocketPublicClient, chains } = configureChains([goerli], [publicProvider()]);

const wagmiConfig = createConfig({
  publicClient,
  webSocketPublicClient,
  connectors: [new PhantomConnector({ chains })],
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
    setLogsVisibility(!logsVisibility);
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
        if (status === prevStatus.current) break;
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

  const { disconnect } = useDisconnect();

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
      {
        name: 'Disconnect',
        onClick: () => disconnect(),
      },
    ];
  }, [signMessage, sendTransaction, disconnect]);

  return (
    <StyledApp>
      <Sidebar connectedMethods={connectedMethods} logsVisibility={logsVisibility} toggleLogs={toggleLogs} />
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
    <WagmiConfig config={wagmiConfig}>
      <Stateless {...props} />
    </WagmiConfig>
  );
};

export default App;
