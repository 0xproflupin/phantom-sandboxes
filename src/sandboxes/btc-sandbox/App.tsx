import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TLog } from './types';
import { Sidebar } from './components';
import styled from 'styled-components';
import getProvider from './utils/getProvider';

const StyledApp = styled.div`
  display: flex;
  flex-direction: row;
  height: 100vh;
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const sleep = (timeInMS) => new Promise((resolve) => setTimeout(resolve, timeInMS));

interface Props {
  handleConnect: () => void;
  logs: TLog[];
}

const useProps = () => {
  const [provider, setProvider] = useState(null);
  const [logs, setLogs] = useState<TLog[]>([]);

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
        message: 'Failed to connect to account',
        method: 'connect',
      });
    }
  }, [createLog, provider]);

  return {
    logs,
    handleConnect,
  };
};

const StatelessApp = React.memo((props: Props) => {
  const { logs, handleConnect } = useProps();

  return (
    <StyledApp>
      <Sidebar connect={handleConnect} />
    </StyledApp>
  );
});

const App = () => {
  const props = useProps();
  return <StatelessApp {...props} />;
};

export default App;
