import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePrivy, useLogin, getEmbeddedConnectedWallet, useWallets, useSolanaWallets } from '@privy-io/react-auth';
import Web3 from 'web3'; 
import './BuyTokenPage.css'; 
import { Connection, PublicKey } from '@solana/web3.js'; 
import UniswapV2RouterABI from './UniswapV2RouterABI.json'; 
import { encodeFunctionData } from 'viem'; 
import { Buffer } from 'buffer';
import {  clusterApiUrl, Transaction, VersionedTransaction, VersionedMessage } from '@solana/web3.js'; 
import settingsIconPng from './settings.png'; 
import { BrowserRouter as Router, Routes, Route, Link, } from 'react-router-dom';

 
const PUBLIC_RPC_URL = 'https://side-dimensional-bush.quiknode.pro/7689dd201ee8d461ff1ffe742e4278824f951523';

const SOLANA_RPC_URL = 'https://side-solitary-paper.solana-mainnet.quiknode.pro/e82103d46e9666e8a5bfcd1b3d73a1e563aed81e/'; // Solana mainnet RPC

const UNISWAP_V2_ROUTER_ADDRESS = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';


const fetchChainSpecificPriceFromDexScreener = async (chainId) => {
    try {
      if (chainId === 'ethereum') {
        const ethPriceInUSD = await fetchDexPairPrice('0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640', 'ethereum'); 
        return { ethPriceInUSD };
      } else if (chainId === 'solana') {
        const solPriceInUSD = await fetchDexPairPrice('Czfq3xZZDmsdGdUyrNLtRhGc47cXcZtLG4crryfu44zE', 'solana');  
        return { solPriceInUSD };
      }
    } catch (error) {
      console.error('Error fetching chain-specific price from DexScreener:', error);
      return {};
    }
  };


const fetchDexPairPrice = async (pairId, chainId) => {
  try {
    const response = await fetch(`https://api.dexscreener.com/latest/dex/pairs/${chainId}/${pairId}`);
    const data = await response.json();
    if (data && data.pairs && data.pairs.length > 0) {
      return parseFloat(data.pairs[0].priceUsd);
    } else {
      console.error(`No pair data found for pair ID: ${pairId}`);
      return null;
    }
  } catch (error) {
    console.error('Error fetching data from Dexscreener:', error);
    return null;
  }
};


const BuyTokenPage = () => {
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState(null); 
  const [priceUSD, setPriceUSD] = useState(null); 
  const [basetokenAddress, setbasetokenAddress] = useState(null); 
  const [ethPriceInUSD, setEthPriceInUSD] = useState(null);
  const [solPriceInUSD, setSolPriceInUSD] = useState(null);
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


  const handleNavClick = (path) => {
    if (!privy.authenticated) {
      login(); 
    } else {
      navigate(path); 
    }
  };


    useEffect(() => {
        const ensureSolanaWallet = async () => {
          if (selectedCoin.chainId === 'solana') {
            try {
              const solanaWallet = await checkSolanaWallet();
              if (!solanaWallet) {
                console.log('No Solana wallet found, creating a new one...');
                await createWallet();
                console.log('New Solana wallet created.');
              }
            } catch (error) {
              setError('Failed to create or retrieve Solana wallet.');
              console.error('Error:', error);
            }
          }
        };
    
        if (privy.authenticated && ready) {
          ensureSolanaWallet(); 
        }
      }, [privy, ready, selectedCoin.chainId]);
  
  useEffect(() => {
    const fetchPrices = async () => {
      try {
          const { ethPriceInUSD, solPriceInUSD } = await fetchChainSpecificPriceFromDexScreener(selectedCoin.chainId);
        if (selectedCoin.chainId === 'ethereum' && ethPriceInUSD) {
           setEthPriceInUSD(ethPriceInUSD);
         } else if (selectedCoin.chainId === 'solana' && solPriceInUSD) {
          setSolPriceInUSD(solPriceInUSD);
        }
        const dexData = await fetchCoinDataFromDexscreener(selectedCoin.dexScreenerPairId, selectedCoin.chainId);

        if (dexData) {
          setPrice(dexData.priceNative); 
          setPriceUSD(dexData.priceUSD)
          setbasetokenAddress(dexData.baseToken.address)
        }
      } catch (err) {
        setError('Failed to fetch token prices.');
      }
    };

    if (selectedCoin.dexScreenerPairId && selectedCoin.chainId) {
      fetchPrices();
    }
  }, [selectedCoin]);


  useEffect(() => {
    const fetchBalance = async () => {
      if (privy.authenticated && ready) {
        try {
          const embeddedWallet = getEmbeddedConnectedWallet(wallets);
  
          if (embeddedWallet && embeddedWallet.address) {
            if (selectedCoin.chainId === 'ethereum') {
              const web3 = new Web3(new Web3.providers.HttpProvider(PUBLIC_RPC_URL));
              const balanceInWei = await web3.eth.getBalance(embeddedWallet.address);
              const balanceInEth = web3.utils.fromWei(balanceInWei, 'ether');
              const balanceInEthOrSol = parseFloat(balanceInEth).toFixed(2);
              setBalance(balanceInEthOrSol); 
              if (ethPriceInUSD) {
                setUsdBalance((balanceInEthOrSol * ethPriceInUSD).toFixed(2)); 
              }
            }
            else if (selectedCoin.chainId === 'solana') {
              const solanaWallet = await checkSolanaWallet(); 
  
              if (solanaWallet && solanaWallet.address) {
                const publicKeyStr = solanaWallet.address; 
  
                const requestBody = {
                  jsonrpc: "2.0",
                  id: 1,
                  method: "getBalance",
                  params: [publicKeyStr],
                };
  
                const response = await fetch(SOLANA_RPC_URL, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(requestBody),
                });
  
                const responseData = await response.json();
  
                if (responseData.result) {
                  const balanceInLamports = responseData.result.value;
                  const balanceInSol = balanceInLamports ; 
                  const balanceInEthOrSol = parseFloat(balanceInSol).toFixed(2);
                  setBalance(balanceInEthOrSol); 

                  if (solPriceInUSD) {
                    setUsdBalance((balanceInEthOrSol * solPriceInUSD).toFixed(2)); 
                  }
                } else {
                  setError('Failed to fetch Solana balance.');
                }
              } else {
                setError('Solana wallet not found.');
              }
            }
          } else {
            setError('Embedded wallet not found.');
          }
        } catch (err) {
          setError('Failed to fetch wallet balance.');
          console.error('Error:', err);
        }
      }
    };
  
    fetchBalance();
  }, [privy, ready, wallets, ethPriceInUSD, solPriceInUSD, selectedCoin.chainId]);
  

  const handleAmountInput = (value) => {
    const newAmount = amount + value; 
    setAmount(newAmount);
    if (priceUSD) {
      const calculatedTotal = parseFloat(newAmount / priceUSD).toFixed(6); 
      setTotal(calculatedTotal);
    }
  };

  const clearAmount = () => {
    setAmount('');
    setTotal(0);
  };

  const handlePercentage = (percentage) => {
    const calculatedAmount = (balance * percentage) / 100;
    setAmount(calculatedAmount.toFixed(2));
    setTotal((calculatedAmount / priceUSD).toFixed(6));
  };

const handleBuyButton = () => {
    if (selectedCoin.chainId === 'ethereum') {
      handleBuyEthereum(); 
    } else if (selectedCoin.chainId === 'solana') {
      handleBuySolana();  
    } else {
      setError('Unsupported chain for this token.');
      console.error('Unsupported chain for this token.');
    }
  };

const fetchCoinDataFromDexscreener = async (pairId, chainId) => {
  try {
    const response = await fetch(`https://api.dexscreener.com/latest/dex/pairs/${chainId}/${pairId}`);
    const data = await response.json();
    if (data && data.pairs && data.pairs.length > 0) {
      return data.pairs[0]; 
    } else {
      console.error(`No pair data found for pair ID: ${pairId}`);
      return null;
    }
  } catch (error) {
    console.error('Error fetching data from Dexscreener:', error);
    return null;
  }
};


const handleBuySolana = async () => {
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

      const requestBody = {
        jsonrpc: "2.0",
        id: 1,
        method: "getBalance",
        params: [publicKeyStr],
      };

      const response = await fetch(SOLANA_RPC_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const responseData = await response.json();
      const balanceInLamports = responseData.result.value;
      const balanceInSol = balanceInLamports / 1e9;

      if (parseFloat(amount) > balanceInSol) {
        setError('Insufficient balance to complete the transaction.');
        return;
      }

      // Check if selected coin is Solana
      if (selectedCoin.id === 'solana') {
        const USDC_ADDRESS = 'AfTQvbB8LxH475euZnZQYaaB91dfLFXVt2TqAMsapump'; 

        const amountInLamports = Math.round(parseFloat(amount) * 1e6); 
        const quoteResponse = await (
          await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=${USDC_ADDRESS}&outputMint=So11111111111111111111111111111111111111112&amount=${amountInLamports}&slippageBps=50`)
        ).json();

        const swapTransactionResponse = await (
          await fetch('https://quote-api.jup.ag/v6/swap', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              quoteResponse,
              userPublicKey: publicKeyStr,
              wrapAndUnwrapSol: true,
            }),
          })
        ).json();

        if (!swapTransactionResponse.swapTransaction) {
          setError('Failed to generate swap transaction.');
          return;
        }

        const swapTransactionBuf = Buffer.from(swapTransactionResponse.swapTransaction, 'base64');
        const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

        const connection = new Connection(SOLANA_RPC_URL);
        const simulationResult = await connection.simulateTransaction(transaction);

        if (simulationResult.value.err) {
          console.error('Simulation failed:', simulationResult.value.err);
          setError('Transaction simulation failed.');
          return;
        } else {
          console.log('Transaction simulation successful.');
        }
        const signedTransaction = await wallets[0].signTransaction(transaction);

        const latestBlockHash = await connection.getLatestBlockhash();
        const rawTransaction = signedTransaction.serialize();
        const txid = await connection.sendRawTransaction(rawTransaction, {
          skipPreflight: true,
          maxRetries: 2
        });
        await connection.confirmTransaction({
          blockhash: latestBlockHash.blockhash,
          lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
          signature: txid
        });

        console.log(`Transaction confirmed: https://solscan.io/tx/${txid}`);
        navigate('/buy/success', { state: { selectedCoin, amount } });
      } else {
        const dexData = await fetchCoinDataFromDexscreener(selectedCoin.dexScreenerPairId, selectedCoin.chainId);

        if (!dexData || dexData.chainId !== 'solana') {
          console.error('Failed to fetch DexScreener data or invalid chain ID.');
          return;
        }

        const mintAddress = dexData.baseToken.address;
        selectedCoin.mintAddress = mintAddress;
        const amountInLamports = Math.round(parseFloat(amount) * 1e9);
        const quoteResponse = await (
          await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=${mintAddress}&amount=${amountInLamports}&slippageBps=50`)
        ).json();

        const swapTransactionResponse = await (
          await fetch('https://quote-api.jup.ag/v6/swap', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              quoteResponse,
              userPublicKey: publicKeyStr,
              wrapAndUnwrapSol: true,
            }),
          })
        ).json();

        if (!swapTransactionResponse.swapTransaction) {
          setError('Failed to generate swap transaction.');
          console.error('Failed to generate swap transaction.', swapTransactionResponse);
          return;
        }

        const swapTransactionBuf = Buffer.from(swapTransactionResponse.swapTransaction, 'base64');
        const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

        const connection = new Connection(SOLANA_RPC_URL);
        const simulationResult = await connection.simulateTransaction(transaction);

        if (simulationResult.value.err) {
          console.error('Simulation failed:', simulationResult.value.err);
          setError('Transaction simulation failed.');
          return;
        } else {
        }
        const signedTransaction = await wallets[0].signTransaction(transaction);

        const latestBlockHash = await connection.getLatestBlockhash();
        const rawTransaction = signedTransaction.serialize();
        const txid = await connection.sendRawTransaction(rawTransaction, {
          skipPreflight: true,
          maxRetries: 2
        });
        await connection.confirmTransaction({
          blockhash: latestBlockHash.blockhash,
          lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
          signature: txid
        });

        navigate('/buy/success', { state: { selectedCoin, amount } });
      }
    } else {
      setError('Failed to retrieve Solana wallet.');
    }
  } catch (error) {
    setError('Failed to execute swap.');
    console.error('Error during swap:', error);
  }
};

const handleBuyEthereum = async () => {
  if (!privy.authenticated || !ready) {
    await privy.login();
  }

  try {
    const embeddedWallet = getEmbeddedConnectedWallet(wallets);
    if (embeddedWallet && embeddedWallet.address) {
      const provider = new Web3(new Web3.providers.HttpProvider(PUBLIC_RPC_URL));
      const address = embeddedWallet.address;

      // ERC20 ABI for approval
      const ERC20_ABI = [
        {
          constant: true,
          inputs: [
            {
              name: "_owner",
              type: "address",
            },
            {
              name: "_spender",
              type: "address",
            },
          ],
          name: "allowance",
          outputs: [
            {
              name: "remaining",
              type: "uint256",
            },
          ],
          type: "function",
        },
        {
          constant: false,
          inputs: [
            {
              name: "_spender",
              type: "address",
            },
            {
              name: "_value",
              type: "uint256",
            },
          ],
          name: "approve",
          outputs: [
            {
              name: "success",
              type: "bool",
            },
          ],
          type: "function",
        },
      ];

      if (parseFloat(amount) > parseFloat(balance)) {
        setError('Insufficient balance to complete the transaction.');
        return;
      }
      if (selectedCoin.id === 'ethereum') {

        const USDC_ADDRESS = '0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'; 
        const amountInUSDC = BigInt(Math.round(parseFloat(amount) * 1e6)); 

        const usdcContract = new provider.eth.Contract(ERC20_ABI, USDC_ADDRESS);
        const allowance = await usdcContract.methods
          .allowance(address, UNISWAP_V2_ROUTER_ADDRESS)
          .call();

        if (BigInt(allowance) < amountInUSDC) {

          const approvalTransaction = await usdcContract.methods
            .approve(UNISWAP_V2_ROUTER_ADDRESS, amountInUSDC)
            .send({ from: address });

        }

        const path = [USDC_ADDRESS, basetokenAddress]; 
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20; 

        const data = encodeFunctionData({
          abi: UniswapV2RouterABI,
          functionName: 'swapExactTokensForTokens',
          args: [amountInUSDC, 0, path, address, deadline],
        });

        const transactionRequest = {
          to: UNISWAP_V2_ROUTER_ADDRESS,
          data: data,
          gasLimit: '0x5208',
        };

        const transactionHash = await provider.eth.sendTransaction({
          ...transactionRequest,
          from: address,
        });

        navigate('/buy/success', { state: { selectedCoin, amount, total } });
      } else {
        const amountInETH = (parseFloat(amount) * 1e18) / ethPriceInUSD;
        const amountIn = BigInt(Math.round(amountInETH)); 
        const amountOutMin = BigInt(Math.floor((parseFloat(amount) / parseFloat(price)) * 1e18)); 
        const path = ['0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', basetokenAddress]; 
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

        const data = encodeFunctionData({
          abi: UniswapV2RouterABI,
          functionName: 'swapExactETHForTokens',
          args: [amountOutMin, path, address, deadline],
        });

        const transactionRequest = {
          to: UNISWAP_V2_ROUTER_ADDRESS,
          data: data,
          value: `0x${amountIn.toString(16)}`,
          gasLimit: '0x5208',
        };

        const transactionHash = await provider.eth.sendTransaction({
          ...transactionRequest,
          from: address,
        });

        navigate('/buy/success', { state: { selectedCoin, amount, total } });
      }
    } else {
      setError('Embedded wallet not found.');
    }
  } catch (error) {
    setError('Failed to execute swap.');
    console.error('Error during swap:', error);
  }
};

let symbol;

if(selectedCoin.chainId==='solana' && selectedCoin.mint==="7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs"){
  symbol= 'ETH'
}else if
(selectedCoin.chainId==='ethereum' && selectedCoin.mint==="0xD31a59c85aE9D8edEFeC411D448f90841571b89c"){
  symbol = 'SOL';
}
else if
(selectedCoin.chainId==='ethereum'){
  symbol = 'ETH';
  return;
}
else if(selectedCoin.chainId==='solana' )
{
  symbol = 'SOL';
}

return (
  <div className="buy-token-page">
    <div className="header">
      <h2>Buying {selectedCoin.name}</h2>
      <p className="cash-balance">Balance {symbol} ${usdBalance}</p> 
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
    <div className="swipe-to-buy">
      <button className="buy-button2" onClick={handleBuyButton}>Buy</button>
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

export default BuyTokenPage;