import { SignInData } from '../types';

const createSignInData = async (): Promise<SignInData> => {
  const signInData: SignInData = {
    domain: "https://example.com",
    address: "Fn9A5Ge92QkwrYAASFv5R7nh9VMve9ssERPfhaNPF3Lj",
    statement: "Sign-in to connect!",
    uri: "https://example.com",
    version: "1",
    nonce: "1",
    chain: "mainnet",
    issuedAt: "2021-09-30T16:25:24Z",
  };

  return signInData;
};

export default createSignInData;