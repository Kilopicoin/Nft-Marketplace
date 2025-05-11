// contract.js
import { BrowserProvider, Contract, JsonRpcProvider } from 'ethers';
import contractABI from './contract/SupplyChainData.json';

const contractAddress = '0x5d7d487d9487779E51B9C249b5C0E7252D4db8e6';
const RPC = 'https://api.s0.b.hmny.io';

export const getContract = () => {
  const provider = new JsonRpcProvider(RPC);
  return new Contract(contractAddress, contractABI.abi, provider); // Burada .abi ekledik
};

export const getSignerContract = async () => {
  if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new Contract(contractAddress, contractABI.abi, signer); // Burada da .abi ekledik
  } else {
    throw new Error('Ethereum wallet is not installed');
  }
};


export default getContract;
