import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  FaGoogle, 
  FaStickyNote, 
  FaSearch, 
  FaShare, 
  FaCloud, 
  FaMobile, 
  FaDesktop,
  FaLock,
  FaShieldAlt,
  FaBold,
  FaItalic,
  FaPrint,
  FaSmile,
  FaClock,
  FaStar,
  FaArchive,
  FaFileUpload,
  FaFileDownload,
  FaSpellCheck,
  FaFont,
  FaExchangeAlt,
  FaSave,
  FaUserShield,
  FaKey,
  FaEye,
  FaTags,
  FaFilter,
  FaPalette,
  FaHeart,
  FaGithub,
  FaLinkedin,
  FaEnvelope,
  FaCode,
  FaTerminal,
  FaBug
} from 'react-icons/fa';
import '../styles/HomePage.css';
import ClickSpark from '../components/ClickSpark';

const HomePage = () => {
  const navigate = useNavigate();
  const { login, register, googleLogin, isAuthenticated, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  // Redirect to dashboard if user is already authenticated
  useEffect(() => {
    console.log('🏠 HomePage state check:', {
      isAuthenticated,
      loading,
      currentPath: window.location.pathname
    });
    
    if (!loading && isAuthenticated) {
      console.log('🏠 User is already authenticated, redirecting to dashboard...');
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

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

  // Show loading while checking authentication
  if (loading) {
    return (
      <ClickSpark
        sparkColor='#007bff'
        sparkSize={8}
        sparkRadius={15}
        sparkCount={6}
        duration={300}
      >
        <div className="loading-container" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          gap: '1rem'
        }}>
          <div className="loading-spinner" style={{
            width: '40px',
            height: '40px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #007bff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p>Checking authentication...</p>
        </div>
      </ClickSpark>
    );
  }

  return (
    <ClickSpark
      sparkColor='#007bff'
      sparkSize={12}
      sparkRadius={20}
      sparkCount={10}
      duration={500}
      easing="ease-out"
      extraScale={1.2}
    >
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
              Featuring client-side encryption, rich text editing, auto-save, and seamless cloud synchronization with zero-knowledge security architecture.
            </p>
            
            <div className="hero-features">
              <div className="feature">
                <FaLock className="feature-icon" />
                <span>End-to-End Encrypted</span>
              </div>
              <div className="feature">
                <FaCode className="feature-icon" />
                <span>Code Highlighting</span>
              </div>
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
                <span>Auto-Save</span>
              </div>
              <div className="feature">
                <FaMobile className="feature-icon" />
                <span>Cross-Platform</span>
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
          {/* Security & Privacy Features */}
          <div className="feature-card security">
            <div className="feature-icon">
              <FaShieldAlt />
            </div>
            <h3>🔐 Client-Side Encryption</h3>
            <p>Your notes are encrypted with AES-256-CBC before leaving your device. Zero-knowledge architecture means even we can't read your notes.</p>
          </div>
          
          <div className="feature-card security">
            <div className="feature-icon">
              <FaUserShield />
            </div>
            <h3>🛡️ Privacy First</h3>
            <p>Field-level encryption for titles, content, and tags. User-specific encryption keys derived per session for maximum security.</p>
          </div>

          <div className="feature-card security">
            <div className="feature-icon">
              <FaKey />
            </div>
            <h3>🔑 Zero-Knowledge Security</h3>
            <p>Server cannot decrypt your data. HMAC authentication protects against tampering. Your privacy is guaranteed.</p>
          </div>
          
          {/* Rich Text Editing Features */}
          <div className="feature-card editing">
            <div className="feature-icon">
              <FaBold />
            </div>
            <h3>✨ Rich Text Editor</h3>
            <p>Full formatting support: Bold, italic, underline, strikethrough, text alignment, and multiple font families & sizes.</p>
          </div>
          
          <div className="feature-card editing">
            <div className="feature-icon">
              <FaSmile />
            </div>
            <h3>😊 Emoji & Characters</h3>
            <p>Built-in emoji picker, special character insertion, and timestamp features. Express yourself fully in your notes.</p>
          </div>

          <div className="feature-card editing">
            <div className="feature-icon">
              <FaSpellCheck />
            </div>
            <h3>📝 Advanced Tools</h3>
            <p>Spell checking, find & replace, word & character count, and print support. Professional writing tools at your fingertips.</p>
          </div>

          {/* Code Features */}
          <div className="feature-card coding">
            <div className="feature-icon">
              <FaCode />
            </div>
            <h3>💻 Code Syntax Highlighting</h3>
            <p>Support for 25+ programming languages with beautiful syntax highlighting using Highlight.js. Perfect for developers and technical documentation.</p>
          </div>

          <div className="feature-card coding">
            <div className="feature-icon">
              <FaTerminal />
            </div>
            <h3>🔧 Code Block Editor</h3>
            <p>Dedicated code blocks with language selection, proper indentation, and paste-friendly editing. Supports Python, JavaScript, C++, Java, and more.</p>
          </div>

          <div className="feature-card coding">
            <div className="feature-icon">
              <FaBug />
            </div>
            <h3>🎨 Developer-Friendly</h3>
            <p>Atom One Dark theme for code blocks, intelligent Enter key handling, and clipboard integration optimized for code snippets.</p>
          </div>
          
          {/* Organization Features */}
          <div className="feature-card organization">
            <div className="feature-icon">
              <FaTags />
            </div>
            <h3>🏷️ Smart Organization</h3>
            <p>Tag your notes, mark favorites, archive old content. Powerful filtering and search across all your notes.</p>
          </div>
          
          <div className="feature-card organization">
            <div className="feature-icon">
              <FaSearch />
            </div>
            <h3>🔍 Instant Search</h3>
            <p>Find your notes instantly with full-text search across titles, content, and tags. Smart filtering by favorites and archived notes.</p>
          </div>

          <div className="feature-card organization">
            <div className="feature-icon">
              <FaStar />
            </div>
            <h3>⭐ Favorites & Archive</h3>
            <p>Star important notes and archive completed ones. Keep your workspace organized and clutter-free.</p>
          </div>
          
          {/* Cloud & Sync Features */}
          <div className="feature-card cloud">
            <div className="feature-icon">
              <FaSave />
            </div>
            <h3>💾 Auto-Save</h3>
            <p>Never lose your work with automatic saving every 3 seconds. Your notes are always protected and up-to-date.</p>
          </div>
          
          <div className="feature-card cloud">
            <div className="feature-icon">
              <FaCloud />
            </div>
            <h3>☁️ Cloud Sync</h3>
            <p>Your encrypted notes sync seamlessly across all your devices. Access your thoughts anywhere, anytime.</p>
          </div>

          <div className="feature-card cloud">
            <div className="feature-icon">
              <FaDesktop />
            </div>
            <h3>📱 Cross-Platform</h3>
            <p>Responsive design works perfectly on desktop, tablet, and mobile. Beautiful dark theme with modern interface.</p>
          </div>
          
          {/* Sharing & Export Features */}
          <div className="feature-card sharing">
            <div className="feature-icon">
              <FaShare />
            </div>
            <h3>🌐 Secure Sharing</h3>
            <p>Generate public shareable links for your notes. Share your thoughts safely with colleagues and friends.</p>
          </div>
          
          <div className="feature-card sharing">
            <div className="feature-icon">
              <FaFileDownload />
            </div>
            <h3>📄 Import & Export</h3>
            <p>Import and export .txt and .md files. Easy migration from other note-taking apps and backup options.</p>
          </div>

          <div className="feature-card sharing">
            <div className="feature-icon">
              <FaPrint />
            </div>
            <h3>🖨️ Print Ready</h3>
            <p>Print your notes with custom formatting. Perfect for meetings, presentations, or offline reference.</p>
          </div>

          {/* Authentication Features */}
          <div className="feature-card auth">
            <div className="feature-icon">
              <FaGoogle />
            </div>
            <h3>🔐 Google OAuth</h3>
            <p>Secure login with Google accounts. Quick, safe, and convenient authentication without managing passwords.</p>
          </div>

          <div className="feature-card auth">
            <div className="feature-icon">
              <FaEye />
            </div>
            <h3>👁️ Encryption Status</h3>
            <p>Visual encryption indicators show when your notes are protected. Real-time security status for peace of mind.</p>
          </div>

          <div className="feature-card auth">
            <div className="feature-icon">
              <FaPalette />
            </div>
            <h3>🎨 Beautiful Design</h3>
            <p>Modern dark theme with gradient accents. Intuitive interface designed for distraction-free writing.</p>
          </div>
        </div>
        
        {/* Technical Highlights */}
        <div className="tech-highlights">
          <h3>🛠️ Technical Excellence</h3>
          <div className="tech-grid">
            <div className="tech-item">
              <strong>Encryption:</strong> AES-256-CBC with HMAC
            </div>
            <div className="tech-item">
              <strong>Framework:</strong> React 18 with modern hooks
            </div>
            <div className="tech-item">
              <strong>Code Support:</strong> Highlight.js with 25+ languages
            </div>
            <div className="tech-item">
              <strong>Backend:</strong> Node.js & Express with MongoDB
            </div>
            <div className="tech-item">
              <strong>Security:</strong> Zero-knowledge architecture
            </div>
            <div className="tech-item">
              <strong>Performance:</strong> Optimized auto-save & sync
            </div>
            <div className="tech-item">
              <strong>Mobile:</strong> Fully responsive design
            </div>
          </div>
        </div>

        {/* Feature Categories Summary */}
        <div className="category-summary">
          <h3>📋 Complete Feature Set</h3>
          <div className="category-list">
            <div className="category">
              <h4>🔒 Security & Privacy</h4>
              <ul>
                <li>Client-side AES-256 encryption</li>
                <li>Zero-knowledge architecture</li>
                <li>Field-level protection</li>
                <li>HMAC authentication</li>
                <li>User-specific encryption keys</li>
              </ul>
            </div>
            
            <div className="category">
              <h4>✍️ Rich Text Editing</h4>
              <ul>
                <li>Bold, italic, underline, strikethrough</li>
                <li>Text alignment (left, center, right, justify)</li>
                <li>Multiple font families & sizes</li>
                <li>Text color customization</li>
                <li>Emoji picker & special characters</li>
                <li>Date/time insertion</li>
                <li>Find & replace functionality</li>
                <li>Spell checking support</li>
                <li>Word & character count</li>
              </ul>
            </div>

            <div className="category">
              <h4>💻 Code & Development</h4>
              <ul>
                <li>Syntax highlighting for 25+ languages</li>
                <li>Python, JavaScript, C++, Java, Go, Rust</li>
                <li>HTML, CSS, TypeScript, PHP, Ruby</li>
                <li>SQL, Shell, PowerShell, YAML, JSON</li>
                <li>Atom One Dark theme for code blocks</li>
                <li>Smart paste for code snippets</li>
                <li>Proper indentation handling</li>
                <li>Language-specific formatting</li>
              </ul>
            </div>
            
            <div className="category">
              <h4>📁 Organization</h4>
              <ul>
                <li>Tags system for categorization</li>
                <li>Favorites and archive features</li>
                <li>Full-text search across all notes</li>
                <li>Smart filtering options</li>
                <li>Sidebar navigation</li>
                <li>Note sorting by date/title</li>
              </ul>
            </div>
            
            <div className="category">
              <h4>🌐 Sharing & Export</h4>
              <ul>
                <li>Public shareable links</li>
                <li>Copy to clipboard</li>
                <li>Import/export .txt & .md files</li>
                <li>Print with formatting</li>
               
              </ul>
            </div>
          </div>
        </div>
      </div>

      <footer className="homepage-footer">
        <div className="footer-content">
          <div className="footer-main">
            <div className="footer-brand">
              <div className="footer-logo">
                <FaStickyNote className="footer-logo-icon" />
                <span className="footer-brand-name">WebNote</span>
              </div>
              <p className="footer-tagline">
                Secure, powerful, and beautiful note-taking for everyone.
              </p>
            </div>
            
            <div className="footer-links">
              <div className="footer-section">
                <h4>Features</h4>
                <ul>
                  <li><FaLock /> End-to-End Encryption</li>
                  <li><FaBold /> Rich Text Editor</li>
                  <li><FaCloud /> Auto-Save & Sync</li>
                  {/* <li><FaShare /> Secure Sharing</li> */}
                </ul>
              </div>
              
              <div className="footer-section">
                <h4>Security</h4>
                <ul>
                  <li><FaShieldAlt /> Zero-Knowledge</li>
                  <li><FaKey /> AES-256 Encryption</li>
                  <li><FaUserShield /> Privacy First</li>
                  {/* <li><FaEye /> Open Source</li> */}
                </ul>
              </div>
            </div>
          </div>
          
          <div className="footer-divider"></div>
          
          <div className="footer-bottom">
            <div className="developer-credit">
              <span className="developed-by">
                Developed with <FaHeart className="heart-icon" /> by 
                <strong> amarxxanand</strong>
              </span>
            </div>
            
            <div className="footer-social">
              <a href="https://github.com/amarxxanand" target="_blank" rel="noopener noreferrer" className="social-link">
                <FaGithub />
              </a>
              <a href="https://www.linkedin.com/in/amar--anand/" target="_blank" rel="noopener noreferrer" className="social-link">
                <FaLinkedin />
              </a>
              {/* <a href="mailto:amar23079@iiitd.ac.in" className="social-link">
                <FaEnvelope />
              </a> */}
            </div>
            
            <div className="footer-copyright">
              <span>© {new Date().getFullYear()} WebNote. All rights reserved.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </ClickSpark>
  );
};

export default HomePage; 