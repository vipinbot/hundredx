import React, { useEffect, useState } from 'react';
import { useWallets, useSolanaWallets , getEmbeddedConnectedWallet } from '@privy-io/react-auth';
import { useNavigate } from 'react-router-dom';
import './MoonPayPage.css';

const MoonPayPage = () => {
  const { ready, wallets } = useWallets(); 
  const navigate = useNavigate(); 
  const solanaWallets = useSolanaWallets(); 
  const solWallet = getEmbeddedConnectedWallet(solanaWallets.wallets);
  
  const [moonpaySdk, setMoonpaySdk] = useState(null);

  useEffect(() => {
    if (!ready || wallets.length === 0) {
      console.error('Wallets not ready or no wallets connected.');
      return;
    }

    const walletAddress = solWallet.address; 
    console.log("walletAddress", walletAddress);

    const sdk = window.MoonPayWebSdk.init({
      flow: 'buy',
      environment: 'sandbox', 
      variant: 'overlay',
      params: {
        apiKey: 'pk_test_Y6kKkAUOvOttJ5VlWLNybL30vgHY0WlR', 
        baseCurrencyCode: 'usd',
        baseCurrencyAmount: '100',
        defaultCurrencyCode: 'sol', 
        walletAddress: walletAddress,  
      },
    });

    sdk.show();
    setMoonpaySdk(sdk);

  }, [ready, wallets, solWallet]);

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

export default MoonPayPage;
