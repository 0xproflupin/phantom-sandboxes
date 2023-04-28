/**
 * @DEV: If the sandbox is throwing dependency errors, chances are you need to clear your browser history.
 * This will trigger a re-install of the dependencies in the sandbox – which should fix things right up.
 * Alternatively, you can fork this sandbox to refresh the dependencies manually.
 */
import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import '@rainbow-me/rainbowkit/styles.css';
import { connectorsForWallets, RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { phantomWallet, injectedWallet } from '@rainbow-me/rainbowkit/wallets'
import { configureChains, createClient, goerli, WagmiConfig, useAccount, useSignMessage } from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';

import { getProvider, sendTransaction } from './utils';

import { TLog, Web3Provider } from './types';

import { Logs, Sidebar } from './components';

// =============================================================================
// Rainbowkit Configuration
// =============================================================================
// initalize which chains your dapp will use, and set up a provider
const { chains, provider } = configureChains(
  [goerli],
  [publicProvider()]
)
const connectors = connectorsForWallets([
  {
    groupName: 'The Best',
    wallets: [
      phantomWallet({ chains }),
      injectedWallet({ chains })
    ]
  }
])

const wagmiClient = createClient({
  connectors,
  provider
})

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
const sleep = (timeInMS) => new Promise((resolve) => setTimeout(resolve, timeInMS));

// =============================================================================
// Typedefs
// =============================================================================

export type ConnectedMethods =
  | {
      name: string;
      onClick:() => void;
    }
  | {
      name: string;
      onClick: () => Promise<void>;
    };

interface Props {
  address: string | null;
  connectedMethods: ConnectedMethods[];
  provider: Web3Provider;
  logs: TLog[];
  clearLogs: () => void;
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

  useEffect(() => {
    (async () => {
      // sleep for 100 ms to give time to inject
      await sleep(100);
      setProvider(getProvider());
    })();
  }, []);

  // Log when the user connects and disconnects
  const { address } = useAccount({
    onConnect({ address }) {
      createLog({
        status: 'success',
        method: 'connect',
        message: `Connected to app with account ${address}}`
      })
    },
    onDisconnect() {
      createLog({
        status: 'warning',
        method: 'disconnect',
        message: 'user disconnected wallet',
      });
    }
  })

  /** eth_sendTransaction */
  const handleEthSendTransaction = useCallback(async () => {
    if (!provider) return;

    try {
      // send the transaction up to the network
      const transaction = await sendTransaction(provider);
      createLog({
        status: 'info',
        method: 'eth_sendTransaction',
        message: `Sending transaction: ${JSON.stringify(transaction)}`,
      });
      try {
        // wait for the transaction to be included in the next block
        const txReceipt = await transaction.wait(1); // 1 is number of blocks to be confirmed before returning the receipt
        createLog({
          status: 'success',
          method: 'eth_sendTransaction',
          message: `TX included: ${JSON.stringify(txReceipt)}`,
          confirmation: {
            signature: `${JSON.stringify(txReceipt)}`,
            link: `https://etherscan.io/tx/${JSON.stringify(txReceipt)}`,
          },
        });
      } catch (error) {
        // log out if the tx didn't get included for some reason
        createLog({
          status: 'error',
          method: 'eth_sendTransaction',
          message: `Failed to include transaction on the chain: ${error.message}`,
        });
      }
    } catch (error) {
      createLog({
        status: 'error',
        method: 'eth_sendTransaction',
        message: error.message,
      });
    }
  }, [provider, createLog]);

  /** SignMessage */
// This is where the error is happening
  const { data, isError, isLoading, isSuccess, signMessage } = useSignMessage({ 
    message,
    onSettled(data, error) {
      if(error) {
        createLog({
          status: 'error',
          method: 'signMessage',
          message: error.message,
        })
        return
      }
      createLog({
        status: 'success',
        method: 'signMessage',
        message: `Message signed: ${data}`,
      }); 
    }
  })

  const connectedMethods = 
    [
      {
        name: 'Send Transaction',
        onClick: handleEthSendTransaction,
      },
      {
        name: 'Sign Message',
        onClick: () => signMessage(),
      },
    ];

  return {
    address,
    connectedMethods,
    provider,
    logs,
    clearLogs,
  };
};

// =============================================================================
// Stateless Component
// =============================================================================

const StatelessApp = React.memo((props: Props) => {
  const { connectedMethods, logs, clearLogs, address } = props;

  return (
    
    <StyledApp>
      <Sidebar address={address} connectedMethods={connectedMethods} />
      <Logs address={address} logs={logs} clearLogs={clearLogs} />
    </StyledApp>
      
  );
});

// =============================================================================
// Main Component
// =============================================================================

const App = () => {
  const props = useProps();

  return (
    <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider chains={chains} theme={darkTheme()}>
        <StatelessApp {...props} />
      </RainbowKitProvider>
    </WagmiConfig>
  )
};

export default App;
