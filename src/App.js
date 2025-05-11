/* global BigInt */
import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { getContract, getSignerContract, contractAddress } from './contract';
import './App.css';
import { getTokenSignerContract } from './Tokencontract';

// React Icons
import {
  FaCube, FaPlus, FaStore, FaSearch, FaUser, FaFolderOpen
} from 'react-icons/fa';

// Toastify
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


function App() {
  // --------------------------------------------------
  // 1) State
  // --------------------------------------------------
  const [view, setView] = useState('createNFT');
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  // We remove the old states for feedback; we will use toast messages:
  // const [errorMessage, setErrorMessage] = useState(null);
  // const [successMessage, setSuccessMessage] = useState(null);

  // CREATE SINGLE NFT
  const [nftName, setNftName] = useState('');
  const [nftDesc, setNftDesc] = useState('');
  const [nftUrl, setNftUrl] = useState('');
  const [royaltyRate, setRoyaltyRate] = useState('');
  const [mainCategory, setMainCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');

  // SINGLE NFT MARKET
  const [listTokenId, setListTokenId] = useState('');
  const [price, setPrice] = useState('');
  const [marketItems, setMarketItems] = useState([]);
  const [selectedNftDetails, setSelectedNftDetails] = useState(null);
  const [showListingForm, setShowListingForm] = useState(false);

  // MARKET FILTER
  const [marketFilterCategory, setMarketFilterCategory] = useState('All');
  const [subCategoryFilter, setSubCategoryFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('priceAsc');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRoyalty, setMinRoyalty] = useState('');
  const [maxRoyalty, setMaxRoyalty] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [nftMetaUrl, setNftMetaUrl] = useState('');

  const [showMyNfts, setShowMyNfts] = useState(false);
const [showMyCollections, setShowMyCollections] = useState(false);

// Constants
const LIST_NFT_PRICE = (1000 * 10 ** 6).toString();
const LIST_COLLECTION_PRICE = (10000 * 10 ** 6).toString();


  // SEARCH NFT
  const [dataTokenId, setDataTokenId] = useState('');
  const [nftData, setNftData] = useState(null);

  // PROFILE
  const [myNFTs, setMyNFTs] = useState([]);

  // CREATE COLLECTION
  const [collectionName, setCollectionName] = useState('');
  const [collectionDesc, setCollectionDesc] = useState('');
  const [collectionCoverUrl, setCollectionCoverUrl] = useState('');
  const [collectionSize, setCollectionSize] = useState(5);
  const [collectionNFTs, setCollectionNFTs] = useState([]);

  // COLLECTION MARKET
  const [allCollectionsMarket, setAllCollectionsMarket] = useState([]);
  const [showCollectionListingForm, setShowCollectionListingForm] = useState(false);
  const [collectionIdToList, setCollectionIdToList] = useState('');
  const [collectionNftPricesToList, setCollectionNftPricesToList] = useState([]);

  // PROFILE COLLECTION
  const [myCollections, setMyCollections] = useState([]);
  const [selectedCollectionDetail, setSelectedCollectionDetail] = useState(null);
  const [detailCollSeller, setDetailCollSeller] = useState(null);
  const [detailCollListed, setDetailCollListed] = useState(false);

  // --------------------------------------------------
  // Category data (example)
  // --------------------------------------------------
  const categoryData = {
    "Nature":        ["Animal", "Plant", "Landscape", "Ecology", "Green Energy"],
    "Technology":    ["AI", "Blockchain", "Robotics", "Space", "Mobile"],
    "Art":           ["Painting", "Sculpture", "Music", "Dance", "Literature"],
    "Sports":        ["Football", "Basketball", "Esports", "Athletics", "Motorcycle"],
    "Fashion":       ["Clothing", "Accessory", "Shoes", "Jewelry", "Runway"],
    "History":       ["Ancient", "Medieval", "Renaissance", "Ottoman", "Modern Age"],
    "Entertainment": ["Film", "Series", "Game", "Humor", "Cartoon"]
  };


  const shortenAddress = (addr) => {
  if (!addr) return '';
  return addr.slice(0, 6) + '...' + addr.slice(-4);
};



  // --------------------------------------------------
  // Theme
  // --------------------------------------------------
  useEffect(() => {
    if (darkMode) document.body.classList.add('dark-mode');
    else document.body.classList.remove('dark-mode');
  }, [darkMode]);

  const toggleTheme = () => setDarkMode((prev) => !prev);

  // --------------------------------------------------
  // Metamask changes
  // --------------------------------------------------
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        setAccount(accounts.length > 0 ? accounts[0] : null);
      });
    }
    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('accountsChanged', () => {});
      }
    };
  }, []);

  useEffect(() => {
  const checkIfWalletConnected = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        }
      } catch (err) {
        console.error("Wallet auto-connection check failed:", err);
      }
    }
  };

  checkIfWalletConnected();
}, []);


  // --------------------------------------------------
  // Helper: IPFS -> https
  // --------------------------------------------------
  const resolveImageUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  
  if (url.startsWith('ipfs://')) {
    const ipfsPath = url.slice(7);
    return ipfsPath ? `https://ipfs.io/ipfs/${ipfsPath}` : '';
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return url;
    }
    return '';
  } catch {
    return '';
  }
};



  // --------------------------------------------------
  // (A) Fetch Single NFT Market data
  // --------------------------------------------------
  const fetchListedItems = useCallback(async () => {
    try {
      setLoading(true);
      const c = getContract();
      const raw = await c.getAllListedItems();
      const itemsArray = Array.from(raw);

      const parsed = await Promise.all(itemsArray.map(async (it) => {
        const tokenId = it.tId.toString();
        const d = await c.getNFTData(tokenId);
        return {
          tokenId,
          seller: it.seller,
          price: it.price.toString(),
          isListed: it.listed,
          nftName: d[0],
          nftDescription: d[1],
          nftURL: resolveImageUrl(d[2]),
          nftCreator: d[3],
          nftRoyaltyRate: d[5]?.toString() || '0',
          mainCategory: d[6],
          subCategory: d[7],
          collId: d[8]
        };
      }));

      setMarketItems(parsed);
    } catch (err) {
      toast.error(`Unable to fetch list data: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // --------------------------------------------------
  // (B) Fetch single NFTs in my profile
  // --------------------------------------------------
  const fetchMyNFTs = useCallback(async () => {
    if (!account) return;
    try {
      setLoading(true);
      const c = getContract();
      const ids = await c.getOwnedTokenIds(account);
      const arr = [];
      for (const tid of ids) {
  const tokenId = tid.toString(); // ✅ Convert BigInt to string
  const d = await c.getNFTData(tokenId);
  arr.push({
  tokenId,
  name: d[0],
  description: d[1],
  url: resolveImageUrl(d[2]),
  metaUrl: d[3], // ✅ new
  creator: d[4],
  createdTime: new Date(Number(d[5]) * 1000).toLocaleString(),
  royaltyRate: d[6]?.toString() || '0',
  mainCategory: d[7],
  subCategory: d[8],
  collId: d[9],
  idx: d[10]
});

}

      setMyNFTs(arr);
    } catch (err) {
      console.error("Error fetching NFT data for tokenId:", err);
      toast.error(`Unable to fetch profile data: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  }, [account]);

  // --------------------------------------------------
  // (C) Fetch collections in my profile
  // --------------------------------------------------
  const fetchMyCollections = useCallback(async () => {
    if (!account) return;
    try {
      setLoading(true);
      const c = getContract();
      const foundCols = [];

      const totalCollections = await c.getCollectionCount();
      for (let i = 1; i <= totalCollections; i++) {
        let col;
        try {
          col = await c.getCollection(i);
        } catch {
          continue;
        }
        if (!col[0] || col[0].trim() === "") continue;
        const imgUrl = resolveImageUrl(col[2]);
        const tokenIds = col[5];
        let allOwned = true;

        for (const tId of tokenIds) {
          const ow = await c.ownerOf(tId);
          if (ow.toLowerCase() !== account.toLowerCase()) {
            allOwned = false;
            break;
          }
        }
        if (allOwned) {
          foundCols.push({
            collectionId: i.toString(),
            name: col[0],
            description: col[1],
            imageUrl: imgUrl,
            createdTime: new Date(Number(col[3]) * 1000).toLocaleString(),
            creator: col[4],
            tokenIds: col[5].map(x => x.toString())
          });
        }
      }
      setMyCollections(foundCols);
    } catch (err) {
      console.error("fetchMyCollections error:", err);
      toast.error(`Unable to fetch collection data: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  }, [account]);

  // --------------------------------------------------
  // (D) Fetch data for the Collection Market
  // --------------------------------------------------
  const fetchAllCollectionMarketItems = useCallback(async () => {
    try {
      setLoading(true);
      const c = getContract();
      const arr = await c.getAllCollectionMarketItems();
      const listedOnly = arr.filter(it => it.listed);
      const parsed = [];

      for (const it of listedOnly) {
        const cid = it.cId.toString();
        let col;
        try {
          col = await c.getCollection(cid);
        } catch {
          continue; 
        }
        if (!col[0] || col[0].trim() === "") continue;

        const imageUrl = resolveImageUrl(col[2]);
        parsed.push({
          collectionId: cid,
          seller: it.seller,
          price: it.price.toString(),
          isListed: it.listed,
          coverImage: imageUrl,
          collectionName: col[0]
        });
      }
      setAllCollectionsMarket(parsed);
    } catch (err) {
      toast.error(`Unable to fetch collection market data: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // --------------------------------------------------
  // Fetch data on view change
  // --------------------------------------------------
  useEffect(() => {
    if (view === 'market') {
      fetchListedItems();
      setSelectedNftDetails(null);
      setSelectedCollectionDetail(null);
    } else if (view === 'profile') {
      // fetchMyNFTs();
      // fetchMyCollections();
      setSelectedNftDetails(null);
      setSelectedCollectionDetail(null);
    } else if (view === 'collectionMarket') {
      fetchAllCollectionMarketItems();
      setSelectedNftDetails(null);
      setSelectedCollectionDetail(null);
    }
  }, [
    view,
    fetchListedItems,
    fetchMyNFTs,
    fetchMyCollections,
    fetchAllCollectionMarketItems
  ]);

  // --------------------------------------------------
  // Connect Wallet
  // --------------------------------------------------
  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error('Metamask is not installed!');
      return;
    }
    try {
      const sc = await getSignerContract();
      const signerAddr = await sc.runner.getAddress();
      setAccount(signerAddr);
      toast.success("Wallet connected!");
    } catch (err) {
      toast.error(`Failed to connect wallet: ${err.message || err}`);
    }
  };

  // --------------------------------------------------
  // Create a Single NFT
  // --------------------------------------------------
  const handleCreateNFT = async () => {
    try {
      setLoading(true);
      if (!mainCategory || !subCategory) {
        toast.error('Main/Sub category is required!');
        setLoading(false);
        return;
      }
      const rr = parseInt(royaltyRate) || 0;
      if (rr < 0 || rr > 100) {
        toast.error('Royalty must be between 0..100!');
        setLoading(false);
        return;
      }

      const sc = await getSignerContract();
      const tx = await sc.createNFT(
  nftName,
  nftDesc,
  nftUrl,
  nftMetaUrl, // 🟡 Add this
  rr,
  mainCategory,
  subCategory
);

      const receipt = await tx.wait();

      let mintedTokenId = null;
      for (const lg of receipt.logs) {
        if (lg.address.toLowerCase() === sc.target.toLowerCase()) {
          try {
            const parsedLog = sc.interface.parseLog({ data: lg.data, topics: lg.topics });
            if (parsedLog.name === 'Transfer') {
              mintedTokenId = parsedLog.args.tokenId.toString();
              break;
            }
          } catch {}
        }
      }

      toast.success(`NFT created! TokenID=${mintedTokenId || '??'}`);
      setNftName(''); setNftDesc(''); setNftUrl(''); setRoyaltyRate('');
      setMainCategory(''); setSubCategory('');
    } catch (err) {
      toast.error(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // Market Functions (Single NFT)
  // --------------------------------------------------
  const handleListNFT = async () => {
    if (!listTokenId || !price) {
    toast.error('Please enter Token ID and price!');
    return;
  }

  // Validate price is numeric
  if (isNaN(price) || Number(price) <= 0) {
    toast.error('Price must be a positive number');
    return;
  }
    try {
      setLoading(true);
      const c = getContract();
      const d = await c.getNFTData(listTokenId);
      const collId = d[9].toString();

      if (collId !== "0") {
        const priceOnColl = await c.getCollectionNftPrice(collId, listTokenId);
        if (priceOnColl > 0) {
          toast.error('This NFT is part of a listed (and unsold) collection, it cannot be listed individually!');
          setLoading(false);
          return;
        }
      }

      const tokenContractSigner = await getTokenSignerContract();
    const allowanceTx = await tokenContractSigner.increaseAllowance(contractAddress, LIST_NFT_PRICE);
    await allowanceTx.wait();

      const sc = await getSignerContract();
      const tx = await sc.listNFT(listTokenId, price * 10 ** 6);
      await tx.wait();

      toast.success(`NFT #${listTokenId} listed!`);
      setListTokenId('');
      setPrice('');
      setShowListingForm(false);
      await fetchListedItems();
    } catch (err) {
      toast.error(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNFT = async (tid, rawPrice) => {
  try {
    setLoading(true);

    const tokenContractSigner = await getTokenSignerContract();

    // Approve the market contract to spend the buyer's tokens
    const allowanceTx = await tokenContractSigner.increaseAllowance(contractAddress, rawPrice);
    await allowanceTx.wait();

    const sc = await getSignerContract();

    // Correct: Do NOT pass { value: rawPrice } – payment is via ERC-20
    const tx = await sc.buyNFT(tid);
    await tx.wait();

    toast.success(`NFT #${tid} purchased!`);
    await fetchListedItems();
    await fetchMyNFTs(); 
  } catch (err) {
    toast.error(err.message || String(err));
  } finally {
    setLoading(false);
  }
};


  const handleUnlist = async (tid) => {
    try {
      setLoading(true);
      const sc = await getSignerContract();
      const tx = await sc.unlistNFT(tid);
      await tx.wait();

      toast.success(`NFT #${tid} removed from listing!`);
      await fetchListedItems();
    } catch (err) {
      toast.error(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleShowDetails = async (tid) => {
    try {
      setLoading(true);
      setSelectedNftDetails(null);
      const c = getContract();
      const d = await c.getNFTData(tid);
      setSelectedNftDetails({
        tokenId: tid,
        name: d[0],
        description: d[1],
        url: resolveImageUrl(d[2]),
        metaUrl: d[3], 
        creator: d[4],
        createdTime: new Date(Number(d[5]) * 1000).toLocaleString(),
        royaltyRate: d[6]?.toString() || '0',
        mainCategory: d[7],
        subCategory: d[8],
        collId: d[9]?.toString()
      });



    } catch (err) {
      toast.error(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // Search NFT
  // --------------------------------------------------
  const handleGetNFTData = async () => {
    if (!dataTokenId) {
      toast.error('Please enter a Token ID!');
      return;
    }
    try {
      setLoading(true);
      const c = getContract();
      const d = await c.getNFTData(dataTokenId);
      setNftData({
        tokenId: dataTokenId,
        name: d[0],
        description: d[1],
        url: resolveImageUrl(d[2]),
        creator: d[3],
        createdTime: new Date(Number(d[4]) * 1000).toLocaleString(),
        royaltyRate: d[5]?.toString() || '0',
        mainCategory: d[6],
        subCategory: d[7],
        collId: d[8]?.toString()
      });
    } catch (err) {
      toast.error(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // Dynamic creation of form fields for the Collection
  // --------------------------------------------------
  useEffect(() => {
    const arr = [];
    for (let i = 0; i < collectionSize; i++) {
      arr.push({
        name: '',
        desc: '',
        url: '',
        royalty: '',
        mainCategory: '',
        subCategory: ''
      });
    }
    setCollectionNFTs(arr);
  }, [collectionSize]);

  // --------------------------------------------------
  // Create Collection
  // --------------------------------------------------
  const handleCreateCollection = async () => {
    try {
      setLoading(true);
      if (!collectionName.trim()) {
        toast.error('Please enter a collection name!');
        setLoading(false);
        return;
      }
      if (!collectionDesc.trim()) {
        toast.error('Please enter a collection description!');
        setLoading(false);
        return;
      }
      if (!collectionCoverUrl.trim()) {
        toast.error('Collection cover image cannot be empty!');
        setLoading(false);
        return;
      }
      for (let i = 0; i < collectionNFTs.length; i++) {
        const item = collectionNFTs[i];
        if (!item.name.trim()) {
          toast.error(`NFT #${i + 1} name cannot be empty!`);
          setLoading(false);
          return;
        }
        const rr = parseInt(item.royalty) || 0;
        if (rr < 0 || rr > 100) {
          toast.error(`NFT #${i + 1}: Royalty must be 0..100!`);
          setLoading(false);
          return;
        }
      }

      const n = collectionNFTs.map(x => x.name);
      const ds = collectionNFTs.map(x => x.desc);
      const us = collectionNFTs.map(x => x.url);
      const rs = collectionNFTs.map(x => parseInt(x.royalty) || 0);
      const mc = collectionNFTs.map(x => x.mainCategory);
      const sc = collectionNFTs.map(x => x.subCategory);

      const scn = await getSignerContract();
      const tx = await scn.createCollection(
        collectionName,
        collectionDesc,
        collectionCoverUrl,
        n, ds, us, rs, mc, sc
      );
      const receipt = await tx.wait();

      let newCID = null;
      for (const lg of receipt.logs) {
        if (lg.address.toLowerCase() === scn.target.toLowerCase()) {
          try {
            const ev = scn.interface.parseLog({ data: lg.data, topics: lg.topics });
            if (ev.name === 'CollectionCreated') {
              newCID = ev.args.cId.toString();
              break;
            }
          } catch {}
        }
      }

      toast.success(`Collection created! ID=${newCID || '??'}`);
      setCollectionName('');
      setCollectionDesc('');
      setCollectionCoverUrl('');
      setCollectionSize(5);
    } catch (err) {
      toast.error(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // COLLECTION MARKET Functions
  // --------------------------------------------------
  const handleFetchCollectionForListing = async () => {
    if (!collectionIdToList) {
      toast.error('Please enter Collection ID!');
      return;
    }
    try {
      setLoading(true);
      const c = getContract();
      const col = await c.getCollection(collectionIdToList);
      const tokenIds = col[5];
      if (tokenIds.length === 0) {
        toast.error('It looks like there are no NFTs in this collection.');
        setLoading(false);
        return;
      }
      const initPrices = tokenIds.map(() => '');
      setCollectionNftPricesToList(initPrices);

      toast.success(`Collection #${collectionIdToList} NFTs fetched. Now enter the prices.`);
    } catch (err) {
      toast.error(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleListCollectionWithMultiplePrices = async () => {
    if (!collectionIdToList) {
      toast.error('Please enter Collection ID!');
      return;
    }
    try {
      setLoading(true);
      const c = getContract();
      const col = await c.getCollection(collectionIdToList);
      const tokenIds = col[5];
      if (tokenIds.length !== collectionNftPricesToList.length) {
        toast.error('The number of prices does not match the number of NFTs!');
        setLoading(false);
        return;
      }

      const arrPrices = collectionNftPricesToList.map(p => parseInt(p || '0'));
      const signerC = await getSignerContract();
      const tx = await signerC.listCollection(collectionIdToList, arrPrices);
      await tx.wait();

      toast.success(`Collection #${collectionIdToList} listed!`);
      setCollectionIdToList('');
      setCollectionNftPricesToList([]);
      setShowCollectionListingForm(false);
      await fetchAllCollectionMarketItems();
    } catch (err) {
      toast.error(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleUnlistCollection = async (cid) => {
    try {
      setLoading(true);
      const scn = await getSignerContract();
      const tx = await scn.unlistCollection(cid);
      await tx.wait();

      toast.success(`Collection #${cid} removed from listing!`);
      await fetchAllCollectionMarketItems();
      if (selectedCollectionDetail && selectedCollectionDetail.collectionId === cid.toString()) {
        setDetailCollListed(false);
      }
    } catch (err) {
      toast.error(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleBuyCollection = async (cid, rawPrice) => {
    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const bal = await provider.getBalance(await signer.getAddress());
      const priceBN = BigInt(rawPrice || '0');
      if (bal < priceBN) {
        toast.error('Insufficient balance!');
        setLoading(false);
        return;
      }

      const scn = new ethers.Contract(
        getContract().target,
        getContract().interface.fragments,
        signer
      );
      const tx = await scn.buyCollection(cid, { value: rawPrice });
      await tx.wait();

      toast.success(`Collection #${cid} purchased!`);
      await fetchAllCollectionMarketItems();
      await fetchMyCollections();
      await fetchMyNFTs(); 
      if (selectedCollectionDetail && selectedCollectionDetail.collectionId === cid.toString()) {
        setSelectedCollectionDetail(null);
      }
    } catch (err) {
      toast.error(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNftFromCollection = async (cid, tid, rawPrice) => {
    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const bal = await provider.getBalance(await signer.getAddress());
      const priceBN = BigInt(rawPrice || '0');
      if (bal < priceBN) {
        toast.error('Insufficient balance!');
        setLoading(false);
        return;
      }

      const scn = new ethers.Contract(
        getContract().target,
        getContract().interface.fragments,
        signer
      );
      const tx = await scn.buyNftFromCollection(cid, tid, { value: rawPrice });
      await tx.wait();

      toast.success(`NFT #${tid} from Collection #${cid} purchased!`);
      await fetchMyNFTs();
      await fetchAllCollectionMarketItems();
      await fetchMyCollections();
      handleShowCollectionDetail(cid);  
    } catch (err) {
      toast.error(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // Fetch Collection Detail + each NFT's price
  // --------------------------------------------------
  const handleShowCollectionDetail = async (cid) => {
    try {
      setLoading(true);
      setSelectedCollectionDetail(null);
      setDetailCollSeller(null);
      setDetailCollListed(false);

      const c = getContract();
      const col = await c.getCollection(cid);

      const name = col[0];
      const desc = col[1];
      const imgUrl = resolveImageUrl(col[2]);
      const cTime = new Date(Number(col[3]) * 1000).toLocaleString();
      const creator = col[4];
      const tIdsArr = col[5].map(x => x.toString());

      const found = allCollectionsMarket.find(x => x.collectionId === cid.toString());
      let sellerAddr = null;
      let isList = false;
      let totalPrice = "0";
      if (found) {
        sellerAddr = found.seller;
        isList = found.isListed;
        totalPrice = found.price;
      }
      setDetailCollSeller(sellerAddr);
      setDetailCollListed(isList);

      const nftInfos = [];
      for (const tid of tIdsArr) {
        const d = await c.getNFTData(tid);
        const nftPrice = await c.getCollectionNftPrice(cid, tid);
        nftInfos.push({
          tokenId: tid,
          name: d[0],
          description: d[1],
          url: resolveImageUrl(d[2]),
          creator: d[3],
          createdTime: new Date(Number(d[4]) * 1000).toLocaleString(),
          royaltyRate: d[5]?.toString() || '0',
          mainCategory: d[6],
          subCategory: d[7],
          collPrice: nftPrice.toString()
        });
      }

      setSelectedCollectionDetail({
        collectionId: cid.toString(),
        name,
        description: desc,
        imageUrl: imgUrl,
        createdTime: cTime,
        creator,
        nfts: nftInfos,
        totalPrice
      });
    } catch (err) {
      toast.error(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // Header
  // --------------------------------------------------
  const renderHeader = () => (
    <header className="app-header">
      <div className="app-logo">
        <FaCube style={{ fontSize: '20px' }} />
        <span>Kilopi NFT Marketplace</span>
      </div>
      <nav className="app-nav">
        <button
          className={`nav-item ${view==='createNFT'?'active':''}`}
          onClick={() => setView('createNFT')}
        >
          <FaPlus style={{ marginRight:5 }}/>
          Create NFT
        </button>

        <button
          className={`nav-item ${view==='createCollection'?'active':''}`}
          onClick={() => setView('createCollection')}
        >
          <FaFolderOpen style={{ marginRight:5 }}/>
          Create Collection
        </button>

        <button
          className={`nav-item ${view==='market'?'active':''}`}
          onClick={() => setView('market')}
        >
          <FaStore style={{ marginRight:5 }}/>
          NFT Market
        </button>

        <button
          className={`nav-item ${view==='collectionMarket'?'active':''}`}
          onClick={() => setView('collectionMarket')}
        >
          <FaStore style={{ marginRight:5 }}/>
          Collection Market
        </button>

        <button
          className={`nav-item ${view==='searchNFT'?'active':''}`}
          onClick={() => setView('searchNFT')}
        >
          <FaSearch style={{ marginRight:5 }}/>
          Search NFT
        </button>

        <button
          className={`nav-item ${view==='profile'?'active':''}`}
          onClick={() => setView('profile')}
        >
          <FaUser style={{ marginRight:5 }}/>
          Profile
        </button>

        <button className="theme-btn" onClick={toggleTheme}>
          {darkMode ? 'Light Theme' : 'Dark Theme'}
        </button>
      </nav>
      <div className="app-wallet">
        {account ? (
          <div>
            <span>Connected account: {shortenAddress(account)}</span>

            <button
              onClick={() => setAccount(null)}
              className="wallet-btn"
              style={{ marginLeft:10 }}
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button onClick={connectWallet} className="wallet-btn">
            Connect Wallet
          </button>
        )}
      </div>
    </header>
  );

  // --------------------------------------------------
  // Messages (currently unused because Toastify is used)
  // --------------------------------------------------
  const renderMessages = () => (
    <div>
      {/* We are using Toastify for messages, so this is empty. */}
    </div>
  );

  // --------------------------------------------------
  // (1) Create Single NFT
  // --------------------------------------------------
  const renderCreateNFT = () => {
    const subCats = mainCategory ? categoryData[mainCategory] || [] : [];
    return (
      <div className="app-content">
        {renderMessages()}
        <h2>Create Single NFT</h2>
        <p className="note">Wallet: {account ? shortenAddress(account) : 'Not connected'}</p>


        <div className="form-group">
          <label>Name</label>
          <input value={nftName} onChange={(e) => setNftName(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Description</label>
          <input value={nftDesc} onChange={(e) => setNftDesc(e.target.value)} />
        </div>
        <div className="form-group">
          <label>URL (IPFS/http)</label>
          <input value={nftUrl} onChange={(e) => setNftUrl(e.target.value)} />
        </div>
        <div className="form-group">
  <label>Metadata URL (IPFS/http)</label>
  <input value={nftMetaUrl} onChange={(e) => setNftMetaUrl(e.target.value)} />
</div>

        <div className="form-group">
          <label>Royalty(%)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={royaltyRate}
            onChange={(e) => setRoyaltyRate(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Main Category</label>
          <select
            value={mainCategory}
            onChange={(e) => {
              setMainCategory(e.target.value);
              setSubCategory('');
            }}
          >
            <option value="">Select...</option>
            {Object.keys(categoryData).map((cat, i) => (
              <option key={i} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Sub Category</label>
          <select
            value={subCategory}
            disabled={!mainCategory}
            onChange={(e) => setSubCategory(e.target.value)}
          >
            <option value="">Select...</option>
            {subCats.map((s, i) => (
              <option key={i} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <button
          className="primary-btn"
          onClick={handleCreateNFT}
          disabled={!account}
        >
          Create
        </button>
      </div>
    );
  };

  // --------------------------------------------------
  // (2) Create Collection
  // --------------------------------------------------
  const renderCreateCollection = () => {
    return (
      <div className="app-content">
        {renderMessages()}
        <h2>Create Collection</h2>
        <p className="note">Wallet: {account ? shortenAddress(account) : 'Not connected'}</p>


        <div className="form-group">
          <label>Collection Name</label>
          <input value={collectionName} onChange={(e) => setCollectionName(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Collection Description</label>
          <input value={collectionDesc} onChange={(e) => setCollectionDesc(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Collection Cover URL</label>
          <input value={collectionCoverUrl} onChange={(e) => setCollectionCoverUrl(e.target.value)} />
        </div>
        <div className="form-group">
          <label>How many NFTs will be minted? (5..30)</label>
          <input
            type="number"
            min="5"
            max="30"
            value={collectionSize}
            onChange={(e) => setCollectionSize(e.target.value)}
          />
        </div>

        {collectionNFTs.map((it, idx) => {
          const subCats = it.mainCategory ? categoryData[it.mainCategory] || [] : [];
          return (
            <div key={idx} style={{ border: '1px solid #ccc', padding: 10, marginBottom: 10 }}>
              <h5>#{idx + 1} NFT</h5>
              <div className="form-group">
                <label>Name</label>
                <input
                  value={it.name}
                  onChange={(e) => {
                    const arr = [...collectionNFTs];
                    arr[idx] = { ...arr[idx], name: e.target.value };
                    setCollectionNFTs(arr);
                  }}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input
                  value={it.desc}
                  onChange={(e) => {
                    const arr = [...collectionNFTs];
                    arr[idx] = { ...arr[idx], desc: e.target.value };
                    setCollectionNFTs(arr);
                  }}
                />
              </div>
              <div className="form-group">
                <label>URL</label>
                <input
                  value={it.url}
                  onChange={(e) => {
                    const arr = [...collectionNFTs];
                    arr[idx] = { ...arr[idx], url: e.target.value };
                    setCollectionNFTs(arr);
                  }}
                />
              </div>
              <div className="form-group">
                <label>Royalty(%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={it.royalty}
                  onChange={(e) => {
                    const arr = [...collectionNFTs];
                    arr[idx] = { ...arr[idx], royalty: e.target.value };
                    setCollectionNFTs(arr);
                  }}
                />
              </div>
              <div className="form-group">
                <label>Main Category</label>
                <select
                  value={it.mainCategory}
                  onChange={(e) => {
                    const arr = [...collectionNFTs];
                    arr[idx] = { ...arr[idx], mainCategory: e.target.value, subCategory: '' };
                    setCollectionNFTs(arr);
                  }}
                >
                  <option value="">Select</option>
                  {Object.keys(categoryData).map((catz, i2) => (
                    <option key={i2} value={catz}>
                      {catz}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Sub Category</label>
                <select
                  value={it.subCategory}
                  disabled={!it.mainCategory}
                  onChange={(e) => {
                    const arr = [...collectionNFTs];
                    arr[idx] = { ...arr[idx], subCategory: e.target.value };
                    setCollectionNFTs(arr);
                  }}
                >
                  <option value="">Select</option>
                  {subCats.map((ss, i3) => (
                    <option key={i3} value={ss}>
                      {ss}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}

        <button className="primary-btn" onClick={handleCreateCollection} disabled={!account}>
          Create Collection
        </button>
      </div>
    );
  };

  // --------------------------------------------------
  // (3) NFT Market (Single)
  // --------------------------------------------------
  const renderMarket = () => {
    let filtered = marketItems;
    if (marketFilterCategory !== 'All') {
      filtered = filtered.filter(x => x.mainCategory === marketFilterCategory);
    }
    if (subCategoryFilter !== 'All') {
      filtered = filtered.filter(x => x.subCategory === subCategoryFilter);
    }
    if (searchTerm.trim()) {
      const st = searchTerm.toLowerCase();
      filtered = filtered.filter(x =>
        x.nftName.toLowerCase().includes(st) ||
        x.nftDescription.toLowerCase().includes(st)
      );
    }
    if (minPrice.trim()) {
      const minp = BigInt(minPrice);
      filtered = filtered.filter(x => BigInt(x.price || 0) >= minp);
    }
    if (maxPrice.trim()) {
      const maxp = BigInt(maxPrice);
      filtered = filtered.filter(x => BigInt(x.price || 0) <= maxp);
    }
    if (minRoyalty.trim()) {
      filtered = filtered.filter(x => parseInt(x.nftRoyaltyRate) >= parseInt(minRoyalty));
    }
    if (maxRoyalty.trim()) {
      filtered = filtered.filter(x => parseInt(x.nftRoyaltyRate) <= parseInt(maxRoyalty));
    }

    filtered = [...filtered];
    switch (sortOption) {
      case 'priceAsc':
        filtered.sort((a, b) => {
          const ap = BigInt(a.price || 0), bp = BigInt(b.price || 0);
          return ap > bp ? 1 : -1;
        });
        break;
      case 'priceDesc':
        filtered.sort((a, b) => {
          const ap = BigInt(a.price || 0), bp = BigInt(b.price || 0);
          return ap < bp ? 1 : -1;
        });
        break;
      default:
        break;
    }

    return (
      <div className="app-content">
        {renderMessages()}
        <h2>NFT Market</h2>
        <p className="note">Wallet: {account ? shortenAddress(account) : 'Not connected'}</p>


        <button className="primary-btn" onClick={() => setShowFilters(!showFilters)} style={{ marginBottom: 20 }}>
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>

        {showFilters && (
          <div className="filters-bar">
            <div className="filter-item">
              <label>Main Category:</label>
              <select value={marketFilterCategory} onChange={(e) => setMarketFilterCategory(e.target.value)}>
                <option value="All">All</option>
                {Object.keys(categoryData).map((k, i) => (
                  <option key={i} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-item">
              <label>Sub Category:</label>
              <select value={subCategoryFilter} onChange={(e) => setSubCategoryFilter(e.target.value)}>
                <option value="All">All</option>
                {Object.keys(categoryData).flatMap((kk, ii) =>
                  categoryData[kk].map((sub, iii) => (
                    <option key={`${kk}-${ii}-${iii}`} value={sub}>
                      {sub}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="filter-item">
              <label>Search:</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Name/Description"
              />
            </div>
            <div className="filter-item">
              <label>Min Price:</label>
              <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
            </div>
            <div className="filter-item">
              <label>Max Price:</label>
              <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
            </div>
            <div className="filter-item">
              <label>Min Royalty:</label>
              <input type="number" min="0" max="100" value={minRoyalty} onChange={(e) => setMinRoyalty(e.target.value)} />
            </div>
            <div className="filter-item">
              <label>Max Royalty:</label>
              <input type="number" min="0" max="100" value={maxRoyalty} onChange={(e) => setMaxRoyalty(e.target.value)} />
            </div>
            <div className="filter-item">
              <label>Sort By:</label>
              <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
                <option value="priceAsc">Price Ascending</option>
                <option value="priceDesc">Price Descending</option>
              </select>
            </div>
          </div>
        )}

        <button
          className="primary-btn"
          style={{ marginBottom: 20 }}
          onClick={() => setShowListingForm(!showListingForm)}
          disabled={!account}
        >
          {showListingForm ? 'Hide Listing Form' : 'List an NFT in the Market'}
        </button>

        {showListingForm && (
          <div className="listing-form">
            <div className="form-group">
              <label>TokenID</label>
              <input value={listTokenId} onChange={(e) => setListTokenId(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Sale Price (LOP Tokens)</label>
              <input
  type="number"
  value={price}
  onChange={(e) => setPrice(e.target.value)}
/>

            </div>
            <button className="primary-btn" onClick={handleListNFT} disabled={!account}>
              List
            </button>
          </div>
        )}

        <hr />
        <h3>NFTs for Sale</h3>

        <div className="nft-grid">
          {filtered.map((it, i) => {
            const tokenId = it.tokenId;
            const seller = it.seller?.toLowerCase();
            const rawPrice = it.price || '0';
            const userAddr = account?.toLowerCase();
            const canUnlist = it.isListed && seller === userAddr;
            const canBuy = it.isListed && seller !== userAddr && userAddr;

            return (
              <div className="nft-card" key={i}>
                {it.nftURL ? (
                  <img src={it.nftURL} alt={it.nftName || 'NFT#' + tokenId} />
                ) : (
                  <img src="https://via.placeholder.com/300?text=No+Image" alt="No Img" />
                )}

                <div className="nft-card-content">
                  <div className="nft-card-title">{it.nftName || 'NFT #' + tokenId}</div>
                  <div className="nft-card-desc">
                    {it.nftDescription?.length > 50
                      ? it.nftDescription.slice(0, 50) + '...'
                      : it.nftDescription}
                  </div>
                  <div className="nft-card-price">Price: {rawPrice/1000000} LOP Tokens</div>
                </div>

                <div className="nft-card-actions">
                  <button className="secondary-btn" onClick={() => handleShowDetails(tokenId)}>
                    Detail
                  </button>
                  {canUnlist && (
                    <button className="secondary-btn" onClick={() => handleUnlist(tokenId)}>
                      Unlist
                    </button>
                  )}
                  {canBuy && (
                    <button className="secondary-btn" onClick={() => handleBuyNFT(tokenId, rawPrice)}>
                      Buy
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {selectedNftDetails && (
          <div className="detail-box" style={{ marginTop: 20 }}>
            <h4>Selected NFT Detail</h4>
            <p>TokenID: {selectedNftDetails.tokenId}</p>
            <p>Name: {selectedNftDetails.name}</p>
            <p>Description: {selectedNftDetails.description}</p>
            <p>URL: {selectedNftDetails.url}</p>
            <p>Meta URL: {selectedNftDetails.metaUrl}</p>
            {selectedNftDetails.url && (
              <img style={{ maxWidth: 300, maxHeight: 300 }} src={selectedNftDetails.url} alt="Detail" />
            )}
            <p>Creator: {shortenAddress(selectedNftDetails.creator)}</p>

            <p>Created Time: {selectedNftDetails.createdTime}</p>
            <p>Royalty: {selectedNftDetails.royaltyRate}</p>
            <p>
              Category: {selectedNftDetails.mainCategory}/{selectedNftDetails.subCategory}
            </p>
            {selectedNftDetails.collId !== "0" && (
              <p>This NFT is minted in Collection #{selectedNftDetails.collId}.</p>
            )}
          </div>
        )}
      </div>
    );
  };

  // --------------------------------------------------
  // (4) Collection Market
  // --------------------------------------------------
  const renderCollectionMarket = () => {
    if (selectedCollectionDetail) {
      return renderCollectionDetail(selectedCollectionDetail);
    }
    return (
      <div className="app-content">
        {renderMessages()}
        <h2>Collection Market</h2>
        <p className="note">Wallet: {account ? shortenAddress(account) : 'Not connected'}</p>


        <button
          className="primary-btn"
          style={{ marginBottom: 20 }}
          onClick={() => setShowCollectionListingForm(!showCollectionListingForm)}
          disabled={!account}
        >
          {showCollectionListingForm ? 'Hide Listing Form' : 'List a Collection'}
        </button>

        {showCollectionListingForm && (
          <div className="listing-form">
            <div className="form-group">
              <label>Collection ID</label>
              <input
                value={collectionIdToList}
                onChange={(e) => {
                  setCollectionIdToList(e.target.value);
                  setCollectionNftPricesToList([]);
                }}
              />
              <button onClick={handleFetchCollectionForListing} className="secondary-btn" style={{ marginLeft:10 }}>
                Fetch Collection NFTs
              </button>
            </div>

            {collectionNftPricesToList.length > 0 && (
              <div style={{ margin: '10px 0', padding: 10, border: '1px solid gray' }}>
                <h5>Price for each NFT (wei)</h5>
                {collectionNftPricesToList.map((val, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: 5 }}>
                    <span style={{ marginRight: 10 }}>NFT #{idx+1} Price: </span>
                    <input
                      type="number"
                      value={val}
                      onChange={(e) => {
                        const arr = [...collectionNftPricesToList];
                        arr[idx] = e.target.value;
                        setCollectionNftPricesToList(arr);
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            <button className="primary-btn" onClick={handleListCollectionWithMultiplePrices} disabled={!account}>
              List
            </button>
          </div>
        )}

        <hr />
        <h3>Collections for Sale</h3>
        <div className="nft-grid">
          {allCollectionsMarket.length === 0 ? (
            <p>No collections listed.</p>
          ) : (
            allCollectionsMarket.map((col, i) => {
              const seller = col.seller?.toLowerCase();
              const userAddr = account?.toLowerCase();
              const canBuy = col.isListed && seller !== userAddr && userAddr;
              const canUnlist = col.isListed && seller === userAddr;

              return (
                <div className="nft-card" key={i} style={{ minHeight: 250 }}>
                  {col.coverImage ? (
                    <img
                      src={col.coverImage}
                      alt={col.collectionName || `Collection #${col.collectionId}`}
                      style={{ width: '100%', maxHeight: 200, objectFit: 'cover' }}
                    />
                  ) : (
                    <img
                      src="https://via.placeholder.com/300x200?text=No+Cover"
                      alt="No Cover"
                      style={{ width: '100%', maxHeight: 200, objectFit: 'cover' }}
                    />
                  )}

                  <div style={{ flex: 1, padding: 10 }}>
                    <div style={{ fontWeight: 600, marginBottom: 5 }}>
                      {col.collectionName || `Collection #${col.collectionId}`}
                    </div>
                    <div>Seller: {shortenAddress(col.seller)}</div>

                    <div>Total Price: {col.price} wei</div>
                  </div>

                  <div className="nft-card-actions" style={{ marginTop: 'auto' }}>
                    <button
                      className="secondary-btn"
                      onClick={() => handleShowCollectionDetail(col.collectionId)}
                    >
                      Detail
                    </button>
                    {canUnlist && (
                      <button
                        className="secondary-btn"
                        onClick={() => handleUnlistCollection(col.collectionId)}
                      >
                        Unlist
                      </button>
                    )}
                    {canBuy && (
                      <button
                        className="secondary-btn"
                        onClick={() => handleBuyCollection(col.collectionId, col.price)}
                      >
                        Buy Entire Collection
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  // Collection Detail
  const renderCollectionDetail = (col) => {
    const isSeller = detailCollSeller && detailCollSeller.toLowerCase() === account?.toLowerCase();
    const isListed = detailCollListed;

    return (
      <div className="app-content">
        {renderMessages()}
        <button className="secondary-btn" style={{ marginBottom: 20 }} onClick={() => setSelectedCollectionDetail(null)}>
          Back
        </button>

        <h2>Collection Detail (ID: {col.collectionId})</h2>
        <div style={{ marginBottom: 20 }}>
          <p><strong>Name:</strong> {col.name}</p>
          <p><strong>Description:</strong> {col.description}</p>
          {col.imageUrl && (
            <img src={col.imageUrl} alt="Collection Cover" style={{ maxWidth: 300, maxHeight: 300 }} />
          )}
          <p><strong>Created Time:</strong> {col.createdTime}</p>
          <p><strong>Creator:</strong> {shortenAddress(col.creator)}</p>

          <p><strong>Total Price (Remaining):</strong> {col.totalPrice || 0} wei</p>

          {isListed && isSeller && (
            <button className="secondary-btn" onClick={() => handleUnlistCollection(col.collectionId)}>
              Remove the Collection from Listing
            </button>
          )}
        </div>

        <h3>NFTs in this Collection</h3>
        <div className="nft-grid">
          {col.nfts.map((nft, i) => {
            const p = nft.collPrice || '0';
            const isSold = (p === '0');
            const showBuyButton = (!isSold && isListed && !isSeller && account);

            return (
              <div className="nft-card" key={i}>
                {nft.url ? (
                  <img src={nft.url} alt={nft.name} />
                ) : (
                  <img src="https://via.placeholder.com/300x300?text=No+Img" alt="No Img" />
                )}
                <div className="nft-card-content">
                  <div className="nft-card-title">{nft.name || ('NFT #' + nft.tokenId)}</div>
                  <div className="nft-card-desc">
                    {nft.description?.length > 50
                      ? nft.description.slice(0, 50) + '...'
                      : nft.description}
                  </div>
                  <div style={{ marginTop: 10 }}>TokenID: {nft.tokenId}</div>
                  <div>Royalty: {nft.royaltyRate}%</div>
                  <div>Price: {p} wei {isSold && '(Sold)'}</div>
                </div>

                <div className="nft-card-actions">
                  {showBuyButton && (
                    <button
                      className="secondary-btn"
                      onClick={() => handleBuyNftFromCollection(col.collectionId, nft.tokenId, p)}
                    >
                      Buy this NFT
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // --------------------------------------------------
  // (5) Search NFT
  // --------------------------------------------------
  const renderSearchNFT = () => {
    return (
      <div className="app-content">
        {renderMessages()}
        <h2>Search NFT</h2>
        <p className="note">Wallet: {account ? shortenAddress(account) : 'Not connected'}</p>


        <div className="form-group">
          <label>TokenID to search</label>
          <input value={dataTokenId} onChange={(e) => setDataTokenId(e.target.value)} />
        </div>
        <button className="primary-btn" onClick={handleGetNFTData}>
          Get NFT Data
        </button>

        {nftData && (
          <div className="detail-box" style={{ marginTop: 20 }}>
            <h4>NFT Information</h4>
            <p>TokenID: {nftData.tokenId}</p>
            <p>Name: {nftData.name}</p>
            <p>Description: {nftData.description}</p>
            <p>URL: {nftData.url}</p>
            {nftData.url && (
              <img src={nftData.url} alt="Search" style={{ maxWidth: 300, maxHeight: 300 }} />
            )}
            <p>Creator: {nftData.creator}</p>
            <p>Created Time: {nftData.createdTime}</p>
            <p>Royalty: {nftData.royaltyRate}</p>
            <p>
              Category: {nftData.mainCategory} / {nftData.subCategory}
            </p>
            {nftData.collId !== "0" && (
              <p>Collection ID: {nftData.collId}</p>
            )}
          </div>
        )}
      </div>
    );
  };

  // --------------------------------------------------
  // (6) Profile
  // --------------------------------------------------
  const renderProfile = () => {
    if (selectedCollectionDetail) {
      return renderCollectionDetail(selectedCollectionDetail);
    }
    return (
      <div className="app-content">
        {renderMessages()}
        <h2>Profile</h2>
        <p className="note">Account: {account || 'Not connected'}</p>

        <hr />
        <h3>My Single NFTs</h3>
<button
  className="secondary-btn"
  onClick={async () => {
    setShowMyNfts(true);
    await fetchMyNFTs();
  }}
>
  Show My Single NFTs
</button>

{showMyNfts && myNFTs.length > 0 && (
  <table className="market-table">
    <thead>
      <tr>
        <th>TokenID</th>
        <th>Name</th>
        <th>Description</th>
        <th>URL</th>
        <th>Creator</th>
        <th>Created Time</th>
        <th>Royalty</th>
        <th>Main Category</th>
        <th>Sub Category</th>
        <th>CollectionID</th>
      </tr>
    </thead>
    <tbody>
      {myNFTs.map((nft, i) => (
        <tr key={i}>
          <td>{nft.tokenId}</td>
          <td>{nft.name}</td>
          <td>{nft.description}</td>
          <td>
  {nft.url && (
    <img
      src={nft.url}
      alt="NFT"
      style={{ maxWidth: 100, maxHeight: 100, display: 'block', marginBottom: 5 }}
    />
  )}
  <div style={{ fontSize: '0.8em', wordBreak: 'break-all' }}>
    {nft.url}
  </div>
  <div style={{ fontSize: '0.8em', wordBreak: 'break-all' }}>
    {nft.metaUrl}
  </div>
</td>

          <td>{shortenAddress(nft.creator)}</td>

          <td>{nft.createdTime}</td>
          <td>{nft.royaltyRate}</td>
          <td>{nft.mainCategory}</td>
          <td>{nft.subCategory}</td>
          <td>{nft.collId !== "0" ? nft.collId : "-"}</td>
        </tr>
      ))}
    </tbody>
  </table>
)}


        <hr />
        <h3>My Collections</h3>
<button
  className="secondary-btn"
  onClick={async () => {
    setShowMyCollections(true);
    await fetchMyCollections();
  }}
>
  Show My Collections
</button>

{showMyCollections && myCollections.length > 0 && (
  <div className="nft-grid">
    {myCollections.map((col, idx) => (
      <div className="nft-card" key={idx} style={{ minHeight: 300 }}>
        {/* Render collection info */}
      </div>
    ))}
  </div>
)}

      </div>
    );
  };

  // --------------------------------------------------
  // Content Selection
  // --------------------------------------------------
  const renderContent = () => {
    if (loading) {
      return (
        <div className="loading-spinner">
          <p>Processing, please wait...</p>
        </div>
      );
    }
    switch (view) {
      case 'createNFT':
        return renderCreateNFT();
      case 'createCollection':
        return renderCreateCollection();
      case 'market':
        return renderMarket();
      case 'collectionMarket':
        return renderCollectionMarket();
      case 'searchNFT':
        return renderSearchNFT();
      case 'profile':
        return renderProfile();
      default:
        return renderCreateNFT();
    }
  };

  // --------------------------------------------------
  // Return
  // --------------------------------------------------
  return (
    <div className="app-container">
      {renderHeader()}
      {renderContent()}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}

export default App;
