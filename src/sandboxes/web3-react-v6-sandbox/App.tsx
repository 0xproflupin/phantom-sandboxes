/**
 * @DEV: If the sandbox is throwing dependency errors, chances are you need to clear your browser history.
 * This will trigger a re-install of the dependencies in the sandbox – which should fix things right up.
 * Alternatively, you can fork this sandbox to refresh the dependencies manually.
 */
import React, { useState, useCallback } from 'react';
import styled from 'styled-components';

import { TLog } from './types';
import { Logs, Sidebar } from './components';

import { useWeb3React, Web3ReactProvider } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { PhantomConnector } from 'web3-react-v6-phantom';
import { Signer } from 'ethers';
import { parseUnits } from 'ethers/lib/utils';

const phantom = new PhantomConnector({
  supportedChainIds: [1, 5],
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

const message = 'To avoid digital dognappers, sign below to authenticate with CryptoCorgis.';
const tx = {
  to: '0x0000000000000000000000000000000000000000',
  value: parseUnits('1', 'wei'),
  chainId: 0x5, // Goerli network
};
// =============================================================================
// Typedefs
// =============================================================================

export type SidebarMethods =
  | {
      name: string;
      onClick: () => Promise<string>;
    }
  | {
      name: string;
      onClick: () => Promise<void>;
    }
  | {
      name: string;
      onClick: () => void;
    };

interface Props {
  logs: TLog[];
  clearLogs: () => void;
  createLog: (log: TLog) => void;
  logsVisibility: boolean;
  toggleLogs: () => void;
}

// =============================================================================
// Hooks
// =============================================================================

const useProps = (): Props => {
  const [logs, setLogs] = useState<TLog[]>([]);
  const [logsVisibility, setLogsVisibility] = useState<boolean>(false);

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
    logs,
    createLog,
    clearLogs,
    logsVisibility,
    toggleLogs,
  };
};

// =============================================================================
// Stateless Component
// =============================================================================

const StatelessApp = React.memo((props: Props) => {
  const { logs, clearLogs, createLog, logsVisibility, toggleLogs } = props;
  const { library, activate, deactivate } = useWeb3React();

  const handleDisconnect = () => {
    try {
      deactivate();
      createLog({
        status: 'warning',
        method: 'disconnect',
        message: 'User disconnected wallet',
      });
    } catch (e) {
      createLog({
        status: 'error',
        method: 'disconnect',
        message: e.message,
      });
      console.error(e);
    }
  };

  const handleSignMessage = async () => {
    try {
      const signer = await library.getSigner();
      const sig = await signer.signMessage(message);
      createLog({
        status: 'success',
        method: 'signMessage',
        message: `Message signed: ${sig}`,
      });
    } catch (e) {
      createLog({
        status: 'error',
        method: 'signMessage',
        message: e.message,
      });
    }
  };

  const handleConnect = async () => {
    try {
      await activate(phantom);
      createLog({
        status: 'success',
        method: 'connect',
        message: `Connected to app!`,
      });
    } catch (e) {
      createLog({
        status: 'error',
        method: 'connect',
        message: e.message,
      });
    }
  };

  const handleTransaction = async () => {
    try {
      const signer: Signer = await library.getSigner();
      const pendingHash = await signer.sendTransaction(tx);
      createLog({
        status: 'info',
        method: 'eth_sendTransaction',
        message: `Sending TX: ${pendingHash.hash}`,
      });
      createLog({
        status: 'info',
        method: 'eth_sendTransaction',
        message: `Pending....this could take up to 30 seconds`,
      });
      const finalizedHash = await pendingHash.wait(1);
      createLog({
        status: 'success',
        method: 'eth_sendTransaction',
        message: `Successfully burned 1 wei of ETH ${finalizedHash.blockHash}`,
      });
    } catch (e) {
      createLog({
        status: 'error',
        method: 'eth_sendTransaction',
        message: e.message,
      });
    }
  };

  const connectedMethods = [
    {
      name: 'Deactivate',
      onClick: handleDisconnect,
    },
    {
      name: 'Sign Message',
      onClick: handleSignMessage,
    },
    {
      name: 'Send Transaction (Burn 1 wei on Goerli)',
      onClick: handleTransaction,
    },
  ];
  const unConnectedMethods = [
    {
      name: 'Connect To Phantom',
      onClick: handleConnect,
    },
  ];

  return (
    <StyledApp>
      <Sidebar
        unConnectedMethods={unConnectedMethods}
        connectedMethods={connectedMethods}
        logsVisibility={logsVisibility}
        toggleLogs={toggleLogs}
      />
      {logsVisibility && <Logs logs={logs} clearLogs={clearLogs} />}
    </StyledApp>
  );
});

// =============================================================================
// Main Component
// =============================================================================

const App = () => {
  const props = useProps();

  function getLibrary(provider: any): Web3Provider {
    const library = new Web3Provider(provider);
    library.pollingInterval = 12000;
    return library;
  }

  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <StatelessApp {...props} />;
    </Web3ReactProvider>
  );
};

export default App;
