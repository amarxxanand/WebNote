import React, { useState } from 'react';
import { 
  FaBars, 
  FaUser, 
  FaSignOutAlt, 
  FaSun, 
  FaMoon, 
  FaCog,
  FaBell
} from 'react-icons/fa';
import '../styles/Toolbar.css';

const Toolbar = ({ 
  user, 
  onLogout, 
  onToggleSidebar, 
  onToggleTheme, 
  theme,
  currentNote 
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    onLogout();
    setShowUserMenu(false);
  };

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <button 
          className="sidebar-toggle-btn"
          onClick={onToggleSidebar}
        >
          <FaBars />
        </button>
        
        <div className="app-title">
          <h1>WebNote</h1>
          {currentNote && (
            <span className="current-note-title">
              - {currentNote.title}
            </span>
          )}
        </div>
      </div>

      <div className="toolbar-right">
        <button 
          className="theme-toggle-btn"
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        >
          {theme === 'dark' ? <FaSun /> : <FaMoon />}
        </button>

        <button className="notifications-btn" title="Notifications">
          <FaBell />
        </button>

        <div className="user-menu-container">
          <button 
            className="user-menu-btn"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            {user?.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="user-avatar"
              />
            ) : (
              <FaUser />
            )}
            <span className="user-name">{user?.name}</span>
          </button>

          {showUserMenu && (
            <div className="user-menu">
              <div className="user-info">
                <div className="user-details">
                  <strong>{user?.name}</strong>
                  <span>{user?.email}</span>
                </div>
              </div>
              
              <div className="menu-items">
                <button className="menu-item">
                  <FaCog />
                  Settings
                </button>
                <button className="menu-item" onClick={handleLogout}>
                  <FaSignOutAlt />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showUserMenu && (
        <div 
          className="menu-overlay"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </div>
  );
};

export default Toolbar; 