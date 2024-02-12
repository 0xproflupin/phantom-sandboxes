import React, { useState, useEffect, useCallback } from 'react';
import { TLog } from './types';
import { Logs, Sidebar } from './components';
import styled from 'styled-components';
import { getProvider } from './utils';

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

const sleep = (timeInMS) => new Promise((resolve) => setTimeout(resolve, timeInMS));

interface Props {
  handleConnect: () => Promise<void>;
  logsVisibility: boolean;
  logs: TLog[];
}

const useProps = () => {
  const [provider, setProvider] = useState(null);
  const [logs, setLogs] = useState<TLog[]>([]);
  const [logsVisibility, setLogsVisibility] = useState(false);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, [setLogs]);

  const toggleLogs = () => {
    setLogsVisibility(!logsVisibility);
  };

  const createLog = useCallback(
    (log: TLog) => {
      setLogs((logs) => [log, ...logs]);
    },
    [setLogs]
  );

  useEffect(() => {
    (async () => {
      await sleep(100);
      setProvider(getProvider());
    })();
  }, []);

  useEffect(() => {
    if (!provider) return;

    provider.on('connect', () => {
      const fetchData = async () => {
        const accounts = await provider.requestAccounts();
      };

      fetchData();
      createLog({ status: 'success', message: 'Connected to account ${public', method: 'connect' });
    });
  });

  const handleConnect = useCallback(async () => {
    if (!provider) return;

    try {
      const accounts = await provider.requestAccounts();
      console.log(accounts);
    } catch (error) {
      createLog({
        status: 'error',
        message: 'Failed to connect to bitcoin accounts',
        method: error.message,
      });
    }
  }, [createLog, provider]);

  return {
    clearLogs,
    handleConnect,
    logs,
    logsVisibility,
    toggleLogs,
  };
};

// =============================================================================
// Stateless Component
// =============================================================================

const StatelessApp = React.memo((props: Props) => {
  const { clearLogs, logs, handleConnect, logsVisibility, toggleLogs } = useProps();

  return (
    <StyledApp>
      <Sidebar connect={handleConnect} logsVisibility={logsVisibility} toggleLogs={toggleLogs} />
      {logsVisibility && <Logs logs={logs} clearLogs={clearLogs} />}
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
