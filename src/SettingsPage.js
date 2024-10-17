import { useNavigate } from 'react-router-dom';
import { usePrivy, useSolanaWallets, useWallets, useLogin } from '@privy-io/react-auth';
import { useState, useEffect } from 'react';

const SettingsPage = () => {
    const { logout, authenticated } = usePrivy();
    const navigate = useNavigate();
    const { exportWallet: exportSolanaWallet, wallets: solanaWallets } = useSolanaWallets();
    const { exportWallet: exportEthereumWallet, wallets: ethereumWallets } = useWallets();
    const { login } = useLogin();
    const [showDropdown, setShowDropdown] = useState(false);
  
    const isWalletAvailable = solanaWallets.length > 0 || ethereumWallets.length > 0;
  

    const handleLogin = async () => {
      await login(); 
    };
  
    const handleLogout = async () => {
      await logout();
      navigate('/'); 
    };
  
    const handleExportWallet = async (walletType) => {
      if (walletType === 'solana') {
        exportSolanaWallet();
      } else if (walletType === 'ethereum') {
        exportEthereumWallet();
      }
    };
  
    return (
      <div className="settings-container">
        <header>
          <button onClick={() => navigate(-1)} className="back-button">Back</button>
        </header>
  
        <div className="settings-content">
          {!authenticated || !isWalletAvailable ? (
            <div className="login-signup">
              <button onClick={handleLogin} className="login-button">Login / Signup</button>
            </div>
          ) : (
            <div className="profile-settings">
              <ul className="settings-menu">
                <li className="settings-item">
                  {!showDropdown ? (
                    <button onClick={() => setShowDropdown(true)} className="dropdown-button">
                      Export Keys
                    </button>
                  ) : (
                    <div className="dropdown">
                      <button onClick={() => handleExportWallet('solana')}>Export Solana Wallet</button>
                      <button onClick={() => handleExportWallet('ethereum')}>Export Ethereum Wallet</button>
                      <button onClick={() => setShowDropdown(false)} className="cancel-button">
                        Cancel
                      </button>
                    </div>
                  )}
                </li>
                <li className="settings-item">
                  <button onClick={handleLogout} className="logout-button">Log out</button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  export default SettingsPage;