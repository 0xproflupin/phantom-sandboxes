/**
 * Signs a message
 * @param   {PhantomProvider} provider a Phantom Provider
 * @param   {String}          message  a message to sign
 * @returns {Any}                      TODO(get type)
 */
const signMessage = async (message: string, signMsg): Promise<string> => {
  try {
    const encodedMessage = new TextEncoder().encode(message);
    const signedMessage = await signMsg(encodedMessage);
    return signedMessage;
  } catch (error) {
    console.warn(error);
    throw new Error(error.message);
  }
};

export default signMessage;
