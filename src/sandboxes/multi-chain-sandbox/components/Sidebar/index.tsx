import React from 'react';
import styled from 'styled-components';
import { NavLink } from 'react-router-dom';

import { DARK_GRAY, GRAY, PURPLE, REACT_GRAY, WHITE } from '../../constants';
import { hexToRGB } from '../../utils';
import Button from '../Button';
import { ConnectedAccounts, ConnectedMethods } from '../../App';
import { SupportedChainIcons, SupportedChainNames, SupportedEVMChainIds } from '../../types';

// =============================================================================
// Styled Components
// =============================================================================

const Main = styled.main`
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 20px;
  align-items: center;
  background-color: ${REACT_GRAY};
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  max-height: 100vh;
  > * {
    margin-bottom: 10px;
  }
  @media (max-width: 768px) {
    width: 100%;
    height: auto;
  }
`;

const Body = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  button {
    margin-bottom: 15px;
  }
`;

const Link = styled.a.attrs({
  href: 'https://phantom.app/',
  target: '_blank',
  rel: 'noopener noreferrer',
})`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-decoration: none;
  margin-bottom: 30px;
  padding: 5px;
  &:focus-visible {
    outline: 2px solid ${hexToRGB(GRAY, 0.5)};
    border-radius: 6px;
  }
`;

const Pre = styled.pre`
  margin-bottom: 5px;
  margin-right: auto;
`;

const AccountRow = styled.div`
  display: flex;
  margin-bottom: 8px;

  :last-of-type {
    margin-bottom: 0;
  }
`;

const Badge = styled.div`
  margin: 0;
  padding: 10px;
  width: 100%;
  color: ${PURPLE};
  background-color: ${hexToRGB(PURPLE, 0.2)};
  font-size: 14px;
  border-radius: 0 6px 6px 0;
  @media (max-width: 400px) {
    width: 280px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  @media (max-width: 320px) {
    width: 220px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  ::selection {
    color: ${WHITE};
    background-color: ${hexToRGB(PURPLE, 0.5)};
  }

  ::-moz-selection {
    color: ${WHITE};
    background-color: ${hexToRGB(PURPLE, 0.5)};
  }
`;

const Divider = styled.div`
  border: 1px solid ${DARK_GRAY};
  height: 1px;
  margin: 20px 0;
`;

const Tag = styled.p`
  text-align: center;
  color: ${GRAY};

  a {
    color: ${PURPLE};
    text-decoration: none;

    ::selection {
      color: ${WHITE};
      background-color: ${hexToRGB(PURPLE, 0.5)};
    }

    ::-moz-selection {
      color: ${WHITE};
      background-color: ${hexToRGB(PURPLE, 0.5)};
    }
  }

  @media (max-width: 320px) {
    font-size: 14px;
  }

  ::selection {
    color: ${WHITE};
    background-color: ${hexToRGB(PURPLE, 0.5)};
  }

  ::-moz-selection {
    color: ${WHITE};
    background-color: ${hexToRGB(PURPLE, 0.5)};
  }
`;

const ChainIcon = styled.img`
  height: ${(props) => props.height};
  width: ${(props) => props.height};
  border-radius: 6px 0 0 6px;
`;

const ChainHeader = styled.div`
  display: flex;
  width: 100%;
  justify-content: flex-start;
  align-items: center;
  margin: 5px 0 10px;
`;

const NavigationLink = styled(NavLink)`
  display: block;
  color: ${GRAY};
  text-decoration: none;
  margin-bottom: 5px;
  font-size: 14px;
  padding: 8px;
  width: 100%;
  background-color: ${hexToRGB(PURPLE, 0.2)};
  border-radius: 6px;
  box-sizing: border-box;
  text-align: center;

  &.active {
    font-weight: bold;
    color: ${PURPLE};
  }

  &:hover {
    color: ${PURPLE};
  }
`;

const NetworkSelectButton = styled.button`
  display: block;
  color: ${GRAY};
  text-decoration: none;
  margin-bottom: 5px;
  font-size: 14px;
  padding: 8px 12px;
  width: 200px;
  background-color: ${hexToRGB(PURPLE, 0.2)};
  border: none;
  border-radius: 6px;
  text-align: center;
  cursor: pointer;

  &.active {
    font-weight: bold;
    color: ${PURPLE};
  }

  &:hover {
    color: ${PURPLE};
  }

  &.selected {
    color: ${PURPLE};
  }
`;

const MenuButton = styled.button`
  margin-bottom: 30px;
  padding: 8px 12px;
  width: 200px;
  background-color: ${PURPLE};
  color: ${WHITE};
  border: none;
  border-radius: 6px;
  cursor: pointer;
  &:hover {
    background-color: ${hexToRGB(PURPLE, 0.8)};
  }
`;

const ToggleLogsButton = styled(Button)`
  margin-bottom: 10px;
  padding: 8px 10px;
  width: 200px;
  background-color: ${GRAY};
  color: ${WHITE};
  border: none;
  border-radius: 6px;
  cursor: pointer;
  &:hover {
    background-color: ${hexToRGB(GRAY, 0.8)};
  }
`;

const MenuContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 15px;
  width: 200px;
`;

const Menu = styled.div``;

// =============================================================================
// Typedefs
// =============================================================================

interface Props {
  connectedMethods: ConnectedMethods[];
  connectedEthereumChainId: SupportedEVMChainIds | null;
  connectedAccounts: ConnectedAccounts;
  connect: () => Promise<void>;
  logsVisibility: boolean;
  toggleLogs: () => void;
}

// =============================================================================
// Main Component
// =============================================================================
const Sidebar = React.memo((props: Props) => {
  const { connectedAccounts, connectedMethods, connect, logsVisibility, toggleLogs } = props;
  const [sandboxMenuOpen, setSandboxMenuOpen] = React.useState(false);

  const toggleSandboxMenu = () => {
    setSandboxMenuOpen(!sandboxMenuOpen);
  };
  return (
    <Main>
      <Body>
        <Menu>
          <MenuButton onClick={toggleSandboxMenu}>Multichain Sandbox {sandboxMenuOpen ? '-' : '\u2630'}</MenuButton>
          {sandboxMenuOpen && (
            <MenuContainer>
              <NavigationLink to="/sol-sandbox">Solana Sandbox</NavigationLink>
              <NavigationLink to="/eth-sandbox">Ethereum Sandbox</NavigationLink>
              <NavigationLink to="/multi-chain-sandbox">Multi-Chain Sandbox</NavigationLink>
              <NavigationLink to="/sol-adapter-sandbox">Solana Adapter Sandbox</NavigationLink>
              <NavigationLink to="/rainbowkit-sandbox">Rainbowkit Sandbox</NavigationLink>
              <NavigationLink to="/wagmi-sandbox">Wagmi Sandbox</NavigationLink>
              <NavigationLink to="/web3-react-v6-sandbox">Web3 React V6 Sandbox</NavigationLink>
              <NavigationLink to="/web3-react-v8-sandbox">Web3 React V8 Sandbox</NavigationLink>
              <NavigationLink to="/experimental-sandbox">Experimental Sandbox</NavigationLink>
            </MenuContainer>
          )}
        </Menu>
        <Menu>
          <MenuContainer>
            <ToggleLogsButton onClick={toggleLogs}>{`${
              logsVisibility === true ? 'Hide' : 'Show'
            } Logs`}</ToggleLogsButton>
            <NetworkSelectButton className="selected">Ethereum Goerli Testnet</NetworkSelectButton>
            <NetworkSelectButton className="selected">Polygon Mainnet</NetworkSelectButton>
            <NetworkSelectButton className="selected">Solana Devnet</NetworkSelectButton>
          </MenuContainer>
        </Menu>
        <Link>
          <img src="/images/phantom-icon-purple.png" alt="Phantom" width="75" />
        </Link>
        {connectedAccounts?.solana ? (
          // connected
          <>
            <div>
              <Pre>Connected as</Pre>
              <AccountRow>
                <ChainIcon src={SupportedChainIcons.Ethereum} height="36px" />
                <Badge>{connectedAccounts?.ethereum}</Badge>
              </AccountRow>
              <AccountRow>
                <ChainIcon src={SupportedChainIcons.Polygon} height="36px" />
                <Badge>{connectedAccounts?.ethereum}</Badge>
              </AccountRow>
              <AccountRow>
                <ChainIcon src={SupportedChainIcons.Solana} height="36px" />
                <Badge>{connectedAccounts?.solana?.toBase58()}</Badge>
              </AccountRow>
              <Divider />
            </div>
            <ChainHeader>
              <ChainIcon
                src={SupportedChainIcons.Ethereum}
                height="16px"
                style={{ marginRight: '6px', borderRadius: '6px' }}
              />
              <Tag>{SupportedChainNames.EthereumGoerli}</Tag>
            </ChainHeader>
            {connectedMethods
              .filter((method) => method.chain === 'ethereum')
              .map((method, i) => (
                <Button
                  data-test-id={`ethereum-goerli-${method.name}`}
                  key={`${method.name}-${i}`}
                  onClick={() => method.onClick(SupportedEVMChainIds.EthereumGoerli)}
                >
                  {method.name}
                </Button>
              ))}
            <ChainHeader>
              <ChainIcon
                src={SupportedChainIcons.Polygon}
                height="16px"
                style={{ marginRight: '6px', borderRadius: '6px' }}
              />
              <Tag>{SupportedChainNames.PolygonMainnet}</Tag>
            </ChainHeader>
            {connectedMethods
              .filter((method) => method.chain === 'ethereum')
              .map((method, i) => (
                <Button
                  data-test-id={`polygon-mainnet-${method.name}`}
                  key={`${method.name}-${i}`}
                  onClick={() => method.onClick(SupportedEVMChainIds.PolygonMainnet)}
                >
                  {method.name}
                </Button>
              ))}
            <ChainHeader>
              <ChainIcon
                src={SupportedChainIcons.Solana}
                height="16px"
                style={{ marginRight: '6px', borderRadius: '6px' }}
              />
              <Tag>{SupportedChainNames.SolanaDevnet}</Tag>
            </ChainHeader>
            {connectedMethods
              .filter((method) => method.chain === 'solana')
              .map((method, i) => (
                <Button data-test-id={`solana-${method.name}`} key={`${method.name}-${i}`} onClick={method.onClick}>
                  {method.name}
                </Button>
              ))}
          </>
        ) : (
          // not connected
          <Button data-testid="connect-to-phantom" onClick={connect} style={{ marginTop: '15px' }}>
            Connect to Phantom
          </Button>
        )}
      </Body>
      {/* 😊 💕  */}
      <Tag>
        Made with{' '}
        <span role="img" aria-label="Red Heart Emoji">
          ❤️
        </span>{' '}
        by the <a href="https://phantom.app">Phantom</a> team
      </Tag>
    </Main>
  );
});

export default Sidebar;
