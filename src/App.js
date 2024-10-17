import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import './App.css';
import CoinDetail from './CoinDetail';
import { useLogin, useLogout, usePrivy } from '@privy-io/react-auth';
import { PrivyProvider } from '@privy-io/react-auth';
import MoonPayPage from './MoonPayPage'; 
import MoonPayPageSellETH from './MoonPayPageSellETH'; 
import MoonPayPageSellSol from './MoonPayPageSellSol'; 
import BuyTokenPage from './BuyTokenPage';
import SellTokenPage from './SellTokenPage';
import HoldingsPage from './HoldingsPage';
import RewardsPage from './RewardsPage';
import SettingsPage from './SettingsPage'; 
import settingsIconPng from './settings.png'; 
import tokenImage from './token.png';
import BuySuccessPage from './BuySuccessPage';
import SellSuccessPage from './SellSuccessPage';


const memecoinPairsUrl = 'https://raw.githubusercontent.com/defi-techz/coindata/refs/heads/main/memecoins.json';


const searchMemecoins = async (query, setSearchResults) => {
  try {
    const response = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${query}`, {
      method: 'GET',
      headers: {},
    });
    const data = await response.json();
    if (data.pairs) {
      setSearchResults(data.pairs.slice(0, 10)); 
    }
  } catch (error) {
    console.error('Error fetching search results from Dexscreener:', error);
  }
};

const SearchDropdown = ({ searchResults, setSearchResults, memecoins, setMemecoins }) => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setSearchResults([]); 
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  const handleCoinSelect = (coin) => {
    const coinExists = memecoins.some((memecoin) => memecoin.id.toLowerCase() === coin.baseToken.name.toLowerCase());

    if (!coinExists) {
      const newCoin = {
        id: coin.baseToken.name.toLowerCase(),
        name: coin.baseToken.name,
        logo: coin.info?.imageUrl || tokenImage,
        price: coin.priceUsd, 
        marketCap: coin.marketCap || 0, 
        priceChange24h: coin.priceChange.h24, 
        rewards: 'false', 
        dexScreenerPairId: coin.pairAddress, 
        chainId: coin.chainId, 
        volume: coin.volume.h24,
        liquidity: coin.liquidity.usd,
      };
      setMemecoins((prevMemecoins) => [...prevMemecoins, newCoin]);
    }

    setSearchResults([]);

    navigate(`/coin/${coin.baseToken.name.toLowerCase()}`);
  };

  return (
    searchResults.length > 0 && (
      <ul className="search-dropdown" ref={dropdownRef}>
        {searchResults
          .filter((coin) => coin.chainId === 'solana' || coin.chainId === 'ethereum') 
          .map((coin) => (
            <li
              key={coin.pairAddress}
              className="search-item"
              onClick={() => handleCoinSelect(coin)}
            >
              <div className="search-result" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <img src={coin.info?.imageUrl || tokenImage} alt={coin.baseToken.name} width="24" />
                  <span style={{ marginLeft: '10px' }}>{coin.baseToken.name}</span>
                  <span style={{ marginLeft: '10px' }}>{coin.baseToken.symbol}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p>{coin.chainId === 'solana' ? 'Solana' : 'Ethereum'}</p>
                  <p style={{ fontSize: '12px', color: 'gray' }}>Mkt Cap: ${coin.liquidity?.usd?.toLocaleString() || 'N/A'}</p>
                </div>
              </div>
            </li>
          ))}
      </ul>
    )
  );
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


const fetchCoinDataFromCoinGecko = async (coinId) => {
  try {
    const response = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&market_data=true`);
    const data = await response.json();
    return {
      price: data.market_data.current_price.usd,
      marketCap: data.market_data.market_cap.usd,
      priceChange24h: data.market_data.price_change_percentage_24h_in_currency.usd,
      logo: data.image.thumb,
    };
  } catch (error) {
    console.error('Error fetching data from CoinGecko:', error);
    return null;
  }
};

const privyConfig = {
  appId: "cm1xf98nv036ze01sr4qxtfgs",
  appearance: {
    accentColor: "#6A6FF5",
    theme: "#FFFFFF",
    showWalletLoginFirst: true,
    logo: "https://auth.privy.io/logos/privy-logo.png",
    walletChainType: "ethereum-and-solana",
  },
  loginMethods: ["email", "wallet", "google", "apple", "github", "discord"],
  fundingMethodConfig: {
    moonpay: {
      useSandbox: true, 
      apiKey: "pk_test_Y6kKkAUOvOttJ5VlWLNybL30vgHY0WlR", 
    },
  },
  embeddedWallets: {
    createOnLogin: "all-users", 
    requireUserPasswordOnCreate: false,
  },
  mfa: {
    noPromptOnMfaRequired: false,
  },
};

const Navigation = () => {
  const { login } = useLogin();
  const privy = usePrivy();
  const navigate = useNavigate();

  const handleNavClick = (path) => {
    if (!privy.authenticated) {
      login(); 
    } else {
      navigate(path); 
    }
  };

  return (
    <nav className="bottom-nav">
      <button className="nav-item" onClick={() => handleNavClick('/')}>Home</button>
      <button className="nav-item" onClick={() => handleNavClick('/rewards')}>Rewards</button>
      <button className="nav-item" onClick={() => handleNavClick('/holdings')}>Holdings</button>

          <div className="settings-icon">
              <Link to="/SettingsPage">
                <img src={settingsIconPng} alt="Settings" />
              </Link>
            </div>
    </nav>
  );
};

function App() {
  const [memecoins, setMemecoins] = useState([]);
  const [memecoinPairs, setMemecoinPairs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const dropdownRef = useRef(null); 
  


  useEffect(() => {
    const fetchMemecoinPairs = async () => {
      try {
        const response = await fetch(memecoinPairsUrl);
        const data = await response.json();
        setMemecoinPairs(data); 
      } catch (error) {
        console.error('Error fetching memecoin pairs from GitHub:', error);
      }
    };

    fetchMemecoinPairs();
  }, []);


  useEffect(() => {
    const fetchInitialData = async () => {
      if (memecoins.length > 0) return; 

      const updatedCoins = await Promise.all(
        memecoinPairs.map(async (coin) => {
          const geckoData = await fetchCoinDataFromCoinGecko(coin.coinGeckoId);
          return {
            id: coin.id,
            name: coin.name,
            rewards: coin.rewards,
            contract: coin.contract,
            price: geckoData ? parseFloat(geckoData.price) : 0,
            marketCap: geckoData ? geckoData.marketCap : 0,
            priceChange24h: geckoData ? geckoData.priceChange24h.toFixed(2) : 'N/A',
            logo: coin.image,
            dexScreenerPairId: coin.dexScreenerPairId, 
            chainId: coin.chainId, 
            coinGeckoId: coin.coinGeckoId,
            mint: '',
          };
        })
      );
      setMemecoins(updatedCoins); 
    };

    fetchInitialData(); 
  }, [memecoinPairs]);


  useEffect(() => {
    const updateWithDexScreener = async () => {
      const updatedCoins = [...memecoins];

      for (let i = 0; i < updatedCoins.length; i++) {
        const coin = updatedCoins[i];
        if (!coin.dexScreenerPairId || !coin.chainId) continue; 


        const dexData = await fetchCoinDataFromDexscreener(coin.dexScreenerPairId, coin.chainId);
        if (dexData) {
          coin.price = parseFloat(dexData.priceUsd).toFixed(8); 
          coin.priceChange24h = dexData.priceChange?.h24 ? parseFloat(dexData.priceChange.h24).toFixed(2) : 'Unknown';
          coin.mint = dexData.baseToken.address ? dexData.baseToken.address : '';
          coin.marketCap = dexData.marketCap ? dexData.marketCap : '';
          coin.volume = dexData.volume.h24 ? dexData.volume.h24 : '';
          coin.liquidity = dexData.liquidity.usd ? dexData.liquidity.usd : '';
        }
      }

      setMemecoins((prevMemecoins) => {
        if (JSON.stringify(prevMemecoins) !== JSON.stringify(updatedCoins)) {
          return [...updatedCoins];
        }
        return prevMemecoins;
      });
    };

    updateWithDexScreener();

    const intervalId = setInterval(updateWithDexScreener, 3000); 
    return () => clearInterval(intervalId); 
  }, [memecoins, memecoinPairs]);


  const topGainers = [...memecoins]
    .filter((coin) => coin.priceChange24h !== 'N/A') 
    .sort((a, b) => b.priceChange24h - a.priceChange24h) 
    .slice(0, 4); 

  return (
    <PrivyProvider appId={privyConfig.appId} config={privyConfig}>
      <Router>
        <Routes>
          <Route
            path="/"
            element={

              <div className="container">
             <div className="search-container">
                  <input
                    type="text"
                    placeholder="Search tokens"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') searchMemecoins(searchQuery); 
                    }}
                  />
                   <button onClick={() => searchMemecoins(searchQuery, setSearchResults)}>Search</button>

                  </div>
                     
                      <SearchDropdown searchResults={searchResults} setSearchResults={setSearchResults} memecoins={memecoins} setMemecoins={setMemecoins} />


                <section className="spotlight">
                  <div className="coin-card">
                    <img src="https://assets.coingecko.com/coins/images/33760/standard/image.jpg?1702964227" alt="Cheeseball" />
                    <div>
                      <h2>CB Cheeseball</h2>
                      <span className="live">Live</span>
                    </div>
                  </div>
                </section>

                <section className="top-gainers">
                  <h3>Top Gainers</h3>
                  <div className="gainers-list">
                    {topGainers.map((coin) => (
                      <div className="gainer-item" key={coin.id}>
                        <Link to={`/coin/${coin.id}`}>
                          <img src={coin.logo} alt={coin.name} />
                          <div>
                            <p>{coin.name}</p>
                            <p className="gain">{`${coin.priceChange24h}% 24h`}</p>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="trending">
                  <h3>Trending</h3>
                  <ul className="trending-list">
                    {memecoins.map((coin) => (
                      <li className="trending-item" key={coin.id}>
                        <Link to={`/coin/${coin.id}`}>
                          <div className="coin-row">
                            <div className="coin-details">
                              <img src={coin.logo} alt={coin.name} />
                              <p className="coin-name">{coin.name}</p>
                            </div>


                            {coin.price && (
                              <p className="live-price">Price: ${coin.price}</p>
                            )}
                          </div>
                          <div className="coin-row">
                            <p className="market-cap">${coin.marketCap.toLocaleString()} MKT CAP</p>
                            <p
                          className={`gain ${parseFloat(coin.priceChange24h) < 0 ? 'negative' : 'positive'}`}
                            >
                           {`${coin.priceChange24h}% 24h`}
                          </p>

                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>


                <Navigation />
              </div>
            }
          />
          <Route path="/coin/:coinId" element={<CoinDetail memecoins={memecoins} />} />
          <Route path="/moonpay" element={<MoonPayPage />} />
          <Route path="/moonpayselleth" element={<MoonPayPageSellETH />} />
          <Route path="/moonpaysellsol" element={<MoonPayPageSellSol />} />
          <Route path="/buy/:coinId" element={<BuyTokenPage />} />
          <Route path="/sell/:coinId" element={<SellTokenPage />} />
          <Route path="/SettingsPage" element={<SettingsPage />} />
          <Route path="/holdings" element={<HoldingsPage memecoins={memecoins} />} />
          <Route path="/rewards" element={<RewardsPage memecoins={memecoins} />} />
          <Route path="/buy/success" element={<BuySuccessPage />} />
          <Route path="/sell/success" element={<SellSuccessPage />} />
        </Routes>
      </Router>
    </PrivyProvider>
  );
}

export default App;
