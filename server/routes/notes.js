const express = require('express');
const Note = require('../models/Note');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all notes for user
router.get('/', auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      sortBy = 'lastModified', 
      sortOrder = 'desc',
      filter = 'all' // all, favorite, archived
    } = req.query;

    const query = { user: req.user._id };
    
    // Apply filters
    if (filter === 'favorite') {
      query.isFavorite = true;
    } else if (filter === 'archived') {
      query.isArchived = true;
    }

    // Apply search
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const notes = await Note.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-history');

    const total = await Note.countDocuments(query);

    res.json({
      notes,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching notes' });
  }
});

// Get single note
router.get('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    });

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Debug logging to see what's being retrieved
    console.log('=== NOTE FETCH RESPONSE ===');
    console.log('Note ID:', req.params.id);
    console.log('Retrieved title type:', typeof note.title, 'Length:', typeof note.title === 'string' ? note.title.length : 'N/A');
    console.log('Retrieved content type:', typeof note.content, 'Length:', typeof note.content === 'string' ? note.content.length : 'N/A');
    console.log('Encrypted field:', note._encrypted);
    console.log('===========================');

    res.json(note);
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({ error: 'Error fetching note' });
  }
});

// Create new note
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, tags, isFavorite, isArchived, metadata, _encrypted } = req.body;

    const noteData = {
      title: title || 'Untitled Note',
      content: content || '',
      tags: tags || [],
      isFavorite: isFavorite || false,
      isArchived: isArchived || false,
      metadata: metadata || {},
      user: req.user._id
    };

    // Include _encrypted field if provided
    if (_encrypted !== undefined) {
      noteData._encrypted = _encrypted;
    }

    const note = new Note(noteData);

    await note.save();
    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ error: 'Error creating note' });
  }
});

// Update note
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, content, tags, isFavorite, isArchived, metadata, _encrypted } = req.body;

    // Debug logging to see what's being saved
    console.log('=== NOTE UPDATE REQUEST ===');
    console.log('Note ID:', req.params.id);
    console.log('User ID:', req.user._id);
    console.log('Title type:', typeof title, 'Length:', typeof title === 'string' ? title.length : 'N/A');
    console.log('Content type:', typeof content, 'Length:', typeof content === 'string' ? content.length : 'N/A');
    console.log('Encrypted field:', req.body._encrypted);
    console.log('========================');

    const updateData = {
      title,
      content,
      tags,
      isFavorite,
      isArchived,
      metadata,
      lastModified: new Date()
    };

    // Include _encrypted field if provided
    if (_encrypted !== undefined) {
      updateData._encrypted = _encrypted;
    }

    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Debug what's being returned
    console.log('=== NOTE UPDATE RESPONSE ===');
    console.log('Saved title type:', typeof note.title, 'Length:', typeof note.title === 'string' ? note.title.length : 'N/A');
    console.log('Saved content type:', typeof note.content, 'Length:', typeof note.content === 'string' ? note.content.length : 'N/A');
    console.log('===========================');

    res.json(note);
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ error: 'Error updating note' });
  }
});

// Delete note
router.delete('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ 
      _id: req.params.id, 
      user: req.user._id 
    });

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting note' });
  }
});

// Toggle favorite status
router.patch('/:id/favorite', auth, async (req, res) => {
  try {
    const note = await Note.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    });

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    note.isFavorite = !note.isFavorite;
    await note.save();

    res.json(note);
  } catch (error) {
    res.status(500).json({ error: 'Error updating favorite status' });
  }
});

// Toggle archive status
router.patch('/:id/archive', auth, async (req, res) => {
  try {
    const note = await Note.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    });

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    note.isArchived = !note.isArchived;
    await note.save();

    res.json(note);
  } catch (error) {
    res.status(500).json({ error: 'Error updating archive status' });
  }
});

// Generate share link
router.post('/:id/share', auth, async (req, res) => {
  try {
    const note = await Note.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    });

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const shareLink = note.generateShareLink();
    note.isPublic = true;
    await note.save();

    res.json({ 
      shareLink: `${process.env.CLIENT_URL || 'http://localhost:3000'}/shared/${shareLink}`,
      note: note.getPublicData()
    });
  } catch (error) {
    res.status(500).json({ error: 'Error generating share link' });
  }
});

// Get shared note (public access)
router.get('/shared/:shareLink', async (req, res) => {
  try {
    const note = await Note.findOne({ 
      shareLink: req.params.shareLink,
      isPublic: true
    });

    if (!note) {
      return res.status(404).json({ error: 'Shared note not found' });
    }

    res.json(note.getPublicData());
  } catch (error) {
    res.status(500).json({ error: 'Error fetching shared note' });
  }
});

// Get note history
router.get('/:id/history', auth, async (req, res) => {
  try {
    const note = await Note.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    }).select('history');

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json(note.history);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching note history' });
  }
});

// Restore note to previous version
router.post('/:id/restore/:version', auth, async (req, res) => {
  try {
    const note = await Note.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    });

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const historyEntry = note.history.find(h => h.version === parseInt(req.params.version));
    if (!historyEntry) {
      return res.status(404).json({ error: 'Version not found' });
    }

    note.content = historyEntry.content;
    await note.save();

    res.json(note);
  } catch (error) {
    res.status(500).json({ error: 'Error restoring note version' });
  }
});

// Bulk operations
router.post('/bulk', auth, async (req, res) => {
  try {
    const { action, noteIds } = req.body;

    if (!Array.isArray(noteIds) || noteIds.length === 0) {
      return res.status(400).json({ error: 'Invalid note IDs' });
    }

    let updateData = {};
    
    switch (action) {
      case 'favorite':
        updateData = { isFavorite: true };
        break;
      case 'unfavorite':
        updateData = { isFavorite: false };
        break;
      case 'archive':
        updateData = { isArchived: true };
        break;
      case 'unarchive':
        updateData = { isArchived: false };
        break;
      case 'delete':
        await Note.deleteMany({ 
          _id: { $in: noteIds }, 
          user: req.user._id 
        });
        return res.json({ message: 'Notes deleted successfully' });
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    const result = await Note.updateMany(
      { _id: { $in: noteIds }, user: req.user._id },
      updateData
    );

    res.json({ 
      message: `Notes ${action} successfully`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Error performing bulk operation' });
  }
});

// Get note statistics
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const stats = await Note.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: null,
          totalNotes: { $sum: 1 },
          totalWords: { $sum: '$wordCount' },
          totalCharacters: { $sum: '$characterCount' },
          favoriteNotes: { $sum: { $cond: ['$isFavorite', 1, 0] } },
          archivedNotes: { $sum: { $cond: ['$isArchived', 1, 0] } }
        }
      }
    ]);

    res.json(stats[0] || {
      totalNotes: 0,
      totalWords: 0,
      totalCharacters: 0,
      favoriteNotes: 0,
      archivedNotes: 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching statistics' });
  }
});

module.exports = router; 