// contract.js
import { BrowserProvider, Contract, JsonRpcProvider } from 'ethers';
import contractABI from './contract/SupplyChainData.json';

export const contractAddress = '0x8136868E58e8F15B0B80BA6E573A3Fe6C149A978';
const RPC = 'https://api.harmony.one';

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
