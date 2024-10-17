import React, { useState, useEffect } from 'react';
import './HoldingsPage.css';
import { getEmbeddedConnectedWallet } from '@privy-io/react-auth';
import { useWallets, useSolanaWallets } from '@privy-io/react-auth'; 
import Web3 from 'web3'; 
import { useParams, useNavigate, Link } from 'react-router-dom';

import { useLogin, usePrivy, useFundWallet } from '@privy-io/react-auth'; 
import settingsIconPng from './settings.png'; 


const PUBLIC_RPC_URL = 'https://side-dimensional-bush.quiknode.pro/7689dd201ee8d461ff1ffe742e4278824f951523';
const SOLANA_RPC_URL = 'https://side-solitary-paper.solana-mainnet.quiknode.pro/e82103d46e9666e8a5bfcd1b3d73a1e563aed81e/'; 



const HoldingsPage = ({ memecoins }) => {
  const [totalBalance, setTotalBalance] = useState(0);
  const [tokenHoldings, setTokenHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false); 
  const [showSellCurrencyDropdown, setSellShowCurrencyDropdown] = useState(false); 
  const [selectedCurrency, setSelectedCurrency] = useState('ETH'); 
  const ethWallets = useWallets(); 
  const solanaWallets = useSolanaWallets(); 
  const privy = usePrivy(); 
  const { login } = useLogin(); 
  const { ready, wallets } = useWallets();
  const { fundWallet } = useFundWallet(); 
  const navigate = useNavigate(); 

  const [balanceETH, setBalanceETH] = useState(0); 
  const [balanceSOL, setBalanceSOL] = useState(0); 
  const [error, setError] = useState(null);
  const embeddedWallet = getEmbeddedConnectedWallet(wallets);


  useEffect(() => {
    const fetchBalance = async () => {
      if (privy.authenticated && ready) {
        try {
  
          if (embeddedWallet && embeddedWallet.address) {   
              const web3 = new Web3(new Web3.providers.HttpProvider(PUBLIC_RPC_URL));
              const balanceInWei = await web3.eth.getBalance(embeddedWallet.address);
              const balanceInEth = web3.utils.fromWei(balanceInWei, 'ether');
              const balanceInEthOrSol = parseFloat(balanceInEth).toFixed(2);
              setBalanceETH(balanceInEthOrSol); 
              const solanaWallet = getEmbeddedConnectedWallet(solanaWallets.wallets);
  
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
                  setBalanceSOL(balanceInEthOrSol); 
  
                } else {
                  console.log("Failed to retrieve balance, response:", responseData);
                  setError('Failed to fetch Solana balance.');
                }
              } else {
                setError('Solana wallet not found.');
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
  }, [privy, ready, wallets, ethWallets.wallets, solanaWallets.wallets]);

const Cashout = async (privy, login, ready, wallets, fundWallet, selectedCurrency) => {
  if (!privy.authenticated) {
    await login(); 
  }

  if (privy.authenticated && ready) {
    try {
      const embeddedWallet = getEmbeddedConnectedWallet(wallets);
      if (embeddedWallet && embeddedWallet.address) {
        let walletAddress;
        if (selectedCurrency === 'ETH') {
          navigate('/moonpayselleth', {
            state: { walletAddress },
          });
        } else if (selectedCurrency === 'SOL') {
            navigate('/moonpaysellsol', {
              state: { walletAddress },
            });     
        }

      } else {
        console.error('Embedded wallet not found');
      }
    } catch (error) {
      console.error(`Error funding the wallet with ${selectedCurrency}:`, error);
    }
  }
};

  const Addcash = async (privy, login, ready, wallets, fundWallet, selectedCurrency) => {
    if (!privy.authenticated) {
      await login(); 
    }
    if (privy.authenticated && ready) {
      try {
        const embeddedWallet = getEmbeddedConnectedWallet(wallets);
        if (embeddedWallet && embeddedWallet.address) {
        let walletAddress;
          let chain, asset, amount;
          if (selectedCurrency === 'ETH') {
            chain = { id: 1, name: 'Ethereum' }; 
            asset = 'native-currency'; 
            amount = '0.1'; 
            walletAddress = embeddedWallet.address; 
          await fundWallet(walletAddress, {
            chain,
            asset,
            amount, 
          });
          } else if (selectedCurrency === 'SOL') {
  
              navigate('/moonpay', {
                state: { walletAddress },
              });
          }
        } else {
          console.error('Embedded wallet not found');
        }
      } catch (error) {
        console.error(`Error funding the wallet with ${selectedCurrency}:`, error);
      }
    }
  };

  const fetchTokenBalanceEthereumaddlater = async (walletAddress, contractAddress) => {
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
      const decimals = await contract.methods.decimals().call();
      const balanceInWei = await contract.methods.balanceOf(walletAddress).call();
      const balanceInTokens = parseFloat(web3.utils.fromWei(balanceInWei, 'ether')) * 10 ** (18 - decimals);
  
      return balanceInTokens; 
    } catch (error) {
      console.error(`Error fetching balance or decimals for contract ${contractAddress}:`, error);
      return { balanceInTokens: 0, decimals: 18 }; 
    }
  };

  const fetchTokenBalanceEthereum = async (walletAddress, contractAddress, decimals) => {
    try {
      const web3 = new Web3(new Web3.providers.HttpProvider(PUBLIC_RPC_URL));
      const contract = new web3.eth.Contract([
        {
          constant: true,
          inputs: [{ name: "_owner", type: "address" }],
          name: "balanceOf",
          outputs: [{ name: "balance", type: "uint256" }],
          type: "function",
        },
      ], contractAddress);

      const balanceInWei = await contract.methods.balanceOf(walletAddress).call();
      const balanceInTokens = parseFloat(web3.utils.fromWei(balanceInWei, 'ether')) * 10 ** (18 - decimals);
      return balanceInTokens;
    } catch (error) {
      console.error(`Error fetching balance for contract ${contractAddress}:`, error);
      return 0;
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

  useEffect(() => {
    const fetchBalances = async () => {
      let tokens = [];
      const ethWallet = getEmbeddedConnectedWallet(ethWallets.wallets);
      const solWallet = getEmbeddedConnectedWallet(solanaWallets.wallets);
  
      if (ethWallet || solWallet) {
        for (const coin of memecoins) {
          let userBalance = 0;
          if (coin.contract === '0x0000000000000000000000000000000000000000' && coin.chainId === 'ethereum') {
            userBalance = parseFloat(balanceETH);
          } else if (coin.contract === '0x0000000000000000000000000000000000000001' && coin.chainId === 'solana') {
            userBalance = parseFloat(balanceSOL);
          } else {
            if (coin.chainId === 'ethereum' && ethWallet && ethWallet.address) {
              userBalance = await fetchTokenBalanceEthereum(ethWallet.address, coin.mint, 18); 
            }
            if (coin.chainId === 'solana' && solWallet && solWallet.address) {
              userBalance = await fetchTokenBalanceSolana(solWallet.address, coin.mint);
            }
          }
  
          tokens.push({
            ...coin,
            userBalance: userBalance.toFixed(2),
            userUsdValue: (userBalance * coin.price).toFixed(2),
          });
        }
        const totalUSD = tokens.reduce((total, token) => total + parseFloat(token.userUsdValue), 0);
        setTotalBalance(totalUSD.toFixed(2));
        setTokenHoldings(tokens);
        setLoading(false);
      }
    };
    const intervalId = setInterval(fetchBalances, 3000);
    fetchBalances();
    return () => clearInterval(intervalId); 
  }, [ethWallets.wallets, solanaWallets.wallets, memecoins, balanceETH, balanceSOL]);

 
  return (
    <div className="holdings-container">
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div className="balance-summary">
            <h2>Total Balance</h2>
            <p className="total-balance">${totalBalance}</p>
          </div>

          <div className="action-buttons">
            <button
              className="action-button"
              onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
            >
              Add Cash
            </button>
            <button className="action-button">Send</button>
            <button
              className="action-button"
              onClick={() => setSellShowCurrencyDropdown(!showSellCurrencyDropdown)}
            >
              Cash Out
            </button>
          </div>

          {showCurrencyDropdown && (
            <div className="currency-dropdown">
              <label>Select Chain:</label>
              <label>
                <input
                  type="radio"
                  name="currency"
                  value="ETH"
                  checked={selectedCurrency === 'ETH'}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                />
                Ethereum
              </label>
              <label>
                <input
                  type="radio"
                  name="currency"
                  value="SOL"
                  checked={selectedCurrency === 'SOL'}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                />
                Solana
              </label>
              <button
                className="action-button"
                onClick={() => Addcash(privy, login, ready, wallets, fundWallet, selectedCurrency)}
              >
                Confirm
              </button>
            </div>
          )}

          {showSellCurrencyDropdown && (
            <div className="currency-dropdown">
              <label>Select Chain:</label>
              <label>
                <input
                  type="radio"
                  name="currency"
                  value="ETH"
                  checked={selectedCurrency === 'ETH'}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                />
                Ethereum
              </label>
              <label>
                <input
                  type="radio"
                  name="currency"
                  value="SOL"
                  checked={selectedCurrency === 'SOL'}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                />
                Solana
              </label>
              <button
                className="action-button"
                onClick={() => Cashout(privy, login, ready, wallets, fundWallet, selectedCurrency)}
              >
                Confirm
              </button>
            </div>
          )}

          <div className="holdings-list">
            <div className="cash-summary">
              <p>Cash* ${totalBalance}</p>
            </div>

            <div className="tokens-summary">
              <h3>Moonshots</h3>
              <ul>
                {tokenHoldings.map((token, index) => (


          <li key={index} className="coin-item">
          <div className="coin-info">
            <img src={token.logo} alt={token.name} className="coin-logo" />
            <Link to={`/coin/${token.id}`} className="coin-link">
              <span className="coin-name">{token.name}</span>
              <span className="coin-balance">
                {token.userBalance} {token.symbol} (${token.userUsdValue})
              </span>
            </Link>
          </div>
          <span className={`price-change ${parseFloat(token.priceChange24h) >= 0 ? 'positive' : 'negative'}`}>
            {token.priceChange24h}% 24h
          </span>
        </li>
        
                    
                  
                ))}
              </ul>
            </div>
          </div>

          <nav className="bottom-nav">
            <button className="nav-item" onClick={() => navigate('/')}>Home</button>
            <button className="nav-item" onClick={() => navigate('/rewards')}>Rewards</button>
            <button className="nav-item" onClick={() => navigate('/holdings')}>Holdings</button>
            <div className="settings-icon">
              <Link to="/SettingsPage">
                <img src={settingsIconPng} alt="Settings" />
              </Link>
            </div>
          </nav>
        </>
      )}
    </div>
  );
};

export default HoldingsPage;
