import { SignInData } from '../types';

const createSignInData = async (address: string): Promise<SignInData> => {
  const now: Date = new Date();

  // Convert the Date object to a string
  const currentDateTime = now.toString();
  const signInData: SignInData = {
    domain: "phantom-sandboxes.vercel.app",
    address,
    statement: "Sign-in to connect!",
    uri: "https://phantom-sandboxes.vercel.app/",
    version: "1",
    nonce: "oBbLoEldZs",
    chain: "mainnet",
    issuedAt: currentDateTime,
    // resources: ["https://example.com", "https://phantom.app/"]
  };

  return signInData;
};

export default createSignInData;