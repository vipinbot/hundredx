import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { useParams, useNavigate } from 'react-router-dom';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import fetchCoinData from './api';
import { useLogin, usePrivy, useWallets, useFundWallet, getEmbeddedConnectedWallet } from '@privy-io/react-auth'; // Import necessary hooks
import settingsIconPng from './settings.png'; 
import { BrowserRouter as Router, Routes, Route, Link, } from 'react-router-dom';


ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const CoinDetail = ({ memecoins }) => {
  const { coinId } = useParams();
  const [chartData, setChartData] = useState([]);
  const navigate = useNavigate(); 
  const { login } = useLogin(); 
  const privy = usePrivy(); 
  const { ready, wallets } = useWallets(); 
  const { fundWallet } = useFundWallet(); 

  const selectedCoin = memecoins.find((coin) => coin.id === coinId) || {};

  const handleBuy = () => {
    navigate(`/buy/${selectedCoin.id}`, { state: { selectedCoin } });
  };

  const handleSell = () => {
    navigate(`/sell/${selectedCoin.id}`, { state: { selectedCoin } });
  };


  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      console.log("selectedCoin",selectedCoin)
      const data = await fetchCoinData(selectedCoin.coinGeckoId);
      if (data && isMounted) {
        setChartData(data);
      }
    };

    fetchData();

    return () => {
      isMounted = false; 
    };
  }, [coinId]);

  const data = {
    labels: chartData.map((entry) => new Date(entry[0]).toLocaleDateString()), // X-axis: Date
    datasets: [
      {
        label: 'Price (USD)',
        data: chartData.map((entry) => entry[1]), 
        borderColor: 'rgba(0, 204, 102, 1)', 
        fill: false,
        borderWidth: 2,
        tension: 0.4, 
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, 
    scales: {
      x: {
        ticks: {
          display: false, 
          color: '#333',
        },
        grid: {
          display: false, 
          color: '#333',
        },
        border: {
          color: '#333', 
          width: 0, 
        },
      },
      y: {
        ticks: {
          display: false,
          color: '#333',
        },
        grid: {
          display: false, 
        },
        border: {
          color: '#333', 
          width: 0, 
        },
      },
    },
    plugins: {
      legend: {
        display: false, 
      },
      tooltip: {
        callbacks: {
          label: (tooltipItem) => {

            return `Price (USD): ${tooltipItem.raw.toFixed(6)}`;
          },
        },
      },
    },
  };

  const handleNavClick = (path) => {
    if (!privy.authenticated) {
      login(); 
    } else {
      navigate(path); 
    }
  };

  return (
    <div className="coin-detail-page">
      <div className="coin-summary">
        <img src={selectedCoin.logo} alt={selectedCoin.name} className="coin-logo" />
        <h1>{selectedCoin.name}</h1>
        <h2>${selectedCoin.price ? selectedCoin.price : 'N/A'}</h2>
        <p>Market Cap: ${selectedCoin.marketCap ? selectedCoin.marketCap.toLocaleString() : 'N/A'}</p>
        <p>24h Change: {selectedCoin.priceChange24h ? `${selectedCoin.priceChange24h}%` : 'N/A'}</p>
        
      </div>

      <div className="chart-container">
        <Line data={data} options={options} />
      </div>
            <div className="action-buttons">
        <button className="buy-button" onClick={handleBuy}>Buy</button>
        <button className="sell-button" onClick={handleSell}>Sell</button>
      </div>
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

export default CoinDetail;
