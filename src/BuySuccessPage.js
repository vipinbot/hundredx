import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import settingsIconPng from './settings.png'; 
import './BuySuccessPage.css'; 

const BuySuccessPage = () => {
  const navigate = useNavigate();
  const { state } = useLocation(); 
  const selectedCoin = state?.selectedCoin || {}; 
  const amount = state?.amount || 0; 

  return (
    <div className="buy-success-page">
      <div className="header">
        <h2>Success!</h2>
        <p>You have successfully bought {amount} {selectedCoin.symbol}.</p>
      </div>
      <div className="content">
        <h3>Transaction Details</h3>
        <p>Token: {selectedCoin.name}</p>
        <p>Purchased Amount: {amount} {selectedCoin.symbol}</p>
      </div>
      <div className="navigation-menu">
        <button className="nav-item" onClick={() => navigate('/')}>Home</button>
        <button className="nav-item" onClick={() => navigate('/rewards')}>Rewards</button>
        <button className="nav-item" onClick={() => navigate('/holdings')}>Holdings</button>
        <div className="settings-icon">
          <img src={settingsIconPng} alt="Settings" onClick={() => navigate('/SettingsPage')} />
        </div>
      </div>
    </div>
  );
};

export default BuySuccessPage;
