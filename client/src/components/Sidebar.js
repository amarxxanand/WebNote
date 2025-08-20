import React, { useState, useEffect } from 'react';
import { 
  FaPlus, 
  FaSearch, 
  FaStar, 
  FaArchive, 
  FaTrash, 
  FaEllipsisV,
  FaFilter
} from 'react-icons/fa';
import { useNotes } from '../contexts/NoteContext';
import '../styles/Sidebar.css';

const Sidebar = ({ 
  isOpen, 
  notes, 
  currentNote, 
  loading, 
  onCreateNote, 
  onNoteSelect 
}) => {
  const { 
    searchQuery, 
    filter, 
    setSearchQuery, 
    setFilter, 
    fetchNotes 
  } = useNotes();
  
  const [searchTerm, setSearchTerm] = useState(searchQuery);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== searchQuery) {
        setSearchQuery(searchTerm);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, searchQuery, setSearchQuery]);

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setShowFilters(false);
  };

  const getFilteredNotes = () => {
    let filtered = notes;

    if (filter === 'favorite') {
      filtered = filtered.filter(note => note.isFavorite);
    } else if (filter === 'archived') {
      filtered = filtered.filter(note => note.isArchived);
    }

    return filtered;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredNotes = getFilteredNotes();

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <div className="search-container">
          <div className="search-input-wrapper">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <button 
            className="filter-btn"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter />
          </button>
        </div>

        {showFilters && (
          <div className="filter-dropdown">
            <button 
              className={`filter-option ${filter === 'all' ? 'active' : ''}`}
              onClick={() => handleFilterChange('all')}
            >
              All Notes
            </button>
            <button 
              className={`filter-option ${filter === 'favorite' ? 'active' : ''}`}
              onClick={() => handleFilterChange('favorite')}
            >
              <FaStar />
              Favorites
            </button>
            <button 
              className={`filter-option ${filter === 'archived' ? 'active' : ''}`}
              onClick={() => handleFilterChange('archived')}
            >
              <FaArchive />
              Archived
            </button>
          </div>
        )}
      </div>

      <div className="sidebar-actions">
        <button 
          className="create-note-btn"
          onClick={onCreateNote}
        >
          <FaPlus />
          New Note
        </button>
      </div>

      <div className="notes-list">
        {loading ? (
          <div className="loading-notes">
            <div className="loading-spinner"></div>
            <p>Loading notes...</p>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="empty-notes">
            <p>No notes found</p>
            <button 
              className="create-first-note-btn"
              onClick={onCreateNote}
            >
              Create your first note
            </button>
          </div>
        ) : (
          filteredNotes.map(note => {
            const noteId = note._id || note.id;
            const currentNoteId = currentNote?._id || currentNote?.id;
            const isActive = currentNoteId === noteId;
            
            // Debug: Log what we're getting for each note
            console.log('Sidebar rendering note:', {
              id: noteId,
              titleType: typeof note.title,
              contentType: typeof note.content,
              title: typeof note.title === 'string' ? note.title.substring(0, 20) + '...' : 'Not string',
              _encrypted: note._encrypted,
              _decryptionFailed: note._decryptionFailed
            });
            
            return (
              <div
                key={noteId}
                className={`note-item ${isActive ? 'active' : ''}`}
                onClick={() => onNoteSelect(noteId)}
              >
                <div className="note-item-content">
                  <div className="note-title">
                    {typeof note.title === 'string' ? note.title : 'Encrypted Note'}
                    {note.isFavorite && <FaStar className="favorite-icon" />}
                    {note.isArchived && <FaArchive className="archive-icon" />}
                  </div>
                  <div className="note-preview">
                    {typeof note.content === 'string' ? (
                      <>
                        {note.content.substring(0, 100)}
                        {note.content.length > 100 && '...'}
                      </>
                    ) : (
                      'Content encrypted...'
                    )}
                  </div>
                  <div className="note-meta">
                    <span className="note-date">
                      {formatDate(note.lastModified)}
                    </span>
                    {note.wordCount > 0 && (
                      <span className="note-words">
                        {note.wordCount} words
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Sidebar; 