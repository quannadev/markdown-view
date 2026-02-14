# Markdown View - Next.js Markdown Viewer

A modern, feature-rich markdown viewer web application built with Next.js. Parse, preview, and export your markdown documents to PDF with ease.

## Features

✨ **Core Features:**
- 📝 **Parse Markdown** - Real-time markdown parsing using [markdown-it](https://github.com/markdown-it/markdown-it)
- 👁️ **Live Preview** - Split-view editor with live markdown preview
- 📄 **Export PDF** - Convert your markdown documents to PDF with a single click
- 🔧 **Auto Format** - Automatically format markdown with proper spacing and structure
- 💾 **Resume Latest** - Automatically save documents to browser local storage and resume where you left off
- 📚 **Document Management** - Create, save, delete, and organize multiple documents
- 🎨 **Beautiful UI** - Clean, modern interface built with Tailwind CSS

## Tech Stack

- **Framework:** Next.js 16 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Markdown Parser:** markdown-it
- **PDF Export:** jsPDF + html2canvas
- **Storage:** Browser LocalStorage API

## Getting Started

### Prerequisites

- Node.js 18+ (with npm, yarn, or pnpm)

### Installation

1. Navigate to the project directory:
\`\`\`bash
cd mdview
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

### Development

Start the development server:

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Build for Production

\`\`\`bash
npm run build
npm start
\`\`\`

## Usage

### Creating a New Document

1. Click the **➕ New** button to create a new document
2. Enter a document name in the input field
3. Start typing your markdown in the editor

### Editing Markdown

- Type or paste markdown in the left panel
- Live preview updates in real-time on the right panel
- Use the split view for better workflow

### Auto-Format

Click the **🔧 Format** button to automatically format your markdown:
- Adds proper spacing around headings
- Organizes lists with consistent spacing
- Formats code blocks correctly
- Normalizes line endings

### Saving Documents

- Click **💾 Save** to save your document to local storage
- Documents auto-save every 2 seconds while you're editing
- Access saved documents from the sidebar

### Exporting to PDF

1. Click **📄 Export PDF** to download your document as a PDF
2. The PDF will be generated with proper formatting and styling

### Managing Documents

- **Load Document:** Click on any document in the sidebar to open it
- **Delete Document:** Click the "Delete" button on a document in the sidebar
- **View Recent:** The sidebar shows your most recently modified documents sorted by timestamp

### Toggle Preview

Click **👁️ Hide/Show Preview** to toggle the preview panel for more editor space.

## Local Storage

All documents are stored in your browser's local storage:
- Documents persist even after closing the browser
- Each document includes metadata (name, content, timestamp)
- Storage limit depends on browser (typically 5-10MB)

## Markdown Support

The application supports all standard markdown features:

- **Headings:** \`# H1\`, \`## H2\`, etc.
- **Text Formatting:** \`**bold**\`, \`*italic*\`, \`~~strikethrough~~\`
- **Lists:** Unordered and ordered lists
- **Code:** Inline code and code blocks with syntax highlighting
- **Links:** \`[text](url)\`
- **Images:** \`![alt](url)\`
- **Blockquotes:** \`> quote\`
- **Tables:** Markdown tables
- **Horizontal Rules:** \`---\`
- **HTML:** Raw HTML support

## Project Structure

\`\`\`
mdview/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page
│   │   └── globals.css         # Global styles
│   ├── components/
│   │   └── MarkdownEditor.tsx   # Main editor component
│   └── lib/
│       ├── markdown.ts         # Markdown parsing utilities
│       ├── storage.ts          # LocalStorage management
│       └── pdf.ts              # PDF export functionality
├── public/                      # Static files
├── package.json                 # Dependencies
└── tsconfig.json               # TypeScript config
\`\`\`

## Browser Compatibility

- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Future Enhancements

- 🌙 Dark mode support
- 📤 Import/Export markdown files
- ☁️ Cloud synchronization
- 🔍 Full-text search
- 🏷️ Document tags/categories
- 🎨 Custom themes

## License

MIT License - feel free to use this project for personal or commercial purposes.

---

**Happy writing! ✍️**
