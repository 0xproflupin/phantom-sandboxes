import { PhantomEthereumProvider } from '../types';
import numToHexString from './numToHexString';
import { getEthereumSelectedAddress } from './getEthereumSelectedAddress';

/**
 * Sends a transaction of 1 wei to yourself
 * @param provider a Phantom ethereum provider
 * @returns a transaction hash
 */
const sendTransactionOnEthereum = async (provider: PhantomEthereumProvider): Promise<string> => {
  try {
    const selectedAddress = await getEthereumSelectedAddress(provider);
    /**
     * Required parameters for a simple transfer of 1 wei
     * Phantom will automatically handle nonce & chainId.
     * gasPrice will be handled by Phantom and customizable by end users during confirmation
     */
    const transactionParameters = {
      from: selectedAddress, // must match user's active address
      to: selectedAddress, // required except during contract publications
      gas: numToHexString(30000), // the max amount of gas to be used in the tx
      value: numToHexString(1), // only required when transferring ether. in this case, send 1 wei
    };

    const txHash = await provider.request({
      method: 'eth_sendTransaction',
      params: [transactionParameters],
    });
    if (typeof txHash === 'string') return txHash;
    throw new Error('did not get back a transaction hash');
  } catch (error) {
    console.warn(error);
    throw new Error(error.message);
  }
};

export default sendTransactionOnEthereum;
