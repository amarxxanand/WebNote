import React, { useState } from 'react';
import { 
  FaBars, 
  FaUser, 
  FaSignOutAlt
} from 'react-icons/fa';
import '../styles/Toolbar.css';

const Toolbar = ({ 
  user, 
  onLogout, 
  onToggleSidebar, 
  currentNote 
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    onLogout();
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
        <div 
          className="user-menu-container"
          onMouseEnter={() => setShowUserMenu(true)}
          onMouseLeave={() => setShowUserMenu(false)}
        >
          <button 
            className="user-menu-btn"
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
                <button className="menu-item" onClick={handleLogout}>
                  <FaSignOutAlt />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Toolbar; 