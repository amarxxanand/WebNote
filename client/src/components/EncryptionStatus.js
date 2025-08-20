import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FaLock, FaLockOpen, FaShieldAlt, FaCog } from 'react-icons/fa';
import toast from 'react-hot-toast';
import '../styles/EncryptionStatus.css';

const EncryptionStatus = () => {
  const { user, encryptionEnabled, initializeEncryption } = useAuth();
  const [showDetails, setShowDetails] = useState(false);

  const getEncryptionStatus = () => {
    if (!user) return { status: 'disabled', message: 'Not authenticated' };
    
    if (!encryptionEnabled) {
      return { status: 'disabled', message: 'Encryption disabled' };
    }
    
    if (!user.encryption?.salt) {
      return { status: 'pending', message: 'Encryption not initialized' };
    }
    
    return { status: 'enabled', message: 'Encryption active' };
  };

  const { status, message } = getEncryptionStatus();

  const handleInitializeEncryption = async () => {
    try {
      await initializeEncryption();
      toast.success('Encryption initialized successfully');
    } catch (error) {
      toast.error('Failed to initialize encryption');
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'enabled':
        return <FaLock className="status-icon enabled" />;
      case 'pending':
        return <FaLockOpen className="status-icon pending" />;
      default:
        return <FaLockOpen className="status-icon disabled" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'enabled':
        return '#22c55e'; // green
      case 'pending':
        return '#f59e0b'; // yellow
      default:
        return '#ef4444'; // red
    }
  };

  return (
    <div className="encryption-status">
      <div 
        className="encryption-indicator"
        onClick={() => setShowDetails(!showDetails)}
        title={message}
      >
        {getStatusIcon()}
        <span className="status-text">{message}</span>
      </div>
      
      {showDetails && (
        <div className="encryption-details">
          <div className="details-header">
            <FaShieldAlt className="shield-icon" />
            <h4>Client-Side Encryption</h4>
          </div>
          
          <div className="encryption-info">
            <div className="info-item">
              <strong>Status:</strong>
              <span style={{ color: getStatusColor() }}>{status.toUpperCase()}</span>
            </div>
            
            {user?.encryption?.algorithm && (
              <div className="info-item">
                <strong>Algorithm:</strong>
                <span>{user.encryption.algorithm}</span>
              </div>
            )}
            
            {user?.encryption?.version && (
              <div className="info-item">
                <strong>Version:</strong>
                <span>{user.encryption.version}</span>
              </div>
            )}
            
            {user?.encryption?.created && (
              <div className="info-item">
                <strong>Initialized:</strong>
                <span>{new Date(user.encryption.created).toLocaleDateString()}</span>
              </div>
            )}
          </div>
          
          <div className="encryption-description">
            <p>
              <strong>Client-Side Field Level Encryption (CSFLE)</strong> encrypts your note 
              content, titles, and tags on your device before sending them to the server. 
              This ensures that even if the server is compromised, your data remains secure.
            </p>
            
            <ul>
              <li>✓ AES-256-CBC encryption with HMAC</li>
              <li>✓ User-specific encryption keys</li>
              <li>✓ Data encrypted before transmission</li>
              <li>✓ Server cannot decrypt your notes</li>
            </ul>
          </div>
          
          {status === 'pending' && (
            <button 
              className="initialize-btn"
              onClick={handleInitializeEncryption}
            >
              <FaCog /> Initialize Encryption
            </button>
          )}
          
          <div className="encryption-warning">
            <strong>Important:</strong> If you lose access to your account, 
            your encrypted notes cannot be recovered. Please ensure you 
            remember your login credentials.
          </div>
        </div>
      )}
    </div>
  );
};

export default EncryptionStatus;
