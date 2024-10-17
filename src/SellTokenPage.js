import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePrivy, useLogin, getEmbeddedConnectedWallet, useWallets, useSolanaWallets } from '@privy-io/react-auth';
import Web3 from 'web3'; 
import './SellTokenPage.css'; 
import { Connection, PublicKey } from '@solana/web3.js'; 
import UniswapV2RouterABI from './UniswapV2RouterABI.json'; 
import { encodeFunctionData } from 'viem'; 
import { Buffer } from 'buffer';
import { clusterApiUrl, Transaction, VersionedTransaction, VersionedMessage } from '@solana/web3.js'; 
import settingsIconPng from './settings.png'; 
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

const PUBLIC_RPC_URL = 'https://side-dimensional-bush.quiknode.pro/7689dd201ee8d461ff1ffe742e4278824f951523';
const SOLANA_RPC_URL = 'https://side-solitary-paper.solana-mainnet.quiknode.pro/e82103d46e9666e8a5bfcd1b3d73a1e563aed81e/';
const UNISWAP_V2_ROUTER_ADDRESS = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';

const fetchTokenBalanceEthereum = async (walletAddress, contractAddress) => {
    try {
      const web3 = new Web3(new Web3.providers.HttpProvider(PUBLIC_RPC_URL));
      const ERC20_ABI = [
        {
          constant: true,
          inputs: [{ name: "_owner", type: "address" }],
          name: "balanceOf",
          outputs: [{ name: "balance", type: "uint256" }],
          type: "function",
        },
        {
          constant: true,
          inputs: [],
          name: "decimals",
          outputs: [{ name: "", type: "uint8" }],
          type: "function",
        },
      ];
  
      const contract = new web3.eth.Contract(ERC20_ABI, contractAddress);
  
      // Fetch the decimals from the contract
      const decimals = await contract.methods.decimals().call();
  
      // Fetch the token balance in Wei
      const balanceInWei = await contract.methods.balanceOf(walletAddress).call();
  
      // Convert the balance to token units using the fetched decimals
      const balanceInTokens = parseFloat(web3.utils.fromWei(balanceInWei, 'ether')) * 10 ** (18 - decimals);
  
      return balanceInTokens; // Return both balance and decimals
    } catch (error) {
      console.error(`Error fetching balance or decimals for contract ${contractAddress}:`, error);
      return { balanceInTokens: 0, decimals: 18 }; // Fallback if error occurs
    }
  };
  


const fetchTokenBalanceSolana = async (walletAddress, mintAddress) => {
  try {
    const requestBody = {
      jsonrpc: '2.0',
      id: 1,
      method: 'getTokenAccountsByOwner',
      params: [
        walletAddress,
        { mint: mintAddress },
        { encoding: 'jsonParsed' },
      ],
    };

    const response = await fetch(SOLANA_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const responseData = await response.json();
    if (responseData.result && responseData.result.value.length > 0) {
      const balance = responseData.result.value[0].account.data.parsed.info.tokenAmount.uiAmount;
      return balance;
    }
    return 0;
  } catch (error) {
    console.error(`Error fetching balance for Solana token ${mintAddress}:`, error);
    return 0;
  }
};

const fetchChainSpecificPriceFromDexScreener = async (chainId, pairId) => {
  try {
    const response = await fetch(`https://api.dexscreener.com/latest/dex/pairs/${chainId}/${pairId}`);
    const data = await response.json();
    
    if (data && data.pairs && data.pairs.length > 0) {
      const priceUsd = parseFloat(data.pairs[0].priceUsd);  
      const priceNative = parseFloat(data.pairs[0].priceNative); 
      const mintAddress = data.pairs[0].baseToken.address;
      return { priceUsd, priceNative, mintAddress };
    } else {
      console.error(`No pair data found for pair ID: ${pairId}`);
      return {};
    }
  } catch (error) {
    console.error('Error fetching price from DexScreener:', error);
    return {};
  }
};

const SellTokenPage = () => {
  const [amount, setAmount] = useState('');
  const [priceUsd, setPriceUsd] = useState(null); 
  const [priceNative, setPriceNative] = useState(null); 
  const [baseTokenAddress, setBaseTokenAddress] = useState(null); 
  const [usdBalance, setUsdBalance] = useState(0); 
  const [balance, setBalance] = useState(0); 
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(null);

  const { state } = useLocation();
  const selectedCoin = state.selectedCoin || {};
  const privy = usePrivy(); 
  const navigate = useNavigate();
  const { login } = useLogin(); 

  const ethWallets = useWallets(); 
  const solanaWallets = useSolanaWallets(); 

  let wallets, ready, createWallet;

  if (selectedCoin.chainId === 'ethereum') {
    wallets = ethWallets.wallets;
    ready = ethWallets.ready;
    createWallet = ethWallets.createWallet;
  } else if (selectedCoin.chainId === 'solana') {
    wallets = solanaWallets.wallets;
    ready = solanaWallets.ready;
    createWallet = solanaWallets.createWallet;
  }

  const handleNavClick = (path) => {
    if (!privy.authenticated) {
      login(); 
    } else {
      navigate(path); 
    }
  };

  const checkSolanaWallet = async () => {
    const { user } = privy;
    const solanaWallet = user.linkedAccounts.find(
      (account) =>
        account.type === 'wallet' &&
        account.walletClientType === 'privy' &&
        account.chainType === 'solana',
    );

    return solanaWallet;
  };

  useEffect(() => {
    const fetchPricesAndBalance = async () => {
      if (privy.authenticated && ready) {
        try {
          const { priceUsd, priceNative, mintAddress } = await fetchChainSpecificPriceFromDexScreener(selectedCoin.chainId, selectedCoin.dexScreenerPairId);
          
          setPriceUsd(priceUsd);
          setPriceNative(priceNative);

          selectedCoin.mintAddress = mintAddress;
          selectedCoin.contractAddress = mintAddress;

          const embeddedWallet = getEmbeddedConnectedWallet(wallets);
          if (embeddedWallet && embeddedWallet.address) {
            let tokenBalance;
            if (selectedCoin.chainId === 'ethereum') {
              tokenBalance = await fetchTokenBalanceEthereum(embeddedWallet.address, selectedCoin.contractAddress);
            } else if (selectedCoin.chainId === 'solana') {
              tokenBalance = await fetchTokenBalanceSolana(embeddedWallet.address, selectedCoin.mintAddress);
            }
            setBalance(tokenBalance);
            setUsdBalance((tokenBalance * priceUsd).toFixed(2));
          } else {
            setError('Embedded wallet not found.');
          }
        } catch (error) {
          setError('Failed to fetch prices or balances.');
          console.error('Error:', error);
        }
      }
    };
    fetchPricesAndBalance();
  }, [privy, ready, wallets, selectedCoin.chainId, selectedCoin.dexScreenerPairId]);

  const handleAmountInput = (value) => {
    const newAmount = amount + value; 
    setAmount(newAmount);
    if (priceUsd) {
      const calculatedTotal = parseFloat(newAmount) * priceUsd;
      setTotal(calculatedTotal.toFixed(2));
    }
  };

  const clearAmount = () => {
    setAmount('');
    setTotal(0);
  };

  const handlePercentage = (percentage) => {
    const calculatedAmount = (balance * percentage) / 100;
    setAmount(calculatedAmount.toFixed(2));
    setTotal((calculatedAmount * priceUsd).toFixed(2));
  };

  const handleSellButton = () => {
    if (selectedCoin.chainId === 'ethereum') {
      handleSellEthereum(); 
    } else if (selectedCoin.chainId === 'solana') {
      handleSellSolana();  
    } else {
      setError('Unsupported chain for this token.');
      console.error('Unsupported chain for this token.');
    }
  };

  const handleSellSolana = async () => {
    if (!privy.authenticated || !ready) {
      await privy.login();
    }
  
    try {
      const solanaWallet = await checkSolanaWallet();
      if (!solanaWallet) {
        await createWallet();
      }
      const updatedSolanaWallet = await checkSolanaWallet();
  
      if (updatedSolanaWallet && updatedSolanaWallet.address) {
        const publicKeyStr = updatedSolanaWallet.address;
  
        const tokenBalance = await fetchTokenBalanceSolana(publicKeyStr, selectedCoin.mintAddress);
        if (parseFloat(amount) > tokenBalance) {
          setError('Insufficient balance to complete the transaction.');
          return;
        }
        const outputMint = (selectedCoin.id === 'solana') 
          ? 'AfTQvbB8LxH475euZnZQYaaB91dfLFXVt2TqAMsapump'  
          : 'So11111111111111111111111111111111111111112'; 
  
        const amountInLamports = Math.round(parseFloat(amount) * 1e9); 
        const quoteResponse = await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=${selectedCoin.mintAddress}&outputMint=${outputMint}&amount=${amountInLamports}&slippageBps=50`)
          .then(res => res.json());
  
        if (!quoteResponse) {
          setError('Failed to fetch swap quote.');
          return;
        }
  
        const swapTransactionResponse = await fetch('https://quote-api.jup.ag/v6/swap', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            quoteResponse,
            userPublicKey: publicKeyStr,
            wrapAndUnwrapSol: true,
          }),
        }).then(res => res.json());
  
        if (!swapTransactionResponse.swapTransaction) {
          setError('Failed to generate swap transaction.');
          return;
        }
  
        const swapTransactionBuf = Buffer.from(swapTransactionResponse.swapTransaction, 'base64');
        const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
  
        const connection = new Connection(SOLANA_RPC_URL);
        const signedTransaction = await wallets[0].signTransaction(transaction);
  
        const latestBlockHash = await connection.getLatestBlockhash();
        const rawTransaction = signedTransaction.serialize();
  
        const txid = await connection.sendRawTransaction(rawTransaction, {
          skipPreflight: true,
          maxRetries: 2,
        });
  
        await connection.confirmTransaction({
          blockhash: latestBlockHash.blockhash,
          lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
          signature: txid,
        });
  
        navigate('/sell/success', { state: { selectedCoin, amount } });
      } else {
        setError('Failed to retrieve Solana wallet.');
      }
    } catch (error) {
      setError('Failed to execute swap.');
      console.error('Error during swap:', error);
    }
  };
  

  const handleSellEthereum = async () => {
    if (!privy.authenticated || !ready) {
      await privy.login();
    }
  
    try {
      const embeddedWallet = getEmbeddedConnectedWallet(wallets);
      if (embeddedWallet && embeddedWallet.address) {
        const provider = new Web3(new Web3.providers.HttpProvider(PUBLIC_RPC_URL));
        const address = embeddedWallet.address;
  
        const ERC20_ABI = [
          {
            constant: true,
            inputs: [{ name: "_owner", type: "address" }],
            name: "balanceOf",
            outputs: [{ name: "balance", type: "uint256" }],
            type: "function",
          },
          {
            constant: false,
            inputs: [{ name: "_spender", type: "address" }, { name: "_value", type: "uint256" }],
            name: "approve",
            outputs: [{ name: "success", type: "bool" }],
            type: "function",
          },
        ];
  
        const tokenBalance = await fetchTokenBalanceEthereum(address, selectedCoin.contractAddress);
        if (parseFloat(amount) > tokenBalance) {
          setError('Insufficient balance to complete the transaction.');
          return;
        }
  
        const outputToken = (selectedCoin.id === 'ethereum')
          ? '0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' 
          : '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'; 
  
        const tokenContract = new provider.eth.Contract(ERC20_ABI, selectedCoin.contractAddress);
        const amountInTokens = BigInt(Math.round(parseFloat(amount) * 1e18));
  
        const allowance = await tokenContract.methods.allowance(address, UNISWAP_V2_ROUTER_ADDRESS).call();
        if (BigInt(allowance) < amountInTokens) {
          await tokenContract.methods.approve(UNISWAP_V2_ROUTER_ADDRESS, amountInTokens).send({ from: address });
        }
  
        const path = [selectedCoin.contractAddress, outputToken]; 
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20; 
  
        const data = encodeFunctionData({
          abi: UniswapV2RouterABI,
          functionName: 'swapExactTokensForTokens',
          args: [amountInTokens, 0, path, address, deadline],
        });
  
        const transactionRequest = {
          to: UNISWAP_V2_ROUTER_ADDRESS,
          data,
          gasLimit: '0x5208',
        };
  
        const transactionHash = await provider.eth.sendTransaction({
          ...transactionRequest,
          from: address,
        });
  
        navigate('/sell/success', { state: { selectedCoin, amount } });
      } else {
        setError('Embedded wallet not found.');
      }
    } catch (error) {
      setError('Failed to execute swap.');
      console.error('Error during swap:', error);
    }
  };
  

  let symbol;
  if (selectedCoin.chainId === 'ethereum') {
    symbol = 'ETH';
  } else {
    symbol = 'SOL';
  }

  return (
    <div className="sell-token-page">
      <div className="header">
        <h2>Selling {selectedCoin.name}</h2>
        <p className="cash-balance">Token Balance: {balance} {selectedCoin.symbol}</p>
        <p className="usd-balance">USD Value: ${usdBalance}</p>
      </div>
      <div className="amount-display">
        <h1 className="amount">${amount || '0.00'}</h1>
      </div>
      <div className="percentage-buttons">
        <button onClick={() => handlePercentage(10)}>10%</button>
        <button onClick={() => handlePercentage(25)}>25%</button>
        <button onClick={() => handlePercentage(50)}>50%</button>
        <button onClick={() => handlePercentage(100)}>MAX</button>
      </div>
      <div className="number-pad">
        <div className="row">
          {[1, 2, 3].map((num) => (
            <button key={num} onClick={() => handleAmountInput(num.toString())}>{num}</button>
          ))}
        </div>
        <div className="row">
          {[4, 5, 6].map((num) => (
            <button key={num} onClick={() => handleAmountInput(num.toString())}>{num}</button>
          ))}
        </div>
        <div className="row">
          {[7, 8, 9].map((num) => (
            <button key={num} onClick={() => handleAmountInput(num.toString())}>{num}</button>
          ))}
        </div>
        <div className="row">
          <button onClick={() => handleAmountInput('.')}>.</button>
          <button onClick={() => handleAmountInput('0')}>0</button>
          <button className="clear-button" onClick={clearAmount}>Clear</button>
        </div>
      </div>
      <div className="swipe-to-sell">
        <button className="sell-button2" onClick={handleSellButton}>Sell</button>
      </div>
      {error && <p className="error-message">{error}</p>}
      <nav className="bottom-nav">
        <button className="nav-item" onClick={() => navigate('/')}>Home</button>
        <button className="nav-item" onClick={() => handleNavClick('/rewards')}>Rewards</button>
        <button className="nav-item" onClick={() => handleNavClick('/holdings')}>Holdings</button>
        <div className="settings-icon">
          <Link to="/SettingsPage">
            <img src={settingsIconPng} alt="Settings" />
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default SellTokenPage;