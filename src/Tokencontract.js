// contract.js
import { BrowserProvider, Contract, JsonRpcProvider } from 'ethers';
import TokencontractABI from './contract/TokencontractABI.json';

const TokencontractAddress = '0x09e6E20FF399c2134C14232E172ce8ba2b03017E';
const RPC = 'https://api.harmony.one';

const getTokenContract = async () => {
  const provider = new JsonRpcProvider(RPC);
  return new Contract(TokencontractAddress, TokencontractABI.abi, provider);
};

export const getTokenSignerContract = async () => {
  if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new Contract(TokencontractAddress, TokencontractABI.abi, signer);
  } else {
    throw new Error('Ethereum wallet is not installed');
  }
};

export default getTokenContract;
