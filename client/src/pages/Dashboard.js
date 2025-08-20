import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotes } from '../contexts/NoteContext';
import Sidebar from '../components/Sidebar';
import NoteEditor from '../components/NoteEditor';
import Toolbar from '../components/Toolbar';
import EncryptionStatus from '../components/EncryptionStatus';
import toast from 'react-hot-toast';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { 
    notes, 
    currentNote, 
    loading, 
    fetchNotes, 
    createNote, 
    fetchNote,
    setCurrentNote
  } = useNotes();
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    // Only fetch if we don't have notes loaded yet
    if (notes.length === 0 && !loading) {
      fetchNotes();
    }
  }, []);

  const handleCreateNote = async () => {
    // Create a new note in the cloud
    try {
      const newNote = await createNote({
        title: 'Untitled Note',
        content: ''
      });
      if (newNote) {
        setCurrentNote(newNote);
      }
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };

  const handleNoteSelect = async (noteId) => {
    try {
      // Always fetch the latest version from server to ensure we have current content
      console.log('Selecting note:', noteId);
      const latestNote = await fetchNote(noteId);
      
      if (latestNote) {
        setCurrentNote(latestNote);
        console.log('Note selected and loaded:', latestNote.title);
      }
    } catch (error) {
      console.error('Failed to load note:', error);
      
      // Fallback to cached version if available
      const cachedNote = notes.find(note => (note._id || note.id) === noteId);
      if (cachedNote) {
        setCurrentNote(cachedNote);
        console.warn('Using cached note version');
      } else {
        toast.error('Failed to load note');
      }
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className={`dashboard ${theme}`}>
      <Toolbar 
        user={user}
        onLogout={logout}
        onToggleSidebar={toggleSidebar}
        onToggleTheme={toggleTheme}
        theme={theme}
        currentNote={currentNote}
      />
      <EncryptionStatus />
      
      <div className="dashboard-content">
        <Sidebar 
          isOpen={sidebarOpen}
          notes={notes}
          currentNote={currentNote}
          loading={loading}
          onCreateNote={handleCreateNote}
          onNoteSelect={handleNoteSelect}
        />
        
        <div className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          {currentNote ? (
            <NoteEditor 
              key={currentNote._id || currentNote.id || 'new-note'}
              note={currentNote}
              theme={theme}
            />
          ) : (
            <div className="welcome-screen">
              <div className="welcome-content">
                <h1>Welcome to WebNote</h1>
                <p>Create your first note to get started</p>
                <button 
                  className="create-note-btn"
                  onClick={handleCreateNote}
                >
                  Create New Note
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 