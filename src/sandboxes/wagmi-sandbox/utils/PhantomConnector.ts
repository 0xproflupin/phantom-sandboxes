import {
    ConnectorNotFoundError,
    ResourceUnavailableError,
    UserRejectedRequestError,
    getClient,
    Ethereum,
    InjectedConnector,
    InjectedConnectorOptions
  } from '@wagmi/core'
  import type { Address, RpcError } from '@wagmi/core'
  import type { Chain } from '@wagmi/core/chains'
  import { getAddress } from 'ethers/lib/utils.js'
  
  export class PhantomConnector extends InjectedConnector {
    readonly id = 'phantom'
  
    protected shimDisconnectKey = `${this.id}.shimDisconnect`
  
  
    constructor({
      chains,
      options: options_,
    }: {
      chains?: Chain[]
      options?: InjectedConnectorOptions
    } = {}) {
      const options = {
        name: 'Phantom',
        shimDisconnect: true,
        getProvider() {
          function getReady(ethereum?: Ethereum) {
            const isPhantom = !!ethereum?.isPhantom
            if (!isPhantom) return
            return ethereum
          }
  
          if (typeof window === 'undefined') return
          const ethereum = window.phantom.ethereum as Ethereum | undefined
          if (ethereum?.providers) return ethereum.providers.find(getReady)
          return getReady(ethereum)
        },
        ...options_,
      }
      super({ chains, options })
    }
  
    async connect({ chainId }: { chainId?: number } = {}) {
      try {
        const provider = await this.getProvider()
        if (!provider) throw new ConnectorNotFoundError()
  
        if (provider.on) {
          provider.on('accountsChanged', this.onAccountsChanged)
          provider.on('chainChanged', this.onChainChanged)
          provider.on('disconnect', this.onDisconnect)
        }
  
        this.emit('message', { type: 'connecting' })
  
        // Attempt to show wallet select prompt with `wallet_requestPermissions` when
        // `shimDisconnect` is active and account is in disconnected state (flag in storage)
        let account: Address | null = null
        if (
          this.options?.shimDisconnect &&
          !getClient().storage?.getItem(this.shimDisconnectKey)
        ) {
          account = await this.getAccount().catch(() => null)
          const isConnected = !!account
          if (isConnected)
            // Attempt to show another prompt for selecting wallet if already connected
            try {
              await provider.request({
                method: 'wallet_requestPermissions',
                params: [{ eth_accounts: {} }],
              })
              // User may have selected a different account so we will need to revalidate here.
              account = await this.getAccount()
            } catch (error) {
              if (this.isUserRejectedRequestError(error))
                throw new UserRejectedRequestError(error)
              if (
                (error as ResourceUnavailableError).code ===
                new ResourceUnavailableError(error).code
              )
                throw error
            }
        }
  
        if (!account) {
          const accounts = await provider.request({
            method: 'eth_requestAccounts',
          })
          account = getAddress(accounts[0] as string)
        }
  
        // Switch to chain if provided
        let id = await this.getChainId()
        let unsupported = this.isChainUnsupported(id)
        if (chainId && id !== chainId) {
          const chain = await this.switchChain(chainId)
          id = chain.id
          unsupported = this.isChainUnsupported(id)
        }
  
        if (this.options?.shimDisconnect)
          getClient().storage?.setItem(this.shimDisconnectKey, true)
  
        return { account, chain: { id, unsupported }, provider }
      } catch (error) {
        if (this.isUserRejectedRequestError(error))
          throw new UserRejectedRequestError(error)
        if ((error as RpcError).code === -32002)
          throw new ResourceUnavailableError(error)
        throw error
      }
    }
  }