import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { FaCopy, FaPrint, FaDownload } from 'react-icons/fa';
import toast from 'react-hot-toast';
import '../styles/SharedNote.css';

const SharedNote = () => {
  const { shareLink } = useParams();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSharedNote();
  }, [shareLink]);

  const fetchSharedNote = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/notes/shared/${shareLink}`);
      setNote(response.data);
    } catch (error) {
      toast.error('Note not found or no longer available');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(note.content);
      toast.success('Content copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy content');
    }
  };

  const printNote = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${note.title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            .content { white-space: pre-wrap; line-height: 1.6; }
            .meta { color: #666; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1>${note.title}</h1>
          <div class="content">${note.content}</div>
          <div class="meta">
            <p>Shared on: ${new Date(note.lastModified).toLocaleDateString()}</p>
            <p>Word count: ${note.wordCount}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const downloadNote = () => {
    const element = document.createElement('a');
    const file = new Blob([note.content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${note.title}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (loading) {
    return (
      <div className="shared-note-loading">
        <div className="loading-spinner"></div>
        <p>Loading shared note...</p>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="shared-note-error">
        <h1>Note Not Found</h1>
        <p>This note may have been deleted or the link is invalid.</p>
      </div>
    );
  }

  return (
    <div className="shared-note">
      <div className="shared-note-header">
        <div className="note-info">
          <h1>{note.title}</h1>
          <p className="note-meta">
            Last modified: {new Date(note.lastModified).toLocaleDateString()}
            {note.tags && note.tags.length > 0 && (
              <span className="note-tags">
                Tags: {note.tags.join(', ')}
              </span>
            )}
          </p>
        </div>
        
        <div className="note-actions">
          <button onClick={copyToClipboard} className="action-btn">
            <FaCopy />
            Copy
          </button>
          <button onClick={printNote} className="action-btn">
            <FaPrint />
            Print
          </button>
          <button onClick={downloadNote} className="action-btn">
            <FaDownload />
            Download
          </button>
        </div>
      </div>
      
      <div className="note-content">
        <div className="content-text">
          {note.content}
        </div>
        
        <div className="note-stats">
          <span>Words: {note.wordCount}</span>
          <span>Characters: {note.characterCount}</span>
        </div>
      </div>
    </div>
  );
};

export default SharedNote; 