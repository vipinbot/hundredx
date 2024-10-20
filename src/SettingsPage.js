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
    
    const handleBack = () => {
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate('/'); // Navigate to home or another default page
      }
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
      <div className="container">
        <div className="settings-container">
          <div className="back-button-container">
            <button onClick={handleBack} className="back-button">
  Back
            </button>
          </div>
          <div className="settings-content">
            {!authenticated || !isWalletAvailable ? (
              <div className="login-signup">
                                <div className="login-content">
                <div className="icon-container">
                  <img src="/appstore.png" alt="Login Icon" className="login-icon" />
                </div>
                <button
                  onClick={handleLogin}
                  className="login-signup-button"
                >
                  Login / Signup
                </button>
              </div> 
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
      </div>
    );
};

  
  export default SettingsPage;