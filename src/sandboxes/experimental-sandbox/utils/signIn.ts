import { PhantomProvider, SignInData } from '../types';
import { PublicKey } from '@solana/web3.js';
import base58 from "bs58";

/**
 * Signs a message
 * @param   {PhantomProvider} provider a Phantom Provider
 * @param   {String}          message  a message to sign
 * @returns {Any}                      TODO(get type)
 */
const signIn = async (provider: PhantomProvider, signInData: SignInData): Promise<{
  address: PublicKey,
  signedMessage: Uint8Array,
  signature: string
}> => {
  try {
    const { address, signedMessage, signature } = await provider.signIn(signInData);
    return { address, signedMessage, signature: base58.encode(signature) };
  } catch (error) {
    console.warn(error);
    throw new Error(error.message);
  }
};

export default signIn;
