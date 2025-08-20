import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FaBold,
  FaItalic,
  FaUnderline,
  FaStrikethrough,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
  FaAlignJustify,
  // FaUndo,
  // FaRedo,
  FaCopy,
  FaCut,
  FaPaste,
  FaPrint,
  FaShare,
  FaStar,
  FaArchive,
  FaTrash,
  FaSave,
  FaFont,
  FaSmile,
  FaClock,
  FaSearch,
  FaExchangeAlt,
  FaSpellCheck,
  FaFileUpload,
  FaFileDownload,
  FaPalette // Add palette icon for color picker
} from 'react-icons/fa';
import { useNotes } from '../contexts/NoteContext';
import { useAuth } from '../contexts/AuthContext';
import EmojiPicker from 'emoji-picker-react';
import toast from 'react-hot-toast';
import '../styles/NoteEditor.css';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

// Helper to save and restore selection
function saveSelection(containerEl) {
  try {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !containerEl || !containerEl.contains(sel.anchorNode)) return null;
    const range = sel.getRangeAt(0);
    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(containerEl);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    const start = preSelectionRange.toString().length;
    return {
      start: start,
      end: start + range.toString().length
    };
  } catch (error) {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Error saving selection:', error);
    }
    return null;
  }
}

function restoreSelection(containerEl, savedSel) {
  try {
    if (!savedSel || !containerEl || !document.contains(containerEl)) return;
    let charIndex = 0, range = document.createRange();
    range.setStart(containerEl, 0);
    range.collapse(true);
    let nodeStack = [containerEl], node, foundStart = false, stop = false;
    while (!stop && (node = nodeStack.pop())) {
      if (node.nodeType === 3) {
        let nextCharIndex = charIndex + node.length;
        if (!foundStart && savedSel.start >= charIndex && savedSel.start <= nextCharIndex) {
          range.setStart(node, savedSel.start - charIndex);
          foundStart = true;
        }
        if (foundStart && savedSel.end >= charIndex && savedSel.end <= nextCharIndex) {
          range.setEnd(node, savedSel.end - charIndex);
          stop = true;
        }
        charIndex = nextCharIndex;
      } else {
        let i = node.childNodes.length;
        while (i--) {
          nodeStack.push(node.childNodes[i]);
        }
      }
    }
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
  } catch (error) {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Error restoring selection:', error);
    }
  }
}

const NoteEditor = ({ note, theme }) => {
  const { updateNote, deleteNote, toggleFavorite, toggleArchive, shareNote, createNote } = useNotes();
  const { encryptionEnabled, user } = useAuth();
  
  // Ensure safe initial values
  // const safeTitle = note && typeof note.title === 'string' ? note.title : '';
  // const safeContent = note && typeof note.content === 'string' ? note.content : '';
  
const safeTitle = (typeof note.title === 'string') ? note.title : 'Untitled Note';
const safeContent = (typeof note.content === 'string') ? note.content : '';

  const safeTags = note && Array.isArray(note.tags) ? 
    note.tags.filter(tag => typeof tag === 'string').join(', ') : '';
  
  const [title, setTitle] = useState(safeTitle);
  const [content, setContent] = useState(safeContent);
  const [tags, setTags] = useState(safeTags);
  const [isEditing, setIsEditing] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerPosition, setEmojiPickerPosition] = useState({ top: 0, left: 0 });
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [fontSize, setFontSize] = useState(note?.metadata?.fontSize || 16);
  const [fontFamily, setFontFamily] = useState(note?.metadata?.fontFamily || 'Arial, sans-serif');
  const [textAlign, setTextAlign] = useState(note?.metadata?.textAlign || 'left');
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false); // Track auto-save state
  const [noteId, setNoteId] = useState(note?._id || null); // Only use cloud IDs

  // Undo/Redo state
  const [history, setHistory] = useState([safeContent]);
  const [historyPointer, setHistoryPointer] = useState(0);

  const contentRef = useRef(null);
  const titleRef = useRef(null);
  const tagsRef = useRef(null);
  const emojiButtonRef = useRef(null);
  const autoSaveTimeoutRef = useRef(null);
  const [editorHtml, setEditorHtml] = useState(safeContent);
  const debounceTimeout = useRef(null);

  // Update history when content changes (but not when switching notes)
  useEffect(() => {
    if (content !== history[historyPointer] && !isAutoSaving && noteId) {
      const newHistory = history.slice(0, historyPointer + 1);
      newHistory.push(content);
      setHistory(newHistory);
      setHistoryPointer(newHistory.length - 1);
    }
    // eslint-disable-next-line
  }, [content]);

  // When note changes, save current note first and then update all fields
  useEffect(() => {
    // Save previous note before switching if there are unsaved changes
    const savePreviousNote = async () => {
      if (noteId && hasUnsavedChanges && noteId !== note?._id) {
        try {
          console.log('Saving previous note before switch:', noteId);
          const noteData = {
            title: title || 'Untitled Note',
            content,
            tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
            metadata: { fontSize, fontFamily, textAlign }
          };
          await updateNote(noteId, noteData);
          console.log('Previous note saved successfully');
        } catch (error) {
          console.warn('Failed to save previous note:', error);
        }
      }
    };
    
    if (note) {
      // First save previous note if needed
      if (noteId && hasUnsavedChanges && noteId !== note._id) {
        savePreviousNote();
      }
      
      console.log('=== NOTE SWITCH ===');
      console.log('New note ID:', note._id);
      console.log('New note title type:', typeof note.title);
      console.log('New note content type:', typeof note.content);
      console.log('===================');
      
      // Ensure we use string values for React state with additional safety checks
      const safeTitle = (typeof note.title === 'string' && note.title) || 'Untitled Note';
      const safeContent = (typeof note.content === 'string') ? note.content : '';
      const safeTags = Array.isArray(note.tags) ? 
        note.tags.filter(tag => typeof tag === 'string').join(', ') : '';
      
      // Additional debug logging for problematic cases
      if (typeof note.title === 'object') {
        console.error('ERROR: Note title is an object:', note.title);
      }
      if (typeof note.content === 'object') {
        console.error('ERROR: Note content is an object:', note.content);
      }
      
      setEditorHtml(safeContent);
      setContent(safeContent);
      setTitle(safeTitle);
      setTags(safeTags);
      setNoteId(note._id || null);
      setHasUnsavedChanges(false);
      setFontSize(note.metadata?.fontSize || 16);
      setFontFamily(note.metadata?.fontFamily || 'Arial, sans-serif');
      setTextAlign(note.metadata?.textAlign || 'left');
      
      // Reset history for the new note
      setHistory([safeContent]);
      setHistoryPointer(0);
    }
  }, [note?._id, updateNote]); // Depend on note ID and updateNote function

  // Update content editor when note changes
  useEffect(() => {
    if (contentRef.current && note && !isAutoSaving) {
      const currentContent = contentRef.current.innerHTML;
      const noteContent = note.content || '';
      
      // Always update if we're switching to a different note (different ID)
      const isDifferentNote = noteId !== note._id;
      
      if (isDifferentNote) {
        console.log('Different note detected, updating content from server');
        console.log('New note content length:', noteContent.length);
        console.log('New note content preview:', noteContent.substring(0, 100) + '...');
        
        // For different notes, always update without preserving cursor
        contentRef.current.innerHTML = noteContent;
        setContent(noteContent);
        setHistory([noteContent]);
        setHistoryPointer(0);
      } else if (currentContent !== noteContent && noteContent.trim() !== '') {
        // If same note but content differs and server has content, update local content
        // This ensures we get the latest saved content from server
        console.log('Same note but content differs, updating from server');
        console.log('Current content length:', currentContent.length);
        console.log('Server content length:', noteContent.length);
        console.log('Server content preview:', noteContent.substring(0, 100) + '...');
        
        contentRef.current.innerHTML = noteContent;
        setContent(noteContent);
      } else if (currentContent === '' && noteContent.trim() !== '') {
        // Handle case where editor is empty but server has content
        console.log('Editor empty but server has content, restoring from server');
        contentRef.current.innerHTML = noteContent;
        setContent(noteContent);
      }
    }
  }, [note?._id, note?.content, isAutoSaving, noteId]);

  // Save before leaving page
  useEffect(() => {
    const handleBeforeUnload = async (e) => {
      if (hasUnsavedChanges && noteId) {
        // Try to save before leaving
        try {
          const noteData = {
            title: title || 'Untitled Note',
            content,
            tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
            metadata: { fontSize, fontFamily, textAlign }
          };
          
          // Use sendBeacon for reliable saving when leaving page
          const payload = JSON.stringify(noteData);
          const token = localStorage.getItem('token');
          const url = `/api/notes/${noteId}`;
          
          if (navigator.sendBeacon) {
            const blob = new Blob([payload], { type: 'application/json' });
            navigator.sendBeacon(`${process.env.REACT_APP_API_URL || ''}${url}?token=${token}`, blob);
          }
        } catch (error) {
          console.warn('Failed to save before unload:', error);
        }
        
        // Show warning dialog
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, noteId, title, content, tags, fontSize, fontFamily, textAlign]);

  // Initialize content on component mount
  useEffect(() => {
    if (contentRef.current && note && contentRef.current.innerHTML === '') {
      console.log('Initializing content on mount');
      contentRef.current.innerHTML = note.content || '';
    }
  }, [note, contentRef.current]);

  // Auto-save to cloud every 3 seconds
  useEffect(() => {
    try {
      // Calculate word and character count
      const words = content.trim() ? content.trim().split(/\s+/).length : 0;
      const characters = content.length;
      setWordCount(words);
      setCharacterCount(characters);

      // Auto-save if we have content or title AND the note exists (has noteId) AND we're not currently auto-saving
      if ((content.trim() || title.trim()) && noteId && !isAutoSaving) {
        // Clear any existing timeout
        clearTimeout(autoSaveTimeoutRef.current);
        
        // Set unsaved changes flag immediately
        setHasUnsavedChanges(true);
        
        // Auto-save: save to cloud every 3 seconds
        autoSaveTimeoutRef.current = setTimeout(async () => {
          try {
            // Safety check - don't save if content became empty unexpectedly
            if (!content && !title) {
              console.warn('Skipping auto-save: Both content and title are empty');
              setIsAutoSaving(false);
              return;
            }

            // Save cursor position before auto-save
            const savedSelection = contentRef.current ? saveSelection(contentRef.current) : null;
            
            setIsAutoSaving(true); // Mark that we're auto-saving
            
            const noteData = {
              title: title || 'Untitled Note',
              content,
              tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
              metadata: { fontSize, fontFamily, textAlign }
            };
            
            console.log('Auto-saving note data:', { 
              noteId, 
              title: noteData.title.substring(0, 20) + '...', 
              contentLength: noteData.content.length,
              contentPreview: noteData.content.substring(0, 50) + '...'
            });
            
            // Update note in cloud
            const updatedNote = await updateNote(noteId, noteData);
            setHasUnsavedChanges(false);
            
            console.log('Auto-saved note to cloud successfully:', noteId);
            
            // Restore cursor position after auto-save
            setTimeout(() => {
              try {
                if (savedSelection && contentRef.current && document.activeElement === contentRef.current) {
                  restoreSelection(contentRef.current, savedSelection);
                }
                setIsAutoSaving(false); // Reset auto-save flag
              } catch (error) {
                console.warn('Error restoring selection:', error);
                setIsAutoSaving(false);
              }
            }, 100);
          } catch (error) {
            console.error('Error in auto-save:', error);
            setIsAutoSaving(false);
            setHasUnsavedChanges(true); // Keep unsaved changes flag on error
            // Don't show error toast for auto-save failures to avoid spam
          }
        }, 3000);
      }

      return () => clearTimeout(autoSaveTimeoutRef.current);
    } catch (error) {
      console.error('Error in auto-save useEffect:', error);
    }
  }, [content, title, tags, fontSize, fontFamily, textAlign, noteId, updateNote, isAutoSaving]);

  // Save to cloud manually
  const handleSave = async () => {
    try {
      // Save cursor position before manual save
      const savedSelection = contentRef.current ? saveSelection(contentRef.current) : null;
      
      const noteData = {
        title: title || 'Untitled Note',
        content,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        metadata: { fontSize, fontFamily, textAlign }
      };
      
      if (noteId) {
        // Update existing note
        await updateNote(noteId, noteData);
        console.log('Manually updated note:', noteId);
      } else {
        // Create new note
        const newNote = await createNote(noteData);
        setNoteId(newNote._id);
        console.log('Manually created new note:', newNote._id);
      }
      
      setHasUnsavedChanges(false);
      
      // Restore cursor position after manual save
      if (savedSelection && contentRef.current) {
        setTimeout(() => {
          restoreSelection(contentRef.current, savedSelection);
        }, 0);
      }
      
      return true;
    } catch (error) {
      console.error('Error in handleSave:', error);
      return false;
    }
  };

  const handleManualSave = async () => {
    const saved = await handleSave();
    if (saved) {
      toast.success('Note saved successfully to cloud');
    } else {
      toast.error('Failed to save note');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        if (!noteId) {
          toast.error('Cannot delete note: No note ID found');
          return;
        }
        
        console.log('=== DELETE DEBUG ===');
        console.log('Deleting note ID:', noteId);
        console.log('==================');
        
        // Delete from cloud
        await deleteNote(noteId);
        
        toast.success('Note deleted successfully');
        
        // Navigate away since note is deleted
        setTimeout(() => {
          // Try to navigate to dashboard, fallback to going back
          if (window.location.pathname.includes('/dashboard')) {
            // If we're in dashboard, just reload to refresh the note list
            window.location.reload();
          } else {
            // Otherwise go back or to dashboard
            try {
              window.history.back();
            } catch (navError) {
              window.location.href = '/dashboard';
            }
          }
        }, 1000);
        
      } catch (error) {
        toast.error('Failed to delete note');
        console.error('Delete error:', error);
      }
    }
  };

  const handleShare = async () => {
    try {
      if (!noteId) {
        toast.error('Cannot share note: Note not saved to cloud yet');
        return;
      }
      
      const shareLink = await shareNote(noteId);
      await navigator.clipboard.writeText(shareLink);
      toast.success('Share link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to share note');
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { 
              font-family: ${fontFamily}; 
              font-size: ${fontSize}px; 
              margin: 20px; 
              line-height: 1.6;
            }
            h1 { color: #333; }
            .content { white-space: pre-wrap; }
            .meta { color: #666; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <div class="content">${content}</div>
          <div class="meta">
            <p>Created: ${new Date(note.createdAt).toLocaleDateString()}</p>
            <p>Last modified: ${new Date(note.lastModified).toLocaleDateString()}</p>
            <p>Word count: ${wordCount}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleFindReplace = () => {
    if (!findText) return;

    const newContent = content.replace(new RegExp(findText, 'g'), replaceText);
    setContent(newContent);
    setShowFindReplace(false);
    setFindText('');
    setReplaceText('');
    toast.success('Find and replace completed');
  };

  const toggleEmojiPicker = () => {
    if (!showEmojiPicker && emojiButtonRef.current) {
      // Calculate position relative to the emoji button
      const buttonRect = emojiButtonRef.current.getBoundingClientRect();
      setEmojiPickerPosition({
        top: buttonRect.bottom + 5, // 5px below the button
        left: buttonRect.left
      });
    }
    setShowEmojiPicker(!showEmojiPicker);
  };

  const insertEmoji = (emojiObject) => {
    const emoji = emojiObject.emoji;
    setShowEmojiPicker(false);
    
    // Use lastFocusedField to determine where to insert the emoji
    if (lastFocusedField === 'title' && titleRef.current) {
      const inputElement = titleRef.current;
      const start = lastCursorPosition.start || 0;
      const end = lastCursorPosition.end || 0;
      const newValue = title.substring(0, start) + emoji + title.substring(end);
      
      setTitle(newValue);
      setHasUnsavedChanges(true);
      
      // Restore focus and cursor position
      setTimeout(() => {
        inputElement.focus();
        const newCursorPos = start + emoji.length;
        inputElement.setSelectionRange(newCursorPos, newCursorPos);
        setLastCursorPosition({ start: newCursorPos, end: newCursorPos });
      }, 0);
      return;
    }
    
    if (lastFocusedField === 'tags' && tagsRef.current) {
      const inputElement = tagsRef.current;
      const start = lastCursorPosition.start || 0;
      const end = lastCursorPosition.end || 0;
      const newValue = tags.substring(0, start) + emoji + tags.substring(end);
      
      setTags(newValue);
      setHasUnsavedChanges(true);
      
      // Restore focus and cursor position
      setTimeout(() => {
        inputElement.focus();
        const newCursorPos = start + emoji.length;
        inputElement.setSelectionRange(newCursorPos, newCursorPos);
        setLastCursorPosition({ start: newCursorPos, end: newCursorPos });
      }, 0);
      return;
    }
    
    // For contentEditable div (note content area) - default case
    if (contentRef.current) {
      contentRef.current.focus();
      setLastFocusedField('content');
      
      // Try to restore the last saved selection if available
      if (lastContentSelection) {
        restoreSelection(contentRef.current, lastContentSelection);
        
        // Wait a bit for the selection to be restored, then insert
        setTimeout(() => {
          const selection = window.getSelection();
          if (selection.rangeCount > 0) {
            // Insert emoji at the restored cursor position
            const range = selection.getRangeAt(0);
            range.deleteContents();
            
            // Create text node with emoji
            const emojiNode = document.createTextNode(emoji);
            range.insertNode(emojiNode);
            
            // Move cursor after the emoji
            range.setStartAfter(emojiNode);
            range.setEndAfter(emojiNode);
            selection.removeAllRanges();
            selection.addRange(range);
            
            // Update content state
            setContent(contentRef.current.innerHTML);
            setHasUnsavedChanges(true);
            
            // Update the saved selection
            const newSelection = saveSelection(contentRef.current);
            if (newSelection) {
              setLastContentSelection(newSelection);
            }
          } else {
            // Fallback: insert at end
            insertEmojiAtEnd();
          }
        }, 10);
      } else {
        // No saved selection, insert at current position or end
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          // Insert emoji at current cursor position
          const range = selection.getRangeAt(0);
          range.deleteContents();
          
          // Create text node with emoji
          const emojiNode = document.createTextNode(emoji);
          range.insertNode(emojiNode);
          
          // Move cursor after the emoji
          range.setStartAfter(emojiNode);
          range.setEndAfter(emojiNode);
          selection.removeAllRanges();
          selection.addRange(range);
          
          // Update content state
          setContent(contentRef.current.innerHTML);
          setHasUnsavedChanges(true);
        } else {
          // Insert at end
          insertEmojiAtEnd();
        }
      }
    }
    
    // Helper function to insert emoji at the end
    function insertEmojiAtEnd() {
      if (contentRef.current) {
        const textNode = document.createTextNode(emoji);
        contentRef.current.appendChild(textNode);
        
        // Move cursor after the emoji
        const range = document.createRange();
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        
        setContent(contentRef.current.innerHTML);
        setHasUnsavedChanges(true);
        
        // Update the saved selection
        const newSelection = saveSelection(contentRef.current);
        if (newSelection) {
          setLastContentSelection(newSelection);
        }
      }
    }
  };

  const insertDateTime = () => {
    const now = new Date();
    const dateTimeString = now.toLocaleString();
    
    // Use lastFocusedField to determine where to insert the date/time
    if (lastFocusedField === 'title' && titleRef.current) {
      const inputElement = titleRef.current;
      const start = lastCursorPosition.start || 0;
      const end = lastCursorPosition.end || 0;
      const newValue = title.substring(0, start) + dateTimeString + title.substring(end);
      
      setTitle(newValue);
      setHasUnsavedChanges(true);
      
      // Restore focus and cursor position
      setTimeout(() => {
        inputElement.focus();
        const newCursorPos = start + dateTimeString.length;
        inputElement.setSelectionRange(newCursorPos, newCursorPos);
        setLastCursorPosition({ start: newCursorPos, end: newCursorPos });
      }, 0);
      return;
    }
    
    if (lastFocusedField === 'tags' && tagsRef.current) {
      const inputElement = tagsRef.current;
      const start = lastCursorPosition.start || 0;
      const end = lastCursorPosition.end || 0;
      const newValue = tags.substring(0, start) + dateTimeString + tags.substring(end);
      
      setTags(newValue);
      setHasUnsavedChanges(true);
      
      // Restore focus and cursor position
      setTimeout(() => {
        inputElement.focus();
        const newCursorPos = start + dateTimeString.length;
        inputElement.setSelectionRange(newCursorPos, newCursorPos);
        setLastCursorPosition({ start: newCursorPos, end: newCursorPos });
      }, 0);
      return;
    }
    
    // For contentEditable div (note content area) - default case
    if (contentRef.current) {
      contentRef.current.focus();
      setLastFocusedField('content');
      
      // Try to restore the last saved selection if available
      if (lastContentSelection) {
        restoreSelection(contentRef.current, lastContentSelection);
        
        // Wait a bit for the selection to be restored, then insert
        setTimeout(() => {
          const selection = window.getSelection();
          if (selection.rangeCount > 0) {
            // Insert date/time at the restored cursor position
            const range = selection.getRangeAt(0);
            range.deleteContents();
            
            // Create text node with date/time
            const dateTimeNode = document.createTextNode(dateTimeString);
            range.insertNode(dateTimeNode);
            
            // Move cursor after the date/time
            range.setStartAfter(dateTimeNode);
            range.setEndAfter(dateTimeNode);
            selection.removeAllRanges();
            selection.addRange(range);
            
            // Update content state
            setContent(contentRef.current.innerHTML);
            setHasUnsavedChanges(true);
            
            // Update the saved selection
            const newSelection = saveSelection(contentRef.current);
            if (newSelection) {
              setLastContentSelection(newSelection);
            }
          } else {
            // Fallback: insert at end
            insertDateTimeAtEnd();
          }
        }, 10);
      } else {
        // No saved selection, insert at current position or end
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          // Insert date/time at current cursor position
          const range = selection.getRangeAt(0);
          range.deleteContents();
          
          // Create text node with date/time
          const dateTimeNode = document.createTextNode(dateTimeString);
          range.insertNode(dateTimeNode);
          
          // Move cursor after the date/time
          range.setStartAfter(dateTimeNode);
          range.setEndAfter(dateTimeNode);
          selection.removeAllRanges();
          selection.addRange(range);
          
          // Update content state
          setContent(contentRef.current.innerHTML);
          setHasUnsavedChanges(true);
        } else {
          // Insert at end
          insertDateTimeAtEnd();
        }
      }
    }
    
    // Helper function to insert date/time at the end
    function insertDateTimeAtEnd() {
      if (contentRef.current) {
        const textNode = document.createTextNode(dateTimeString);
        contentRef.current.appendChild(textNode);
        
        // Move cursor after the date/time
        const range = document.createRange();
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        
        setContent(contentRef.current.innerHTML);
        setHasUnsavedChanges(true);
        
        // Update the saved selection
        const newSelection = saveSelection(contentRef.current);
        if (newSelection) {
          setLastContentSelection(newSelection);
        }
      }
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setContent(e.target.result);
        toast.success('File loaded successfully');
      };
      reader.readAsText(file);
    }
  };

  const handleFileDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${title || 'note'}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('File downloaded successfully');
  };

  const formatText = (command) => {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    contentRef.current.focus();
    document.execCommand(command);
    setContent(contentRef.current.innerHTML);
    setHasUnsavedChanges(true);
    
    // Check formatting state after applying formatting
    setTimeout(checkFormattingState, 10);
  };



  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    setHasUnsavedChanges(true);
    console.log('Title changed:', e.target.value); // Debug log
  };
  
  const handleContentChange = useCallback((e) => {
    try {
      const html = e.currentTarget.innerHTML;
      setHasUnsavedChanges(true);
      
      console.log('Content changed, length:', html.length); // Debug log
      
      // Immediately update content state to avoid sync issues
      setContent(html);
      
      // Clear any existing debounce timeout
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    } catch (error) {
      console.error('Error in handleContentChange:', error);
    }
  }, []);

  const handleContentBlur = useCallback((e) => {
    try {
      const html = e.currentTarget.innerHTML;
      // Immediately update content on blur to ensure data is saved
      setContent(html);
      setHasUnsavedChanges(true);
      console.log('Content blur, content length:', html.length); // Debug log
    } catch (error) {
      console.error('Error in handleContentBlur:', error);
    }
  }, []);
  
  const handleTagsChange = (e) => {
    setTags(e.target.value);
    setHasUnsavedChanges(true);
    console.log('Tags changed:', e.target.value); // Debug log
  };
  const handleFontSizeChange = (e) => {
    setFontSize(Number(e.target.value));
    setHasUnsavedChanges(true);
  };
  const handleFontFamilyChange = (e) => {
    setFontFamily(e.target.value);
    setHasUnsavedChanges(true);
  };
  const handleTextAlignChange = (align) => {
    setTextAlign(align);
    setHasUnsavedChanges(true);
  };

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorValue, setColorValue] = useState('#ffffff');
  
  // State for tracking active formatting
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false
  });
  const [currentTextColor, setCurrentTextColor] = useState('#000000');
  const [lastFocusedField, setLastFocusedField] = useState('content'); // Track which field was last focused
  const [lastCursorPosition, setLastCursorPosition] = useState({ start: 0, end: 0 }); // Track cursor position
  const [lastContentSelection, setLastContentSelection] = useState(null); // Track content area selection

  // Helper function to insert text into input field
  const insertTextIntoInput = (inputRef, stateValue, setStateValue, textToInsert) => {
    const inputElement = inputRef.current;
    if (!inputElement) return false;
    
    const start = inputElement.selectionStart || 0;
    const end = inputElement.selectionEnd || 0;
    const newValue = stateValue.substring(0, start) + textToInsert + stateValue.substring(end);
    
    // Update React state
    setStateValue(newValue);
    setHasUnsavedChanges(true);
    
    // Update DOM directly and position cursor
    setTimeout(() => {
      inputElement.value = newValue;
      inputElement.focus();
      inputElement.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
      
      // Trigger React's onChange event manually
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeInputValueSetter.call(inputElement, newValue);
      const inputEvent = new Event('input', { bubbles: true });
      inputElement.dispatchEvent(inputEvent);
    }, 0);
    
    return true;
  };

  const applyTextColor = (color) => {
    contentRef.current.focus();
    document.execCommand('foreColor', false, color);
    setContent(contentRef.current.innerHTML);
    setHasUnsavedChanges(true);
    setCurrentTextColor(color);
    
    // Check formatting state after applying color
    setTimeout(checkFormattingState, 10);
  };

  // Function to check current formatting state
  const checkFormattingState = useCallback(() => {
    if (!contentRef.current) return;
    
    try {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      
      // Check formatting states
      const bold = document.queryCommandState('bold');
      const italic = document.queryCommandState('italic');
      const underline = document.queryCommandState('underline');
      const strikethrough = document.queryCommandState('strikeThrough');
      
      setActiveFormats({
        bold,
        italic,
        underline,
        strikethrough
      });
      
      // Check current text color
      const color = document.queryCommandValue('foreColor');
      if (color && color !== 'rgb(0, 0, 0)') {
        // Convert rgb to hex if needed
        const hexColor = color.startsWith('rgb') ? rgbToHex(color) : color;
        setCurrentTextColor(hexColor);
      } else {
        setCurrentTextColor('#000000');
      }
    } catch (error) {
      console.error('Error checking formatting state:', error);
    }
  }, []);

  // Helper function to convert rgb to hex
  const rgbToHex = (rgb) => {
    const result = rgb.match(/\d+/g);
    if (!result || result.length < 3) return '#000000';
    
    const r = parseInt(result[0]);
    const g = parseInt(result[1]);
    const b = parseInt(result[2]);
    
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  // Helper function to determine if a color is light or dark
  const isLightColor = (color) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
  };

  const [showCodeLangSelect, setShowCodeLangSelect] = useState(false);
  const [codeLang, setCodeLang] = useState('python');
  const codeLanguages = [
    { value: 'cpp', label: 'C++' },
    { value: 'python', label: 'Python' },
    { value: 'c', label: 'C' },
    { value: 'clojure', label: 'Clojure' },
    { value: 'css', label: 'CSS' },
    { value: 'dart', label: 'Dart' },
    { value: 'elixir', label: 'Elixir' },
    { value: 'erlang', label: 'Erlang' },
    { value: 'go', label: 'Go' },
    { value: 'groovy', label: 'Groovy' },
    { value: 'haskell', label: 'Haskell' },
    { value: 'html', label: 'HTML' },
    { value: 'java', label: 'Java' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'kotlin', label: 'Kotlin' },
    { value: 'lua', label: 'Lua' },
    
    { value: 'perl', label: 'Perl' },
    { value: 'php', label: 'PHP' },
    { value: 'powershell', label: 'PowerShell' },
    { value: 'r', label: 'R' },
    { value: 'ruby', label: 'Ruby' },
    { value: 'rust', label: 'Rust' },
    { value: 'scala', label: 'Scala' },
    { value: 'shell', label: 'Shell' },
    { value: 'sql', label: 'SQL' },
    { value: 'swift', label: 'Swift' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'yaml', label: 'YAML' }

];

  const handleKeyDown = (e) => {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    
    const anchorNode = sel.anchorNode;
    // Check if inside a code block
    const isInCodeBlock = anchorNode && (anchorNode.parentElement?.closest('code') || anchorNode.nodeName === 'CODE');
    
    if (e.key === 'Enter') {
      // If Shift+Enter, allow default behavior (line break)
      if (e.shiftKey) {
        return;
      }
      
      // If inside code block, allow default behavior
      if (isInCodeBlock) {
        return;
      }
      
      // For normal Enter, prevent default and insert proper line break
      e.preventDefault();
      
      // Use execCommand to insert a new paragraph
      document.execCommand('insertParagraph', false, null);
      
      // Update content state
      setTimeout(() => {
        setContent(contentRef.current.innerHTML);
        setHasUnsavedChanges(true);
        highlightAllCodeBlocks();
      }, 0);
    }
  };

  const insertCodeBlock = () => {
    contentRef.current.focus();
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    // Insert code block
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    code.className = `language-${codeLang}`;
    code.innerHTML = '\nPaste your code here\n';
    pre.appendChild(code);
    // Insert after current block
    let block = range.startContainer;
    while (block && block !== contentRef.current && !/^P(RE)?$/i.test(block.nodeName)) {
      block = block.parentNode;
    }
    let afterNode = null;
    if (block && block !== contentRef.current) {
      afterNode = block.nextSibling;
      block.parentNode.insertBefore(pre, afterNode);
    } else {
      contentRef.current.appendChild(pre);
    }
    // Insert a new <p><br></p> after code block
    const p = document.createElement('p');
    p.innerHTML = '<br>';
    if (pre.nextSibling) {
      pre.parentNode.insertBefore(p, pre.nextSibling);
    } else {
      pre.parentNode.appendChild(p);
    }
    // Move caret to new <p>
    setTimeout(() => {
      const newRange = document.createRange();
      newRange.setStart(p, 0);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
      setContent(contentRef.current.innerHTML);
      setHasUnsavedChanges(true);
      highlightAllCodeBlocks();
    }, 0);
    setShowCodeLangSelect(false);
  };

  const handlePaste = (e) => {
    const isCodeBlock = document.activeElement.tagName === 'CODE' || document.activeElement.closest('code');
    if (isCodeBlock) {
      e.preventDefault();
      const text = e.clipboardData.getData('text/plain');
      document.execCommand('insertText', false, text);
      setTimeout(() => {
        highlightAllCodeBlocks();
      }, 0);
    }
  };

  const highlightAllCodeBlocks = () => {
    if (!contentRef.current) return;
    const codeBlocks = contentRef.current.querySelectorAll('pre code');
    codeBlocks.forEach(block => {
      hljs.highlightElement(block);
    });
  };

  useEffect(() => {
    highlightAllCodeBlocks();
  }, [content]);

  // Cleanup timeouts on component unmount
  useEffect(() => {
    // Add document-level selection change listener
    const handleSelectionChange = () => {
      // Only check if the selection is within our editor
      const selection = window.getSelection();
      if (selection.rangeCount > 0 && contentRef.current && contentRef.current.contains(selection.anchorNode)) {
        // Use a small delay to ensure the function is available
        setTimeout(checkFormattingState, 0);
      }
    };

    // Handle click outside emoji picker
    const handleClickOutside = (event) => {
      if (showEmojiPicker && 
          emojiButtonRef.current && 
          !emojiButtonRef.current.contains(event.target) &&
          !event.target.closest('.emoji-picker-container')) {
        setShowEmojiPicker(false);
      }
    };

    // Handle window resize to update emoji picker position
    const handleResize = () => {
      if (showEmojiPicker && emojiButtonRef.current) {
        const buttonRect = emojiButtonRef.current.getBoundingClientRect();
        setEmojiPickerPosition({
          top: buttonRect.bottom + 5,
          left: buttonRect.left
        });
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', handleResize);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleResize);
    };
  }, [checkFormattingState, showEmojiPicker]); // Add showEmojiPicker as dependency

  if (!note) return null;

  return (
    <div className={`note-editor ${theme}`}>
      <div className="editor-toolbar">
        <div className="toolbar-section">
          <button onClick={handleManualSave} className="toolbar-btn" title="Save">
            <FaSave />
            Save
          </button>
          <button onClick={handleShare} className="toolbar-btn" title="Share">
            <FaShare />
            Share
          </button>
          <button onClick={handlePrint} className="toolbar-btn" title="Print">
            <FaPrint />
            Print
          </button>
        </div>

        <div className="toolbar-section">
          <button
            onClick={() => {
              if (noteId) {
                toggleFavorite(noteId);
              } else {
                toast.error('Please save the note first');
              }
            }}
            className={`toolbar-btn ${note.isFavorite ? 'active' : ''}`}
            title="Favorite"
          >
            <FaStar />
          </button>
          <button
            onClick={() => {
              if (noteId) {
                toggleArchive(noteId);
              } else {
                toast.error('Please save the note first');
              }
            }}
            className={`toolbar-btn ${note.isArchived ? 'active' : ''}`}
            title="Archive"
          >
            <FaArchive />
          </button>
          <button onClick={handleDelete} className="toolbar-btn danger" title="Delete">
            <FaTrash />
          </button>
        </div>

        <div className="toolbar-section">
          <button 
            onClick={() => formatText('bold')} 
            className={`toolbar-btn ${activeFormats.bold ? 'active' : ''}`} 
            title="Bold"
          >
            <FaBold />
          </button>
          <button 
            onClick={() => formatText('italic')} 
            className={`toolbar-btn ${activeFormats.italic ? 'active' : ''}`} 
            title="Italic"
          >
            <FaItalic />
          </button>
          <button 
            onClick={() => formatText('underline')} 
            className={`toolbar-btn ${activeFormats.underline ? 'active' : ''}`} 
            title="Underline"
          >
            <FaUnderline />
          </button>
          <button 
            onClick={() => formatText('strikeThrough')} 
            className={`toolbar-btn ${activeFormats.strikethrough ? 'active' : ''}`} 
            title="Strikethrough"
          >
            <FaStrikethrough />
          </button>
          <button
            className="toolbar-btn"
            title="Text Color"
            onClick={() => setShowColorPicker((v) => !v)}
            style={{ 
              position: 'relative',
              backgroundColor: currentTextColor !== '#000000' ? currentTextColor : undefined,
              color: currentTextColor !== '#000000' ? (isLightColor(currentTextColor) ? '#000' : '#fff') : undefined
            }}
          >
            <FaPalette />
            <input
              type="color"
              value={colorValue}
              onChange={e => {
                setColorValue(e.target.value);
                applyTextColor(e.target.value);
                setShowColorPicker(false);
              }}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'pointer',
                zIndex: 2
              }}
              tabIndex={-1}
            />
          </button>
          <button
            className="toolbar-btn"
            title="Insert Code Block"
            onClick={() => setShowCodeLangSelect(v => !v)}
          >
            <FaFont /> Code
          </button>
          {showCodeLangSelect && (
            <div style={{ position: 'fixed', zIndex: 9999, background: '#222', color: '#fff', padding: 12, borderRadius: 8, top: '80px', left: '50%', transform: 'translateX(-50%)', boxShadow: '0 4px 24px rgba(0,0,0,0.5)', border: '1px solid #444' }}>
              <select
                value={codeLang}
                onChange={e => setCodeLang(e.target.value)}
                style={{ background: '#181818', color: '#fff', border: '1px solid #666', borderRadius: 4, fontSize: 16, padding: '6px 12px', marginRight: 8 }}
              >
                {codeLanguages.map(lang => (
                  <option key={lang.value} value={lang.value} style={{ background: '#181818', color: '#fff' }}>{lang.label}</option>
                ))}
              </select>
              <button style={{ marginLeft: 8, background: '#007bff', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 16px', cursor: 'pointer' }} onClick={insertCodeBlock}>Insert</button>
              <button style={{ marginLeft: 8, background: '#444', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 16px', cursor: 'pointer' }} onClick={() => setShowCodeLangSelect(false)}>Cancel</button>
            </div>
          )}
        </div>

        <div className="toolbar-section">
          <button
            onClick={() => handleTextAlignChange('left')}
            className={`toolbar-btn ${textAlign === 'left' ? 'active' : ''}`}
            title="Align Left"
          >
            <FaAlignLeft />
          </button>
          <button
            onClick={() => handleTextAlignChange('center')}
            className={`toolbar-btn ${textAlign === 'center' ? 'active' : ''}`}
            title="Align Center"
          >
            <FaAlignCenter />
          </button>
          <button
            onClick={() => handleTextAlignChange('right')}
            className={`toolbar-btn ${textAlign === 'right' ? 'active' : ''}`}
            title="Align Right"
          >
            <FaAlignRight />
          </button>
          <button
            onClick={() => handleTextAlignChange('justify')}
            className={`toolbar-btn ${textAlign === 'justify' ? 'active' : ''}`}
            title="Justify"
          >
            <FaAlignJustify />
          </button>
        </div>



        <div className="toolbar-section">
          <button onClick={() => setShowFindReplace(!showFindReplace)} className="toolbar-btn" title="Find">
            <FaSearch />
            Find
          </button>
          <button 
            ref={emojiButtonRef}
            onClick={toggleEmojiPicker} 
            className="toolbar-btn" 
            title="Emoji"
          >
            <FaSmile />
          </button>
          <button onClick={insertDateTime} className="toolbar-btn" title="Insert Date/Time">
            <FaClock />
          </button>
        </div>

        <div className="toolbar-section">
          <label className="file-upload-btn" title="Upload File">
            <FaFileUpload />
            <input
              type="file"
              accept=".txt,.md"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </label>
          <button onClick={handleFileDownload} className="toolbar-btn" title="Download File">
            <FaFileDownload />
          </button>
        </div>

        <div className="toolbar-section">
          <select
            value={fontSize}
            onChange={handleFontSizeChange}
            className="font-size-select"
            title="Font Size"
          >
            <option value={12}>12px</option>
            <option value={14}>14px</option>
            <option value={16}>16px</option>
            <option value={18}>18px</option>
            <option value={20}>20px</option>
            <option value={24}>24px</option>
            <option value={32}>32px</option>
            <option value={40}>40px</option>
            <option value={48}>48px</option>
            <option value={56}>56px</option>
            <option value={64}>64px</option>
            <option value={72}>72px</option>
            <option value={80}>80px</option>
            <option value={96}>96px</option>
            <option value={104}>104px</option>
            <option value={112}>112px</option>
            <option value={120}>120px</option>
            <option value={128}>128px</option>
            <option value={136}>136px</option>
            <option value={144}>144px</option>

          </select>

          <select
            value={fontFamily}
            onChange={handleFontFamilyChange}
            className="font-family-select"
            title="Font Family"
          >
            <option value="Arial, sans-serif" style={{ fontFamily: 'Arial, sans-serif' }}>Arial</option>
            <option value="Arial Black, sans-serif" style={{ fontFamily: 'Arial Black, sans-serif' }}>Arial Black</option>
            <option value="Bookman Old Style, serif" style={{ fontFamily: 'Bookman Old Style, serif' }}>Bookman Old Style</option>
            <option value="Brush Script MT, cursive" style={{ fontFamily: 'Brush Script MT, cursive' }}>Brush Script MT</option>
            <option value="Calibri, Candara, Segoe, Segoe UI, Optima, Arial, sans-serif" style={{ fontFamily: 'Calibri, Candara, Segoe, Segoe UI, Optima, Arial, sans-serif' }}>Calibri</option>
            <option value="Candara, Calibri, Segoe, Segoe UI, Optima, Arial, sans-serif" style={{ fontFamily: 'Candara, Calibri, Segoe, Segoe UI, Optima, Arial, sans-serif' }}>Candara</option>
            <option value="Century Gothic, sans-serif" style={{ fontFamily: 'Century Gothic, sans-serif' }}>Century Gothic</option>
            <option value="Charcoal, Geneva, sans-serif" style={{ fontFamily: 'Charcoal, Geneva, sans-serif' }}>Charcoal</option>
            <option value="Comic Sans MS, cursive" style={{ fontFamily: 'Comic Sans MS, cursive' }}>Comic Sans MS</option>
            <option value="Consolas, monospace" style={{ fontFamily: 'Consolas, monospace' }}>Consolas</option>
            <option value="Copperplate, Papyrus, fantasy" style={{ fontFamily: 'Copperplate, Papyrus, fantasy' }}>Copperplate</option>
            <option value="Courier New, monospace" style={{ fontFamily: 'Courier New, monospace' }}>Courier New</option>
            <option value="Futura, sans-serif" style={{ fontFamily: 'Futura, sans-serif' }}>Futura</option>
            <option value="Franklin Gothic Medium, Arial Narrow, Arial, sans-serif" style={{ fontFamily: 'Franklin Gothic Medium, Arial Narrow, Arial, sans-serif' }}>Franklin Gothic Medium</option>
            <option value="Garamond, serif" style={{ fontFamily: 'Garamond, serif' }}>Garamond</option>
            <option value="Geneva, Tahoma, Verdana, sans-serif" style={{ fontFamily: 'Geneva, Tahoma, Verdana, sans-serif' }}>Geneva</option>
            <option value="Georgia, serif" style={{ fontFamily: 'Georgia, serif' }}>Georgia</option>
            <option value="Gill Sans, Gill Sans MT, Calibri, sans-serif" style={{ fontFamily: 'Gill Sans, Gill Sans MT, Calibri, sans-serif' }}>Gill Sans</option>
            <option value="Impact, sans-serif" style={{ fontFamily: 'Impact, sans-serif' }}>Impact</option>
            <option value="Lucida Console, monospace" style={{ fontFamily: 'Lucida Console, monospace' }}>Lucida Console</option>
            <option value="Lucida Sans Unicode, Lucida Grande, sans-serif" style={{ fontFamily: 'Lucida Sans Unicode, Lucida Grande, sans-serif' }}>Lucida Sans Unicode</option>
            <option value="Monaco, monospace" style={{ fontFamily: 'Monaco, monospace' }}>Monaco</option>
            <option value="Optima, Segoe, Segoe UI, Candara, Calibri, Arial, sans-serif" style={{ fontFamily: 'Optima, Segoe, Segoe UI, Candara, Calibri, Arial, sans-serif' }}>Optima</option>
            <option value="Palatino, serif" style={{ fontFamily: 'Palatino, serif' }}>Palatino</option>
            <option value="Rockwell, Courier Bold, Courier, Georgia, Times, Times New Roman, serif" style={{ fontFamily: 'Rockwell, Courier Bold, Courier, Georgia, Times, Times New Roman, serif' }}>Rockwell</option>
            <option value="Segoe UI, Tahoma, Geneva, Verdana, sans-serif" style={{ fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif' }}>Segoe UI</option>
            <option value="Tahoma, sans-serif" style={{ fontFamily: 'Tahoma, sans-serif' }}>Tahoma</option>
            <option value="Times New Roman, serif" style={{ fontFamily: 'Times New Roman, serif' }}>Times New Roman</option>
            <option value="Trebuchet MS, sans-serif" style={{ fontFamily: 'Trebuchet MS, sans-serif' }}>Trebuchet MS</option>
            <option value="Verdana, sans-serif" style={{ fontFamily: 'Verdana, sans-serif' }}>Verdana</option>
          </select>
        </div>
      </div>

      {showFindReplace && (
        <div className="find-replace-panel">
          <input
            type="text"
            placeholder="Find..."
            value={findText}
            onChange={(e) => setFindText(e.target.value)}
            className="find-input"
          />
          <input
            type="text"
            placeholder="Replace with..."
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            className="replace-input"
          />
          <button onClick={handleFindReplace} className="replace-btn">
            <FaExchangeAlt />
            Replace All
          </button>
          <button onClick={() => setShowFindReplace(false)} className="close-btn">
            ×
          </button>
        </div>
      )}

      {showEmojiPicker && (
        <div 
          className="emoji-picker-container"
          style={{
            position: 'fixed',
            top: `${emojiPickerPosition.top}px`,
            left: `${emojiPickerPosition.left}px`,
            zIndex: 9999,
            maxWidth: '400px',
            maxHeight: '300px'
          }}
        >
          <EmojiPicker 
            onEmojiClick={insertEmoji}
            width={380}
            height={280}
            previewConfig={{
              showPreview: false
            }}
            searchDisabled={false}
            skinTonesDisabled={true}
            categories={[
              'smileys_people',
              'animals_nature', 
              'food_drink',
              'activities',
              'travel_places',
              'objects',
              'symbols',
              'flags'
            ]}
          />
        </div>
      )}

      <div className="editor-content">
        <div className="note-header">
          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Note title"
            className="note-title-input"
            onFocus={() => {
              setIsEditing(true);
              setLastFocusedField('title');
            }}
            onBlur={(e) => {
              const input = e.target;
              setLastCursorPosition({ start: input.selectionStart, end: input.selectionEnd });
            }}
            onClick={(e) => {
              const input = e.target;
              setLastCursorPosition({ start: input.selectionStart, end: input.selectionEnd });
            }}
            onKeyUp={(e) => {
              const input = e.target;
              setLastCursorPosition({ start: input.selectionStart, end: input.selectionEnd });
            }}
          />
          <input
            ref={tagsRef}
            type="text"
            value={tags}
            onChange={handleTagsChange}
            placeholder="Tags (comma separated)..."
            className="note-tags-input"
            onFocus={() => {
              setIsEditing(true);
              setLastFocusedField('tags');
            }}
            onBlur={(e) => {
              const input = e.target;
              setLastCursorPosition({ start: input.selectionStart, end: input.selectionEnd });
            }}
            onClick={(e) => {
              const input = e.target;
              setLastCursorPosition({ start: input.selectionStart, end: input.selectionEnd });
            }}
            onKeyUp={(e) => {
              const input = e.target;
              setLastCursorPosition({ start: input.selectionStart, end: input.selectionEnd });
            }}
          />
        </div>

        <div
          ref={contentRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleContentChange}
          onBlur={(e) => {
            handleContentBlur(e);
            // Save the current selection when losing focus
            const savedSelection = saveSelection(contentRef.current);
            if (savedSelection) {
              setLastContentSelection(savedSelection);
            }
          }}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsEditing(true);
            setLastFocusedField('content');
            checkFormattingState();
          }}
          onClick={(e) => {
            // Save selection on click
            setTimeout(() => {
              const savedSelection = saveSelection(contentRef.current);
              if (savedSelection) {
                setLastContentSelection(savedSelection);
              }
            }, 0);
          }}
          onKeyUp={(e) => {
            checkFormattingState();
            // Save selection on key up
            const savedSelection = saveSelection(contentRef.current);
            if (savedSelection) {
              setLastContentSelection(savedSelection);
            }
          }}
          onMouseUp={(e) => {
            checkFormattingState();
            // Save selection on mouse up
            const savedSelection = saveSelection(contentRef.current);
            if (savedSelection) {
              setLastContentSelection(savedSelection);
            }
          }}
          placeholder="Start writing your note..."
          className="note-content-editable"
          style={{
            fontSize: `${fontSize}px`,
            fontFamily: fontFamily,
            textAlign: textAlign,
            minHeight: '300px',
            background: 'var(--editor-bg, #181818)',
            color: 'var(--editor-fg, #fff)',
            borderRadius: '8px',
            padding: '16px',
            outline: 'none',
            border: '1px solid #333',
            marginTop: '12px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        />

        <div className="editor-footer">
          <div className="word-count">
            <span>{wordCount} words</span>
            <span>{characterCount} characters</span>
            {noteId && <span>ID: {noteId}</span>}
            {encryptionEnabled && user?.encryption?.salt && (
              <span style={{ color: '#22c55e' }}>🔒 Encrypted</span>
            )}
          </div>
          <div className="auto-save-indicator">
            {isAutoSaving && <span>Auto-saving to cloud...</span>}
            {!isAutoSaving && hasUnsavedChanges && <span>Unsaved changes</span>}
            {!isAutoSaving && !hasUnsavedChanges && noteId && <span>Saved to cloud</span>}
            {!isAutoSaving && !hasUnsavedChanges && !noteId && <span>Ready to create new note</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteEditor;