import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaGoogle, FaStickyNote, FaSearch, FaShare, FaCloud, FaMobile, FaDesktop } from 'react-icons/fa';
import '../styles/HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const { login, register, googleLogin } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isLogin) {
      const success = await login(formData.email, formData.password);
      if (success) {
        navigate('/dashboard');
      }
    } else {
      const success = await register(formData.name, formData.email, formData.password);
      if (success) {
        navigate('/dashboard');
      }
    }
  };

  const handleGoogleAuth = () => {
    googleLogin();
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="homepage">
      <div className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              <FaStickyNote className="title-icon" />
              WebNote
            </h1>
            <p className="hero-subtitle">
              Your ultimate digital note-taking companion
            </p>
            <p className="hero-description">
              Create, organize, and share your thoughts with our powerful note-taking platform. 
              Featuring auto-save, rich text editing, and seamless cloud synchronization.
            </p>
            
            <div className="hero-features">
              <div className="feature">
                <FaSearch className="feature-icon" />
                <span>Smart Search</span>
              </div>
              <div className="feature">
                <FaShare className="feature-icon" />
                <span>Easy Sharing</span>
              </div>
              <div className="feature">
                <FaCloud className="feature-icon" />
                <span>Cloud Sync</span>
              </div>
              <div className="feature">
                <FaMobile className="feature-icon" />
                <span>Mobile Ready</span>
              </div>
            </div>
          </div>

          <div className="auth-section">
            <div className="auth-container">
              <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
              
              <button 
                className="google-auth-btn"
                onClick={handleGoogleAuth}
              >
                <FaGoogle />
                Continue with Google
              </button>
              
              <div className="divider">
                <span>or</span>
              </div>

              <form onSubmit={handleSubmit} className="auth-form">
                {!isLogin && (
                  <div className="form-group">
                    <input
                      type="text"
                      name="name"
                      placeholder="Full Name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required={!isLogin}
                    />
                  </div>
                )}
                
                <div className="form-group">
                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <button type="submit" className="auth-submit-btn">
                  {isLogin ? 'Sign In' : 'Create Account'}
                </button>
              </form>
              
              <p className="auth-switch">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button 
                  className="switch-btn"
                  onClick={() => setIsLogin(!isLogin)}
                >
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="features-section">
        <h2>Why Choose WebNote?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <FaDesktop />
            </div>
            <h3>Cross-Platform</h3>
            <p>Access your notes from anywhere - desktop, tablet, or mobile device.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <FaCloud />
            </div>
            <h3>Auto-Save</h3>
            <p>Never lose your work with automatic cloud synchronization.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <FaSearch />
            </div>
            <h3>Smart Search</h3>
            <p>Find your notes instantly with powerful search capabilities.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <FaShare />
            </div>
            <h3>Easy Sharing</h3>
            <p>Share your notes with anyone using secure share links.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 