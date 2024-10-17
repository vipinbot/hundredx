import React, { useEffect, useState } from 'react';
import { useWallets } from '@privy-io/react-auth';
import { useNavigate } from 'react-router-dom';
import './MoonPayPage.css'; 

const MoonPayPageSellETH = () => {
  const { ready, wallets } = useWallets(); 
  const navigate = useNavigate();  
  const [moonpaySdk, setMoonpaySdk] = useState(null); 

  useEffect(() => {
    if (!ready || wallets.length === 0) {
      console.error('Wallets not ready or no wallets connected.');
      return;
    }
    const embeddedWallet = wallets.find(wallet => wallet.connectorType === "embedded");
    console.log("embeddedWallet", embeddedWallet);

    if (!embeddedWallet || !embeddedWallet.address) {
      console.error('Embedded wallet not found.');
      return;
    }

    const walletAddress = embeddedWallet.address; 
    console.log("walletAddress", walletAddress);

    const moonpaySdkInstance = window.MoonPayWebSdk.init({
      flow: 'sell',
      environment: 'sandbox', 
      variant: 'overlay',
      params: {
        apiKey: 'pk_test_Y6kKkAUOvOttJ5VlWLNybL30vgHY0WlR', 
        baseCurrencyCode: 'eth',
        baseCurrencyAmount: '1',
        defaultCurrencyCode: 'usd',  
        walletAddress: walletAddress, 
      },
    });
    moonpaySdkInstance.show();
    setMoonpaySdk(moonpaySdkInstance); 

  }, [ready, wallets]);

  const closeMoonPayWidget = () => {
    if (moonpaySdk) {
      moonpaySdk.close(); 
    }
    navigate('/holdings'); 
  };

  return (
    <div>
      <div id="moonpay-widget-container"></div>

      <button className="close-button2" onClick={closeMoonPayWidget}>X</button>
      <nav className="bottom-nav2">
        <button className="nav-item2" onClick={() => navigate('/')}>Home</button>
        <button className="nav-item2" onClick={() => navigate('/rewards')}>Rewards</button>
        <button className="nav-item2" onClick={() => navigate('/holdings')}>Holdings</button>
      </nav>
    </div>
  );
};

export default MoonPayPageSellETH;
