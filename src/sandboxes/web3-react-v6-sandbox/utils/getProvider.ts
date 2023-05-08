import { Web3Provider } from "@ethersproject/providers";
import { providers } from "ethers";
/**
 * Retrieves the Phantom Provider from the window object
 * @returns {Web3Provider | void} a Phantom provider if one exists in the window
 */
const getProvider = (): Web3Provider | undefined => {
  if ('phantom' in window) {
    const anyWindow: any = window;
    const ethereum = anyWindow.ethereum
    const provider = new providers.Web3Provider(ethereum)

    if (provider) {
      return provider;
    }
  }

  window.open('https://phantom.app/', '_blank');
};

export default getProvider;
