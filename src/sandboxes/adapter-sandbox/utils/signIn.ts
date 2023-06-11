import { SolanaSignInInput, SolanaSignInOutput } from "@solana/wallet-standard-features";

/**
 * Signs a message
 * @param   {PhantomProvider} provider a Phantom Provider
 * @param   {String}          message  a message to sign
 * @returns {Any}                      TODO(get type)
 */
const signIn = async (signInData: SolanaSignInInput, signInMethod): Promise<SolanaSignInOutput> => {
  try {
    const { account, signedMessage, signature } = await signInMethod(signInData);
    return { account, signedMessage, signature };
  } catch (error) {
    console.warn(error);
    throw new Error(error.message);
  }
};

export default signIn;
