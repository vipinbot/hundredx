// SettingsIcon.js
import { Link } from 'react-router-dom';
import settingsIcon from './settings.png'; // Import your icon
import { useNavigate } from 'react-router-dom';


const SettingsIcon = () => {
    const navigate = useNavigate();
  
    return (
      <div className="floating-settings-icon" onClick={() => navigate('/settings')}>
        <img src={settingsIcon} alt="Settings" />
      </div>
    );
  };
  
  export default SettingsIcon;
