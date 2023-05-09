import {
  Ethereum,
  InjectedConnectorOptions,
  getClient,
  Address,
  ConnectorNotFoundError,
  ResourceUnavailableError,
  RpcError,
  UserRejectedRequestError,
  InjectedConnector
} from '@wagmi/core';
import { Chain } from 'wagmi';
import { getAddress } from 'ethers/lib/utils.js';

export class PhantomConnector extends InjectedConnector {
  readonly id = 'phantom';
  readonly ready = typeof window != 'undefined' && !!this.#findProvider(window?.phantom?.ethereum);

  #provider?: Window['phantom']['ethereum'];

  constructor({ chains, options: options_ }: { chains?: Chain[]; options?: InjectedConnectorOptions } = {}) {
    const options = {
      name: 'Phantom',
      shimDisconnect: true,
      getProvider() {
        function getReady(ethereum?: Ethereum) {
          const isPhantom = !!ethereum.isPhantom
          if (!isPhantom) return
          return ethereum
        }
        if(typeof window === 'undefined') return
        const ethereum = window.phantom.ethereum as Ethereum | undefined
        if (ethereum?.providers) return ethereum.providers.find(getReady)
        return getReady(ethereum)
      },
      ...options_,
    }
    super({ chains, options });
  }

  async getProvider() {
    if (typeof window !== 'undefined') {
      this.#provider = this.#findProvider(window.phantom.ethereum);
    }
    return this.#provider;
  }

  #getReady(ethereum?: Ethereum) {
    if (!ethereum?.isPhantom) return;
    return ethereum;
  }

  #findProvider(ethereum?: Ethereum) {
    if (ethereum?.providers) return ethereum.providers.find(this.#getReady);
    return this.#getReady(ethereum);
  }
  async connect({ chainId }: { chainId?: number } = {}) {
    try {
      const provider = await this.getProvider();
      if (!provider) throw new ConnectorNotFoundError();

      if (provider.on) {
        provider.on('accountsChanged', this.onAccountsChanged);
        provider.on('chainChanged', this.onChainChanged);
        provider.on('disconnect', this.onDisconnect);
      }

      this.emit('message', { type: 'connecting' });

      let account: Address | null = null;

      if (!account) {
        const accounts = await provider.request({
          method: 'eth_requestAccounts',
        });
        account = getAddress(accounts[0] as string);
      }

      // Switch to chain if provided
      let id = await this.getChainId();
      let unsupported = this.isChainUnsupported(id);
      if (chainId && id !== chainId) {
        const chain = await this.switchChain(chainId);
        id = chain.id;
        unsupported = this.isChainUnsupported(id);
      }

      if (this.options?.shimDisconnect) getClient().storage?.setItem(this.shimDisconnectKey, true);

      return { account, chain: { id, unsupported }, provider };
    } catch (error) {
      if (this.isUserRejectedRequestError(error)) throw new UserRejectedRequestError(error);
      if ((error as RpcError).code === -32002) throw new ResourceUnavailableError(error);
      throw error;
    }
  }
  protected onAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) this.emit('disconnect')
    else
      this.emit('change', {
        account: getAddress(accounts[0] as string),
      })
  }
}
