# WebNote - Comprehensive Note-Taking Application

A modern, feature-rich web application for creating, organizing, and sharing notes with a beautiful dark theme, comprehensive editing capabilities, and **Client-Side Field Level Encryption** for maximum security.

## 🌟 Features

### Core Features
- **Brilliant Black Theme**: Modern dark interface with gradient accents
- **Google OAuth Integration**: Secure login with Google accounts
- **🔐 Client-Side Encryption**: AES-256-CBC encryption for note content, titles, and tags
- **CRUD Operations**: Full Create, Read, Update, Delete functionality
- **Cloud Storage**: MongoDB Atlas integration for data persistence
- **Responsive Design**: Works seamlessly across all devices

### Security & Privacy
- **Zero-Knowledge Architecture**: Server cannot decrypt your notes
- **Field-Level Encryption**: Titles, content, and tags encrypted before transmission
- **User-Specific Keys**: Unique encryption keys derived per user session
- **Backward Compatibility**: Existing unencrypted notes continue to work
- **Encryption Status**: Visual indicators showing encryption status

### Note Management
- **Auto-save**: Automatic saving every 3 seconds while editing
- **Word & Character Count**: Real-time statistics
- **Find & Replace**: Powerful text search and replace functionality
- **Spellcheck**: Built-in spelling error detection
- **Print Support**: Print notes with custom formatting
- **Undo/Redo**: Text editing history (placeholder implementation)
- **Copy/Cut/Paste**: Standard text editing operations

### Rich Text Editing
- **Font Formatting**: Bold, italic, underline, strikethrough
- **Text Alignment**: Left, center, right, justify
- **Font Size**: 12px to 24px options
- **Font Family**: Arial, Times New Roman, Courier New, Georgia, Verdana
- **Character Map**: Insert special characters
- **Date & Time**: Insert current timestamp
- **Emoji Picker**: Insert emojis with visual picker
- **File Operations**: Import/export .txt and .md files

### Organization & Sharing
- **Tags System**: Organize notes with custom tags
- **Favorites**: Mark important notes
- **Archive**: Archive old notes
- **Search**: Full-text search across titles, content, and tags
- **Filters**: Filter by all, favorites, or archived notes
- **Sorting**: Sort by title, creation date, or last modified
- **Share Links**: Generate public shareable links
- **Social Sharing**: Copy to clipboard for easy distribution

### User Experience
- **Theme Toggle**: Switch between dark and light themes
- **Sidebar Navigation**: Collapsible note list
- **Real-time Updates**: Live synchronization
- **Loading States**: Smooth loading indicators
- **Toast Notifications**: User feedback for actions
- **Mobile Responsive**: Optimized for mobile devices

## 🛠️ Tech Stack

### Frontend
- **React 18**: Modern React with hooks and context
- **React Router**: Client-side routing
- **React Icons**: Comprehensive icon library
- **React Hot Toast**: Toast notifications
- **Emoji Picker React**: Emoji selection component
- **Axios**: HTTP client for API calls
- **CSS3**: Custom styling with no external CSS frameworks

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database with Mongoose ODM
- **Passport.js**: Authentication middleware
- **JWT**: JSON Web Tokens for session management
- **bcryptjs**: Password hashing
- **Helmet**: Security middleware
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: API request throttling

## 📁 Project Structure

```
WebNote/
├── client/                 # React frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   │   ├── PrivateRoute.js
│   │   │   ├── Sidebar.js
│   │   │   ├── NoteEditor.js
│   │   │   └── Toolbar.js
│   │   ├── contexts/       # React contexts
│   │   │   ├── AuthContext.js
│   │   │   └── NoteContext.js
│   │   ├── pages/          # Page components
│   │   │   ├── HomePage.js
│   │   │   ├── Dashboard.js
│   │   │   └── SharedNote.js
│   │   ├── styles/         # CSS files
│   │   │   ├── index.css
│   │   │   ├── App.css
│   │   │   ├── HomePage.css
│   │   │   ├── Dashboard.css
│   │   │   ├── Sidebar.css
│   │   │   ├── Toolbar.css
│   │   │   ├── NoteEditor.css
│   │   │   └── SharedNote.css
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── server/                 # Node.js backend
│   ├── controllers/        # Route controllers
│   ├── models/             # MongoDB models
│   │   ├── User.js
│   │   └── Note.js
│   ├── routes/             # API routes
│   │   ├── auth.js
│   │   ├── notes.js
│   │   └── users.js
│   ├── middleware/         # Custom middleware
│   │   └── auth.js
│   ├── config/             # Configuration files
│   ├── server.js           # Main server file
│   ├── config.env.example  # Environment variables template
│   └── package.json
├── package.json            # Root package.json
└── README.md
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MongoDB Atlas account (or local MongoDB)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd WebNote
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Environment Configuration

#### Server Environment
Create a `.env` file in the `server` directory:
```bash
cd server
cp config.env.example .env
```

Edit the `.env` file with your configuration:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/webnote

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here

# Session Configuration
SESSION_SECRET=your-super-secret-session-key-here

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Client URL
CLIENT_URL=http://localhost:3000
```

#### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
6. Copy Client ID and Client Secret to your `.env` file

### 4. Start the Application

#### Development Mode
```bash
# From the root directory
npm run dev
```

This will start both the server (port 5000) and client (port 3000) concurrently.

#### Production Mode
```bash
# Build the client
cd client
npm run build

# Start the server
cd ../server
npm start
```

### 5. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Health Check: http://localhost:5000/api/health

## 📖 Usage Guide

### Getting Started
1. **Visit the Homepage**: Navigate to http://localhost:3000
2. **Sign Up/Login**: Use Google OAuth or create a local account
3. **Create Your First Note**: Click "Create New Note" or use the sidebar button
4. **Start Writing**: Use the rich text editor with all available features

### Note Management
- **Create Notes**: Click the "+" button in the sidebar
- **Edit Notes**: Click on any note in the sidebar to open it
- **Save Notes**: Auto-saves every 3 seconds, or click the Save button
- **Delete Notes**: Use the trash icon in the toolbar
- **Favorite Notes**: Click the star icon to mark as favorite
- **Archive Notes**: Click the archive icon to archive

### Advanced Features
- **Search**: Use the search bar in the sidebar
- **Filter**: Use the filter dropdown to show all, favorites, or archived notes
- **Share**: Click the share button to generate a public link
- **Print**: Use the print button to print your note
- **Export**: Use the download button to save as .txt file
- **Import**: Use the upload button to import .txt or .md files

### Theme Switching
- Click the sun/moon icon in the top toolbar to toggle between dark and light themes

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/google` - Google OAuth login
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Notes
- `GET /api/notes` - Get all notes (with pagination, search, filters)
- `POST /api/notes` - Create new note
- `GET /api/notes/:id` - Get single note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note
- `PATCH /api/notes/:id/favorite` - Toggle favorite
- `PATCH /api/notes/:id/archive` - Toggle archive
- `POST /api/notes/:id/share` - Generate share link
- `GET /api/notes/shared/:shareLink` - Get shared note

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `PUT /api/users/preferences` - Update preferences

## 🎨 Customization

### Styling
All styles are written in pure CSS with no external frameworks. You can customize:
- Colors and themes in the CSS files
- Layout and spacing
- Animations and transitions
- Responsive breakpoints

### Features
- Add new toolbar buttons in `NoteEditor.js`
- Extend the note model in `server/models/Note.js`
- Add new API endpoints in the route files
- Implement additional authentication providers

## 🚀 Deployment

### Frontend Deployment
1. Build the React app: `cd client && npm run build`
2. Deploy the `build` folder to your hosting service (Netlify, Vercel, etc.)

### Backend Deployment
1. Set up a MongoDB Atlas cluster
2. Deploy to Heroku, Railway, or any Node.js hosting service
3. Set environment variables in your hosting platform
4. Update the `CLIENT_URL` in your environment variables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues or have questions:
1. Check the console for error messages
2. Verify your environment variables are set correctly
3. Ensure MongoDB is running and accessible
4. Check that all dependencies are installed

## 🔮 Future Enhancements

- [ ] Real-time collaboration
- [ ] Markdown support
- [ ] Image upload and embedding
- [ ] Note templates
- [ ] Advanced search filters
- [ ] Note versioning
- [ ] Mobile app
- [ ] Offline support
- [ ] Multi-language support
- [ ] Advanced analytics

---

**WebNote** - Your ultimate digital note-taking companion! 📝✨ 