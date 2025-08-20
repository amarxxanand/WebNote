import React, { createContext, useContext, useReducer, useEffect, useCallback, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const NoteContext = createContext();

const initialState = {
  notes: [],
  currentNote: null,
  loading: false,
  searchQuery: '',
  filter: 'all',
  sortBy: 'lastModified',
  sortOrder: 'desc',
  totalPages: 1,
  currentPage: 1,
  total: 0
};

const noteReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_NOTES':
      return { ...state, notes: action.payload };
    case 'SET_CURRENT_NOTE':
      return { ...state, currentNote: action.payload };
    case 'ADD_NOTE':
      return { ...state, notes: [action.payload, ...state.notes] };
    case 'UPDATE_NOTE':
      return {
        ...state,
        notes: state.notes.map(note => {
          const noteId = note._id || note.id;
          const payloadId = action.payload._id || action.payload.id;
          return noteId === payloadId ? action.payload : note;
        }),
        currentNote: (() => {
          const currentNoteId = state.currentNote?._id || state.currentNote?.id;
          const payloadId = action.payload._id || action.payload.id;
          return currentNoteId === payloadId ? action.payload : state.currentNote;
        })()
      };
    case 'DELETE_NOTE':
      return {
        ...state,
        notes: state.notes.filter(note => {
          const noteId = note._id || note.id;
          return noteId !== action.payload;
        }),
        currentNote: (() => {
          const currentNoteId = state.currentNote?._id || state.currentNote?.id;
          return currentNoteId === action.payload ? null : state.currentNote;
        })()
      };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    case 'SET_FILTER':
      return { ...state, filter: action.payload };
    case 'SET_SORT':
      return { 
        ...state, 
        sortBy: action.payload.sortBy, 
        sortOrder: action.payload.sortOrder 
      };
    case 'SET_PAGINATION':
      return {
        ...state,
        totalPages: action.payload.totalPages,
        currentPage: action.payload.currentPage,
        total: action.payload.total
      };
    case 'CLEAR_NOTES':
      return { ...state, notes: [], currentNote: null };
    default:
      return state;
  }
};

export const NoteProvider = ({ children }) => {
  const [state, dispatch] = useReducer(noteReducer, initialState);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { encryptNote, decryptNote, isAuthenticated } = useAuth();

  // Initialize by fetching cloud notes
  useEffect(() => {
    if (!hasInitialized && !isLoading && isAuthenticated && decryptNote) {
      // Clean up any leftover local note data from previous versions
      localStorage.removeItem('webnote-local-notes');
      
      console.log('🔄 Initializing notes fetch with decryption available');
      setIsLoading(true);
      fetchNotes().finally(() => {
        setHasInitialized(true);
        setIsLoading(false);
      });
    }
  }, [hasInitialized, isLoading, isAuthenticated, decryptNote]);

  // Add a function to verify encryption key consistency
  const verifyEncryptionKey = useCallback(async () => {
    if (!isAuthenticated || !encryptNote || !decryptNote) {
      return true; // Skip verification if not authenticated or encryption disabled
    }
    
    try {
      // Test encryption/decryption with a sample
      const testData = { title: 'Test Title', content: 'Test Content', tags: ['test'] };
      const encrypted = encryptNote(testData);
      const decrypted = decryptNote(encrypted);
      
      const isConsistent = (
        decrypted.title === testData.title &&
        decrypted.content === testData.content &&
        Array.isArray(decrypted.tags) && decrypted.tags[0] === 'test'
      );
      
      if (!isConsistent) {
        console.error('🔑 Encryption key verification failed!');
        toast.error('Encryption key mismatch detected. Some notes may not load correctly.');
        return false;
      }
      
      console.log('🔑 Encryption key verification passed');
      return true;
    } catch (error) {
      console.error('🔑 Encryption key verification error:', error);
      toast.error('Encryption verification failed. Please try logging out and back in.');
      return false;
    }
  }, [isAuthenticated, encryptNote, decryptNote]);



  const fetchNotes = useCallback(async (page = 1) => {
    if (!decryptNote) {
      console.warn('⚠️ Decryption not available yet, skipping notes fetch');
      return;
    }
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      let cloudNotes = [];
      
      // Try to fetch cloud notes if user is authenticated
      if (localStorage.getItem('token')) {
        try {
          const params = new URLSearchParams({
            page,
            limit: 20,
            sortBy: state.sortBy,
            sortOrder: state.sortOrder,
            filter: state.filter,
            ...(state.searchQuery && { search: state.searchQuery })
          });

          const response = await axios.get(`/api/notes?${params}`);
          const rawNotes = response.data.notes || [];
          
          console.log('Fetched raw notes count:', rawNotes.length);
          if (rawNotes.length > 0) {
            console.log('Sample raw note:', {
              id: rawNotes[0]._id,
              title: typeof rawNotes[0].title,
              content: typeof rawNotes[0].content,
              _encrypted: rawNotes[0]._encrypted,
              titleHasCiphertext: rawNotes[0].title && typeof rawNotes[0].title === 'object' && !!rawNotes[0].title.ciphertext
            });
          }
          
          console.log('🔓 Starting bulk decryption of', rawNotes.length, 'notes...');
          
          // Decrypt notes after fetching
          cloudNotes = rawNotes.map((note, index) => {
            console.log(`🔓 Decrypting note ${index + 1}/${rawNotes.length}:`, note._id);
            const decrypted = decryptNote(note);
            console.log(`✅ Note ${index + 1} decrypted:`, {
              id: note._id,
              title: typeof decrypted.title === 'string' ? decrypted.title.substring(0, 30) + '...' : 'Not string',
              titleType: typeof decrypted.title,
              contentType: typeof decrypted.content,
              _decryptionFailed: decrypted._decryptionFailed,
              _keyMismatch: decrypted._keyMismatch
            });
            
            // Track decryption failures for user awareness
            if (decrypted._decryptionFailed) {
              console.warn(`❌ Note decryption failed for note ID: ${note._id}`);
            }
            if (decrypted._keyMismatch) {
              console.error(`🔑 Key mismatch for note ID: ${note._id}`);
            }
            
            return decrypted;
          });
          
          console.log('🎉 Bulk decryption complete. Decrypted notes sample:');
          if (cloudNotes.length > 0) {
            console.log('First decrypted note:', {
              id: cloudNotes[0]._id,
              title: cloudNotes[0].title,
              titleType: typeof cloudNotes[0].title,
              titlePreview: typeof cloudNotes[0].title === 'string' ? cloudNotes[0].title.substring(0, 50) + '...' : 'Not string'
            });
          }
          
          // Check if we have any decryption failures
          const failedDecryptions = cloudNotes.filter(note => note._decryptionFailed).length;
          const keyMismatches = cloudNotes.filter(note => note._keyMismatch).length;
          
          if (keyMismatches > 0) {
            toast.error(`${keyMismatches} note(s) encrypted with different key - try refreshing`);
          } else if (failedDecryptions > 0) {
            toast.warning(`${failedDecryptions} note(s) failed to decrypt properly`);
          }
          
          dispatch({ 
            type: 'SET_PAGINATION', 
            payload: { 
              totalPages: response.data.totalPages, 
              currentPage: response.data.currentPage, 
              total: response.data.total 
            } 
          });
        } catch (error) {
          console.log('No cloud notes available or user not authenticated');
        }
      }
      
      // Set only cloud notes
      dispatch({ type: 'SET_NOTES', payload: cloudNotes });
      
    } catch (error) {
      toast.error('Failed to fetch notes');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.sortBy, state.sortOrder, state.filter, state.searchQuery, decryptNote]);

  const createNote = async (noteData) => {
    try {
      // Encrypt note data before sending to server
      const encryptedData = encryptNote(noteData);
      console.log('Creating note - Original data:', { 
        title: noteData.title?.substring(0, 20) + '...', 
        contentLength: noteData.content?.length 
      });
      console.log('Creating note - Encrypted:', !!encryptedData._encrypted);
      
      const response = await axios.post('/api/notes', encryptedData);
      
      // Decrypt the response for local use
      const decryptedNote = decryptNote(response.data);
      console.log('Creating note - Decrypted note:', {
        title: typeof decryptedNote.title,
        content: typeof decryptedNote.content,
        tags: Array.isArray(decryptedNote.tags) ? 'array' : typeof decryptedNote.tags
      });
      
      dispatch({ type: 'ADD_NOTE', payload: decryptedNote });
      toast.success('Note created successfully');
      return decryptedNote;
    } catch (error) {
      toast.error('Failed to create note');
      throw error;
    }
  };

  const updateNote = async (id, noteData) => {
    try {
      console.log('=== CLIENT UPDATE NOTE START ===');
      console.log('Note ID:', id);
      console.log('Original data before encryption:', {
        title: noteData.title?.substring(0, 50) + '...',
        contentLength: noteData.content?.length,
        contentPreview: noteData.content?.substring(0, 100) + '...'
      });

      // Encrypt note data before sending to server
      const encryptedData = encryptNote(noteData);
      console.log('After encryption:', {
        titleType: typeof encryptedData.title,
        contentType: typeof encryptedData.content,
        encrypted: !!encryptedData._encrypted
      });
      
      const response = await axios.put(`/api/notes/${id}`, encryptedData);
      
      console.log('Server response:', {
        titleType: typeof response.data.title,
        contentType: typeof response.data.content,
        encrypted: !!response.data._encrypted
      });
      
      // Decrypt the response for local use
      const decryptedNote = decryptNote(response.data);
      console.log('After decryption for local use:', {
        titleType: typeof decryptedNote.title,
        contentType: typeof decryptedNote.content,
        contentLength: decryptedNote.content?.length,
        contentPreview: decryptedNote.content?.substring(0, 100) + '...'
      });
      console.log('=== CLIENT UPDATE NOTE END ===');
      
      dispatch({ type: 'UPDATE_NOTE', payload: decryptedNote });
      return decryptedNote;
    } catch (error) {
      console.error('Failed to update note:', error);
      toast.error('Failed to update note');
      throw error;
    }
  };

  const deleteNote = async (id) => {
    try {
      // Handle cloud note deletion
      await axios.delete(`/api/notes/${id}`);
      
      dispatch({ type: 'DELETE_NOTE', payload: id });
      toast.success('Note deleted successfully');
    } catch (error) {
      toast.error('Failed to delete note');
      throw error;
    }
  };

  const setCurrentNote = (note) => {
    dispatch({ type: 'SET_CURRENT_NOTE', payload: note });
  };

  const fetchNote = async (id) => {
    try {
      console.log('=== CLIENT FETCH NOTE START ===');
      console.log('Fetching note ID:', id);
      
      // Handle cloud note
      const response = await axios.get(`/api/notes/${id}`);
      console.log('Server response for fetch:', {
        titleType: typeof response.data.title,
        contentType: typeof response.data.content,
        contentLength: typeof response.data.content === 'string' ? response.data.content.length : 'N/A',
        encrypted: !!response.data._encrypted
      });
      
      const decryptedNote = decryptNote(response.data);
      console.log('After decryption for fetch:', {
        titleType: typeof decryptedNote.title,
        contentType: typeof decryptedNote.content,
        contentLength: decryptedNote.content?.length,
        contentPreview: decryptedNote.content?.substring(0, 100) + '...'
      });
      console.log('=== CLIENT FETCH NOTE END ===');
      
      dispatch({ type: 'SET_CURRENT_NOTE', payload: decryptedNote });
      return decryptedNote;
    } catch (error) {
      console.error('Failed to fetch note:', error);
      toast.error('Failed to fetch note');
      throw error;
    }
  };

  const toggleFavorite = async (id) => {
    try {
      const response = await axios.patch(`/api/notes/${id}/favorite`);
      const decryptedNote = decryptNote(response.data);
      dispatch({ type: 'UPDATE_NOTE', payload: decryptedNote });
      toast.success(decryptedNote.isFavorite ? 'Added to favorites' : 'Removed from favorites');
    } catch (error) {
      toast.error('Failed to update favorite status');
    }
  };

  const toggleArchive = async (id) => {
    try {
      const response = await axios.patch(`/api/notes/${id}/archive`);
      const decryptedNote = decryptNote(response.data);
      dispatch({ type: 'UPDATE_NOTE', payload: decryptedNote });
      toast.success(decryptedNote.isArchived ? 'Note archived' : 'Note unarchived');
    } catch (error) {
      toast.error('Failed to update archive status');
    }
  };

  const shareNote = async (id) => {
    try {
      const response = await axios.post(`/api/notes/${id}/share`);
      toast.success('Share link generated!');
      return response.data.shareLink;
    } catch (error) {
      toast.error('Failed to generate share link');
      throw error;
    }
  };

  const bulkOperation = async (action, noteIds) => {
    try {
      const response = await axios.post('/api/notes/bulk', { action, noteIds });
      await fetchNotes(state.currentPage);
      toast.success(response.data.message);
    } catch (error) {
      toast.error('Failed to perform bulk operation');
    }
  };

  const setSearchQuery = (query) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
  };

  const setFilter = (filter) => {
    dispatch({ type: 'SET_FILTER', payload: filter });
  };

  const setSort = (sortBy, sortOrder) => {
    dispatch({ type: 'SET_SORT', payload: { sortBy, sortOrder } });
  };

  const clearNotes = () => {
    dispatch({ type: 'CLEAR_NOTES' });
  };

  const value = {
    ...state,
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
    fetchNote,
    setCurrentNote,
    toggleFavorite,
    toggleArchive,
    shareNote,
    bulkOperation,
    setSearchQuery,
    setFilter,
    setSort,
    clearNotes
  };

  return (
    <NoteContext.Provider value={value}>
      {children}
    </NoteContext.Provider>
  );
};

export const useNotes = () => {
  const context = useContext(NoteContext);
  if (!context) {
    throw new Error('useNotes must be used within a NoteProvider');
  }
  return context;
};