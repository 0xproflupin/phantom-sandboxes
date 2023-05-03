import { SignInData } from '../types';

const createSignInData = async (address: string): Promise<SignInData> => {
  const now: Date = new Date();
  const uri = window.location.href
  const currentUrl = new URL(uri);
  const domain = currentUrl.hostname.replace(/^www\./, '');

  // Convert the Date object to a string
  const currentDateTime = now.toISOString();
  const signInData: SignInData = {
    domain,
    address,
    statement: "Sign-in to connect!",
    uri,
    version: "1",
    nonce: "oBbLoEldZs",
    chain: "mainnet",
    issuedAt: currentDateTime,
    resources: ["https://example.com", "https://phantom.app/"]
  };

  return signInData;
};

export default createSignInData;