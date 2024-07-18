const express = require('express');
const Note = require('../models/Note');
const auth = require('../middleware/auth');

const router = express.Router();

// Add a new note
router.post('/add', auth, async (req, res) => {
  const { title, content, tags, backgroundColor } = req.body;
  try {
    const newNote = new Note({
      user: req.user.id,
      title,
      content,
      tags,
      backgroundColor,
    });

    const note = await newNote.save();
    res.json(note);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get all archived notes
router.get('/archived', auth, async (req, res) => {
  try {
    const notes = await Note.find({ user: req.user.id, isArchived: true });
    res.json(notes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update a note
router.put('/update/:id', auth, async (req, res) => {
  const { title, content, tags, backgroundColor, isArchived } = req.body;
  try {
    let note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ msg: 'Note not found' });

    if (note.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    note = await Note.findByIdAndUpdate(
      req.params.id,
      { $set: { title, content, tags, backgroundColor, isArchived } },
      { new: true }
    );

    res.json(note);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Move a note to trash
router.delete('/delete/:id', auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ msg: 'Note not found' });

    if (note.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    note.deletedAt = new Date();
    await note.save();
    res.json({ msg: 'Note moved to trash' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get all notes in the trash (deleted within the last 30 days)
router.get('/trash', auth, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const notes = await Note.find({ user: req.user.id, deletedAt: { $gte: thirtyDaysAgo } });
    res.json(notes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.put('/restore/:id', auth, async (req, res) => {
  try {
    let note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ msg: 'Note not found' });

    if (note.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    note.deletedAt = null;
    await note.save();
    res.json(note);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const notes = await Note.find({
      user: req.user.id,
      deletedAt: null, // Fetch only notes that are not deleted
      isArchived: false, // Fetch only notes that are not archived
    });
    res.json(notes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.delete('/permanent-delete/:id', auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ msg: 'Note not found' });

    if (note.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await Note.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Note permanently deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
