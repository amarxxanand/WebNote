import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  deriveUserSecret, 
  generateEncryptionMetadata, 
  encryptNoteData, 
  decryptNoteData 
} from '../utils/encryption';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: true,
  encryptionEnabled: true // Re-enable encryption for secure data storage
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Set up axios defaults
  useEffect(() => {
    if (state.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [state.token]);

  // Check for token in URL (Google OAuth redirect)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('token', token);
      window.history.replaceState({}, document.title, window.location.pathname); // Clean up URL
      window.location.reload();
    }
  }, []);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      if (state.token) {
        try {
          const response = await axios.get('/api/auth/me');
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: { user: response.data.user, token: state.token }
          });
        } catch (error) {
          localStorage.removeItem('token');
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { user, token } = response.data;
      
      localStorage.setItem('token', token);
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, token }
      });
      
      toast.success('Login successful!');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.error || 'Login failed');
      return false;
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await axios.post('/api/auth/register', { 
        name, 
        email, 
        password 
      });
      const { user, token } = response.data;
      
      localStorage.setItem('token', token);
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, token }
      });
      
      toast.success('Registration successful!');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.error || 'Registration failed');
      return false;
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    localStorage.removeItem('token');
    dispatch({ type: 'LOGOUT' });
    toast.success('Logged out successfully');
  };

  const updateUser = (userData) => {
    dispatch({ type: 'UPDATE_USER', payload: userData });
  };

  const googleLogin = () => {
    // window.location.href = '/api/auth/google';
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  // Encryption utilities
  const getUserSecret = () => {
    if (!state.user?._id) {
      throw new Error('User not authenticated');
    }
    
    console.log('🗝️ Getting user secret:', {
      hasUser: !!state.user,
      userId: state.user._id,
      hasEncryptionKey: !!state.user.encryption?.encryptionKey,
      hasEmail: !!state.user.email
    });
    
    // ALWAYS use the stable encryption key if available - this is the primary method
    if (state.user.encryption?.encryptionKey) {
      console.log('🗝️ Using stable encryption key');
      return state.user.encryption.encryptionKey;
    }
    
    // If no stable key exists, create one consistently using user ID + email
    // This ensures the same key is generated every time for the same user
    if (state.user.email && state.user._id) {
      const consistentSecret = deriveUserSecret(state.user._id, state.user.email);
      console.log('🗝️ Using consistent fallback: user ID + email');
      
      // Try to save this as the stable key for future use
      const saveStableKey = async () => {
        try {
          const response = await axios.post('/api/users/encryption/stable-key', {
            encryptionKey: consistentSecret
          });
          if (response.data.user) {
            dispatch({ type: 'UPDATE_USER', payload: response.data.user });
          }
        } catch (error) {
          console.warn('Failed to save stable encryption key:', error);
        }
      };
      
      // Save asynchronously - don't wait for it
      saveStableKey();
      
      return consistentSecret;
    }
    
    throw new Error('Unable to derive encryption key - missing user data');
  };

  const initializeEncryption = async () => {
    if (!state.user?._id) {
      console.log('🔧 Cannot initialize encryption: no user');
      return; // User not available
    }

    console.log('🔧 Initializing encryption for user:', {
      userId: state.user._id,
      email: state.user.email,
      hasSalt: !!state.user.encryption?.salt,
      hasEncryptionKey: !!state.user.encryption?.encryptionKey
    });

    // If user doesn't have encryption initialized at all
    if (!state.user.encryption?.salt) {
      try {
        console.log('🔧 Creating new encryption metadata...');
        const metadata = generateEncryptionMetadata(state.user._id);
        
        const response = await axios.patch('/api/users/encryption', {
          encryption: {
            salt: metadata.salt,
            algorithm: metadata.algorithm,
            version: metadata.version,
            enabled: true,
            created: metadata.created
          }
        });

        console.log('🔧 Encryption initialized successfully:', {
          hasSalt: !!response.data.user.encryption?.salt,
          hasEncryptionKey: !!response.data.user.encryption?.encryptionKey
        });

        dispatch({ type: 'UPDATE_USER', payload: response.data.user });
        toast.success('Encryption initialized successfully');
        return;
      } catch (error) {
        console.error('🔧 Failed to initialize encryption:', error);
        toast.error('Failed to initialize encryption');
        return;
      }
    }
    
    // If user has salt but no stable encryption key, request one
    if (state.user.encryption?.salt && !state.user.encryption?.encryptionKey) {
      try {
        console.log('� Requesting stable encryption key for user...');
        const response = await axios.post('/api/users/encryption/stable-key');
        
        if (response.data.user) {
          console.log('🔧 Stable encryption key added to user');
          dispatch({ type: 'UPDATE_USER', payload: response.data.user });
        }
      } catch (error) {
        console.warn('🔧 Failed to get stable encryption key:', error);
        // This is not critical - the fallback mechanism will handle it
      }
    }

    console.log('🔧 Encryption initialization complete');
  };

  const encryptNote = (noteData) => {
    console.log('🔐 ENCRYPT NOTE START:', {
      hasNoteData: !!noteData,
      encryptionEnabled: state.encryptionEnabled,
      hasSalt: !!state.user?.encryption?.salt,
      noteTitle: noteData?.title?.substring(0, 20) + '...',
      contentLength: noteData?.content?.length
    });

    if (!state.encryptionEnabled || !state.user?.encryption?.salt) {
      console.log('🔐 Encryption disabled or no salt, returning unencrypted');
      return noteData;
    }

    try {
      const userSecret = getUserSecret();
      const salt = state.user.encryption.salt;
      console.log('🔐 Encryption details:', {
        hasUserSecret: !!userSecret,
        saltLength: salt?.length,
        userSecretLength: userSecret?.length
      });
      
      const encryptedData = encryptNoteData(noteData, userSecret, salt);
      console.log('🔐 Encryption complete:', {
        encryptedTitleType: typeof encryptedData.title,
        encryptedContentType: typeof encryptedData.content,
        isMarkedEncrypted: encryptedData._encrypted,
        hasCiphertext: !!(encryptedData.title?.ciphertext)
      });
      
      // VERIFICATION TEST: Try to decrypt immediately to verify key consistency
      try {
        const testDecrypt = decryptNoteData(encryptedData, userSecret);
        const titleMatch = testDecrypt.title === noteData.title;
        const contentMatch = testDecrypt.content === noteData.content;
        
        console.log('🔐 ENCRYPTION VERIFICATION:', {
          titleMatch,
          contentMatch,
          originalTitleLength: noteData.title?.length || 0,
          decryptedTitleLength: testDecrypt.title?.length || 0,
          originalContentLength: noteData.content?.length || 0,
          decryptedContentLength: testDecrypt.content?.length || 0
        });
        
        if (!titleMatch || !contentMatch) {
          console.error('🔐 ENCRYPTION VERIFICATION FAILED! Key mismatch detected.');
          throw new Error('Encryption verification failed - key mismatch');
        }
        
        console.log('🔐 ENCRYPT NOTE SUCCESS - Verification passed');
      } catch (verifyError) {
        console.error('🔐 Encryption verification failed:', verifyError);
        throw verifyError;
      }
      
      return encryptedData;
    } catch (error) {
      console.error('🔐 Failed to encrypt note:', error);
      return noteData; // Return unencrypted data as fallback
    }
  };

  const decryptNote = (noteData) => {
    console.log('🔓 DECRYPT NOTE START:', {
      hasNoteData: !!noteData,
      hasUserEncryption: !!state.user?.encryption?.salt,
      isEncrypted: noteData?._encrypted,
      noteId: noteData?._id,
      titleType: typeof noteData?.title,
      contentType: typeof noteData?.content,
      hasEncryptedObjects: !!(noteData?.title?.ciphertext || noteData?.content?.ciphertext)
    });

    if (!noteData) {
      console.log('🔓 No note data, returning defaults');
      return {
        title: 'Untitled Note',
        content: '',
        tags: []
      };
    }

    // Check if data has encrypted objects (regardless of _encrypted flag)
    const hasEncryptedTitle = noteData.title && typeof noteData.title === 'object' && noteData.title.ciphertext;
    const hasEncryptedContent = noteData.content && typeof noteData.content === 'object' && noteData.content.ciphertext;
    const hasEncryptedData = hasEncryptedTitle || hasEncryptedContent;

    console.log('🔓 Encryption detection:', {
      hasEncryptedTitle,
      hasEncryptedContent, 
      hasEncryptedData,
      encryptedFlag: noteData._encrypted
    });

    // Handle legacy unencrypted data or data without encryption enabled
    if (!state.user?.encryption?.salt || (!noteData._encrypted && !hasEncryptedData)) {
      console.log('🔓 Legacy/unencrypted data, returning as-is');
      return {
        ...noteData,
        title: typeof noteData.title === 'string' ? noteData.title : 'Untitled Note',
        content: typeof noteData.content === 'string' ? noteData.content : '',
        tags: Array.isArray(noteData.tags) ? 
          noteData.tags.filter(tag => typeof tag === 'string') : []
      };
    }

    // If we have encrypted data, proceed with decryption
    console.log('🔓 Proceeding with decryption...');

    try {
      const userSecret = getUserSecret();
      console.log('🔓 User secret available:', !!userSecret);
      
      const decryptedData = decryptNoteData(noteData, userSecret);
      console.log('🔓 Decryption result:', {
        titleType: typeof decryptedData.title,
        contentType: typeof decryptedData.content,
        titleLength: typeof decryptedData.title === 'string' ? decryptedData.title.length : 'N/A',
        contentLength: typeof decryptedData.content === 'string' ? decryptedData.content.length : 'N/A',
        decryptionFailed: decryptedData._decryptionFailed
      });
      
      // Ensure we always return valid strings for React rendering
      const safeData = {
        ...decryptedData,
        title: typeof decryptedData.title === 'string' ? decryptedData.title : 'Untitled Note',
        content: typeof decryptedData.content === 'string' ? decryptedData.content : '',
        tags: Array.isArray(decryptedData.tags) ? 
          decryptedData.tags.filter(tag => typeof tag === 'string') : []
      };
      
      // Additional safety check - if any field is still an object, convert to safe string
      if (typeof safeData.title === 'object') {
        console.warn('🔓 Title is still object after decryption!');
        safeData.title = 'Encrypted Note (Title Decryption Failed)';
      }
      if (typeof safeData.content === 'object') {
        console.warn('🔓 Content is still object after decryption!');
        safeData.content = '';
      }
      if (Array.isArray(safeData.tags)) {
        safeData.tags = safeData.tags.filter(tag => typeof tag === 'string');
      } else {
        safeData.tags = [];
      }
      
      console.log('🔓 DECRYPT NOTE SUCCESS:', {
        title: safeData.title.substring(0, 20) + '...',
        contentLength: safeData.content.length
      });
      
      return safeData;
    } catch (error) {
      console.error('🔓 Failed to decrypt note:', error);
      
      // More specific error handling for key mismatches
      if (error.message?.includes('HMAC verification failed') || 
          error.message?.includes('invalid key') ||
          error.message?.includes('corrupted data')) {
        console.error('🔓 ENCRYPTION KEY MISMATCH DETECTED');
        toast.error('Note encrypted with different key - try refreshing or contact support');
        
        // Return the original encrypted data so user can see something is there
        return {
          ...noteData,
          title: `🔒 Encrypted Note (Key Mismatch) - ID: ${noteData._id?.slice(-6) || 'unknown'}`,
          content: `This note was encrypted with a different key and cannot be decrypted.\n\nNote ID: ${noteData._id}\nEncrypted: ${noteData._encrypted}\nTry logging out and logging back in.`,
          tags: [],
          _decryptionFailed: true,
          _keyMismatch: true
        };
      }
      
      // For other errors, provide more helpful information
      toast.error('Failed to decrypt note data - check console for details');
      
      return {
        ...noteData,
        title: `⚠️ Decryption Failed - ${error.message?.substring(0, 30) || 'Unknown error'}`,
        content: `Decryption failed: ${error.message}\n\nNote ID: ${noteData._id}\nError details available in browser console.`,
        tags: [],
        _decryptionFailed: true
      };
    }
  };

  // Initialize encryption on login
  useEffect(() => {
    if (state.isAuthenticated && state.user && state.encryptionEnabled) {
      console.log('🔧 Auth state changed, initializing encryption...');
      initializeEncryption();
    }
  }, [state.isAuthenticated, state.user?._id, state.encryptionEnabled]);

  const value = {
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading,
    encryptionEnabled: state.encryptionEnabled,
    login,
    register,
    logout,
    updateUser,
    googleLogin,
    initializeEncryption,
    encryptNote,
    decryptNote
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 