# Markdown View - Development Instructions

## Project Overview

This is a Next.js-based markdown viewer application with the following features:
- Real-time markdown parsing and preview
- PDF export functionality
- Auto-formatting for markdown
- Local storage for document persistence
- Document management (create, edit, delete, save)

## Tech Stack

- **Framework:** Next.js 16 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Markdown Parser:** markdown-it
- **PDF Export:** jsPDF + html2canvas
- **Storage:** Browser LocalStorage API

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout with metadata
│   ├── page.tsx                # Home page (uses MarkdownEditor)
│   └── globals.css             # Global styles and custom prose styling
├── components/
│   └── MarkdownEditor.tsx       # Main editor component (client-side)
└── lib/
    ├── markdown.ts             # parseMarkdown() and autoFormat()
    ├── storage.ts              # LocalStorage management functions
    └── pdf.ts                  # exportPDF() function
```

## Key Files and Their Purposes

### Components

**MarkdownEditor.tsx:**
- Main client component handling all UI and user interactions
- Manages markdown state, document list, and preview
- Features: new doc, save, format, export PDF, toggle preview
- Auto-saves every 2 seconds
- Sidebar shows recent documents sorted by timestamp

### Utilities

**markdown.ts:**
- `parseMarkdown(content)` - Converts markdown to HTML using markdown-it
- `autoFormat(content)` - Formats markdown with proper spacing

**storage.ts:**
- `saveDocument()` - Save new document
- `updateDocument()` - Update existing document
- `getDocuments()` - Get all documents
- `getDocument()` - Get specific document
- `deleteDocument()` - Delete document
- Document selection functions (getCurrentDocument, setCurrentDocument)

**pdf.ts:**
- `exportPDF(filename, htmlContent, title)` - Exports rendered markdown to PDF
- Uses jsPDF for PDF generation
- Uses html2canvas for rendering HTML to image

## Development Guidelines

### Component Development
- All markdown processing is client-side (marked with 'use client')
- Use React hooks for state management
- LocalStorage is only accessed in useEffect hooks for proper hydration

### Styling
- Use Tailwind CSS utility classes
- Custom prose styling in globals.css for markdown preview
- Responsive design: mobile-first approach with lg: breakpoints

### Adding Features
1. Update MarkdownEditor.tsx for UI changes
2. Add utilities to lib/ as needed
3. Ensure client/server boundaries are respected
4. Add TypeScript types for better type safety

## Running the Project

### Development
```bash
npm run dev
```
Opens at http://localhost:3000

### Build
```bash
npm run build
npm start
```

### Lint
```bash
npm run lint
```

## Common Tasks

### Add a new button to the toolbar
1. Add button element in MarkdownEditor.tsx header section
2. Create handler function (handleNewFeature)
3. Wire up onClick to handler
4. Add corresponding logic/utilities if needed

### Modify markdown formatting
1. Edit autoFormat() in lib/markdown.ts
2. Test with various markdown samples

### Improve PDF export
1. Edit exportPDF() in lib/pdf.ts
2. Adjust html2canvas or jsPDF settings as needed

### Enhance styling
1. Update globals.css for prose elements
2. Update component classes for layout/styling

## Common Issues and Solutions

### Issue: "self is not defined"
- **Cause:** Using browser-only library without 'use client' directive
- **Solution:** Ensure components with browser APIs have 'use client' at top

### Issue: LocalStorage data not persisting
- **Cause:** Accessing localStorage during SSR
- **Solution:** Check for 'window' object or use useEffect hooks

### Issue: PDF export not working
- **Cause:** html2canvas rendering issues
- **Solution:** Check for CORS issues, ensure proper HTML structure

## Performance Considerations

- Real-time preview uses debounced updates (2-second auto-save interval)
- Markdown parsing is efficient with markdown-it
- LocalStorage operations are synchronous but minimal
- PDF export happens client-side to avoid server load

## Browser Support

- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

Note: LocalStorage might be disabled in private browsing mode in some browsers.

## Future Enhancement Ideas

- Dark mode toggle
- Import/export markdown files (.md)
- Cloud synchronization
- Full-text search
- Document tags/categories
- Keyboard shortcuts (Ctrl+S, Ctrl+N, etc.)
- Syntax highlighting for code blocks
- Custom themes
- Document sharing via URL

## Deployment

This project can be deployed to:
- Vercel (recommended - seamless Next.js integration)
- Netlify
- Docker container
- Any Node.js hosting

For Vercel: Simply connect the GitHub repo and it will auto-deploy.

## Testing

Current coverage:
- Manual testing through browser
- No automated tests yet

Future: Add Jest + React Testing Library tests

## Debugging Tips

1. Use React Developer Tools browser extension
2. Check browser DevTools console for errors
3. Verify LocalStorage data in DevTools > Application > Local Storage
4. Use Next.js DevTools for component profiling
