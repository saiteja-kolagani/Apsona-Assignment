document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const noteForm = document.getElementById('noteForm');
  const notesDiv = document.getElementById('notes');
  const notesApp = document.getElementById('notesApp');
  const authDiv = document.getElementById('auth');

  let token = localStorage.getItem('token');

  if (token) {
    authDiv.style.display = 'none';
    notesApp.style.display = 'block';
    fetchNotes();
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
        token = data.token;
        authDiv.style.display = 'none';
        notesApp.style.display = 'block';
        fetchNotes();
      } else {
        console.error('Login failed:', data.msg);
      }
    } catch (error) {
      console.error('Error logging in:', error);
    }
  });

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
        token = data.token;
        authDiv.style.display = 'none';
        notesApp.style.display = 'block';
        fetchNotes();
      } else {
        console.error('Registration failed:', data.msg);
      }
    } catch (error) {
      console.error('Error registering:', error);
    }
  });

  noteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('noteTitle').value;
    const content = document.getElementById('noteContent').value;
    const tags = document.getElementById('noteTags').value.split(',').map(tag => tag.trim());
    const backgroundColor = document.getElementById('noteColor').value;

    try {
      const res = await fetch('/api/notes/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
        body: JSON.stringify({ title, content, tags, backgroundColor }),
      });

      const note = await res.json();
      addNoteToDOM(note);
    } catch (error) {
      console.error('Error adding note:', error);
    }
  });

  async function fetchNotes() {
    try {
      const res = await fetch('/api/notes', {
        headers: { 'x-auth-token': token },
      });

      const notes = await res.json();
      notesDiv.innerHTML = ''; // Clear existing notes
      notes.forEach(addNoteToDOM);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  }

  function addNoteToDOM(note) {
    const div = document.createElement('div');
    div.classList.add('note');
    div.style.backgroundColor = note.backgroundColor;
    div.innerHTML = `
      <h3>${note.title}</h3>
      <p>${note.content}</p>
      <p><strong>Tags:</strong> ${note.tags.join(', ')}</p>
      ${note.deletedAt ? `<button class="button btn-restore" onclick="restoreNote('${note._id}')">Restore</button>
      <button class="button btn-delete-per" onclick="permanentlyDeleteNote('${note._id}')">Permanently Delete</button>` : `
      <button class="button btn-archive" onclick="archiveNote('${note._id}', ${note.isArchived})">${note.isArchived ? 'Unarchive' : 'Archive'}</button>
      <button class="button btn-delete" onclick="deleteNote('${note._id}')">Delete</button>`}
    `;
    div.setAttribute('data-tags', note.tags.join(', '));
    div.setAttribute('data-title', note.title);
    div.setAttribute('data-content', note.content);
    notesDiv.appendChild(div);
  }

  window.archiveNote = async (noteId, isArchived) => {
    try {
      const res = await fetch(`/api/notes/update/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
        body: JSON.stringify({ isArchived: !isArchived }),
      });

      const note = await res.json();
      if (note) {
        notesDiv.innerHTML = '';
        fetchNotes();
      }
    } catch (error) {
      console.error('Error archiving note:', error);
    }
  };

  window.deleteNote = async (noteId) => {
    try {
      const res = await fetch(`/api/notes/delete/${noteId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
      });

      const data = await res.json();
      if (data.msg) {
        notesDiv.innerHTML = '';
        fetchNotes();
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  window.restoreNote = async (noteId) => {
    try {
      const res = await fetch(`/api/notes/restore/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
      });

      const note = await res.json();
      if (note) {
        notesDiv.innerHTML = '';
        fetchNotes();
      }
    } catch (error) {
      console.error('Error restoring note:', error);
    }
  };

  window.permanentlyDeleteNote = async (noteId) => {
    try {
      const res = await fetch(`/api/notes/permanent-delete/${noteId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
      });

      const data = await res.json();
      if (data.msg) {
        notesDiv.innerHTML = '';
        fetchNotes();
      }
    } catch (error) {
      console.error('Error permanently deleting note:', error);
    }
  };

  window.viewTrash = async () => {
    try {
      const res = await fetch('/api/notes/trash', {
        headers: { 'x-auth-token': token },
      });

      const notes = await res.json();
      notesDiv.innerHTML = '';
      notes.forEach(addNoteToDOM);
    } catch (error) {
      console.error('Error fetching trash notes:', error);
    }
  };

  window.filterByLabel = () => {
    const labelInput = document.getElementById('labelInput').value.toLowerCase();
    const notes = document.querySelectorAll('.note');
    notes.forEach(note => {
      const tags = note.getAttribute('data-tags').toLowerCase();
      if (tags.includes(labelInput)) {
        note.style.display = '';
      } else {
        note.style.display = 'none';
      }
    });
  };

  window.searchNotes = () => {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const notes = document.querySelectorAll('.note');
    notes.forEach(note => {
      const title = note.getAttribute('data-title').toLowerCase();
      const content = note.getAttribute('data-content').toLowerCase();
      const tags = note.getAttribute('data-tags').toLowerCase();
      if (title.includes(searchInput) || content.includes(searchInput) || tags.includes(searchInput)) {
        note.style.display = '';
      } else {
        note.style.display = 'none';
      }
    });
  };

  window.viewArchivedNotes = async () => {
    try {
      const res = await fetch('/api/notes/archived', {
        headers: { 'x-auth-token': token },
      });

      const notes = await res.json();
      notesDiv.innerHTML = '';
      notes.forEach(addNoteToDOM);
    } catch (error) {
      console.error('Error fetching archived notes:', error);
    }
  };

  window.logout = () => {
    localStorage.removeItem('token');
    authDiv.style.display = 'block';
    notesApp.style.display = 'none';
    notesDiv.innerHTML = '';
  };

  // Make fetchNotes globally accessible
  window.fetchNotes = fetchNotes;
});
