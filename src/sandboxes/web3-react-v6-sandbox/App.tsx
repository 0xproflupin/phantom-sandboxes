/**
 * @DEV: If the sandbox is throwing dependency errors, chances are you need to clear your browser history.
 * This will trigger a re-install of the dependencies in the sandbox – which should fix things right up.
 * Alternatively, you can fork this sandbox to refresh the dependencies manually.
 */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import styled from 'styled-components';

import { getProvider, sendTransaction } from './utils';

import { TLog } from './types';

import { Logs, Sidebar } from './components';

import { useWeb3React, Web3ReactProvider } from '@web3-react/core'
import { InjectedConnector } from "@web3-react/injected-connector"
import { Web3Provider } from '@ethersproject/providers'
// import { PhantomConnector } from "web3-react-v6-phantom"
import { PhantomConnector } from "./PhantomConnector"

const injected = new InjectedConnector({
  supportedChainIds: [1]
});

const phantom = new PhantomConnector({
  supportedChainIds: [1]
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

declare global {
  interface Window {
    ethereum: any
  }
}
let accounts = [];
const message = 'To avoid digital dognappers, sign below to authenticate with CryptoCorgis.';
const sleep = (timeInMS) => new Promise((resolve) => setTimeout(resolve, timeInMS));

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
      onClick: () => void;
    };

interface Props {
  // connectedMethods: ConnectedMethods[];
  logs: TLog[];
  clearLogs: () => void;
  createLog: (log: TLog) => void;
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * @DEVELOPERS
 * The fun stuff!
 */
const useProps = (): Props => {
  const [provider, setProvider] = useState<Web3Provider | null>(null);
  const [logs, setLogs] = useState<TLog[]>([]);

  const createLog = useCallback(
    (log: TLog) => {
      return setLogs((logs) => [...logs, log]);
    },
    [setLogs]
  );

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, [setLogs]);

  return {
    logs,
    createLog,
    clearLogs,
  };
};

// =============================================================================
// Stateless Component
// =============================================================================

const StatelessApp = React.memo((props: Props) => {
  const { logs, clearLogs, createLog } = props;
  const { active, library, activate, account } = useWeb3React();
  let prevAccount = useRef(account)
  useEffect(() => {
    // createLog({
      // status: 'success',
      // method: 'connect',
      // message: `Connected to app with account: ${account}}`,
    // });
  prevAccount.current = account
  }, [account, createLog])

  // console.log(active, library, activate);

  const handleConnect = () => {
    try {
      activate(phantom)
      createLog({
        status: 'success',
        method: 'connect',
        message: `Connected to app`,
      });
    } catch(e) {
      createLog({
        status: 'error',
        method: 'connect',
        message: e.message,
      });
    }
  }

  const handleDisconnect = () => {
    try {
      phantom.deactivate();
      createLog({
        status: 'warning',
        method: 'disconnect',
        message: 'user disconnected wallet',
      });
    } catch(e) {
      createLog({
        status: 'error',
        method: 'disconnect',
        message: e.message,
      });
      console.error(e);
    }
  }

  const handleSignMessage = async () => {
    try {
      const signer = await library.getSigner();
      const sig = await signer.signMessage(message);
      createLog({
        status: 'success',
        method: 'signMessage',
        message: `Message signed: ${sig}`,
      });
    } catch(e) {
      createLog({
        status: 'error',
        method: 'signMessage',
        message: e.message,
      });
    }
  };

  const connectedMethods =
     [
      {
        name: 'Connect',
        onClick: handleConnect,
      },
      {
        name: 'Deactivate',
        onClick: handleDisconnect,
      },
      {
        name: "Sign Message",
        onClick: handleSignMessage
      }
    ];

  return (
    
    <StyledApp>
      <Sidebar connectedMethods={connectedMethods} />
      <Logs logs={logs} clearLogs={clearLogs} />
    </StyledApp>
      
  );
});

// =============================================================================
// Main Component
// =============================================================================

const App = () => {
  const props = useProps();

  function getLibrary(provider: any): Web3Provider {
    const library = new Web3Provider(provider)
    library.pollingInterval = 12000
    return library
  }
  

  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <StatelessApp {...props} />;
    </Web3ReactProvider>
  )
};

export default App;
