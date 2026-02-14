# MDView - Markdown & JSON Viewer

A modern web tool for viewing Markdown and JSON. Built with Next.js, deployed on Cloudflare Pages.

**Live:** [mdview.quanna.dev](https://mdview.quanna.dev)

## Features

### Markdown
- Live split-view preview with [markdown-it](https://github.com/markdown-it/markdown-it)
- Auto-format (headings, lists, code blocks spacing)
- PDF export via jsPDF + html2canvas
- Document save/load with browser LocalStorage
- Copy markdown to clipboard
- Fullscreen preview mode

### JSON
- Auto-format on paste/upload
- Collapsible tree view with color-coded types
- JSON to [TOON](https://toonformat.dev/) (Token-Oriented Object Notation) conversion for AI prompts
- File upload (.json) support
- Copy output in any format

### URL API

Format content directly via URL query parameters:

```
https://mdview.quanna.dev/?content=<encoded>&format=<type>
```

| Param | Description |
|-------|-------------|
| `content` | URL-encoded content (`encodeURIComponent()`) |
| `format` | `json` `toon` `markdown` `html` |

**Examples:**

```bash
# Render Markdown
https://mdview.quanna.dev/?content=%23%20Hello%20World&format=markdown

# Format JSON
https://mdview.quanna.dev/?content=%7B%22name%22%3A%22test%22%7D&format=json

# Convert JSON to TOON
https://mdview.quanna.dev/?content=%7B%22name%22%3A%22test%22%7D&format=toon
```

```javascript
// JavaScript usage
const content = encodeURIComponent(JSON.stringify({ name: "MDView" }));
window.open(`https://mdview.quanna.dev/?content=${content}&format=toon`);
```

## Tech Stack

- **Framework:** Next.js 16 (Static Export)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Markdown:** markdown-it
- **PDF:** jsPDF + html2canvas (lazy loaded)
- **Deploy:** Cloudflare Pages

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build

```bash
npm run build  # outputs to /out
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout + SEO metadata
│   ├── page.tsx            # Home page + URL API routing
│   └── globals.css         # Global + prose styles
├── components/
│   ├── MarkdownEditor.tsx  # Markdown editor + app shell + API docs
│   ├── JsonViewer.tsx      # JSON viewer/formatter/TOON converter
│   └── RawView.tsx         # URL API raw output renderer
└── lib/
    ├── markdown.ts         # Markdown parsing + auto-format
    ├── json.ts             # JSON format, tree, TOON encoder
    ├── storage.ts          # LocalStorage management
    └── pdf.ts              # PDF export
```

## License

MIT
