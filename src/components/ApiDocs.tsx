const BASE = 'https://mdview.quanna.dev';

const API_EXAMPLES: { label: string; url: string; desc: string }[] = [
  {
    label: 'Render Markdown',
    url: `${BASE}/?content=%23%20Hello%20World%0AThis%20is%20**bold**%20text.&format=markdown`,
    desc: 'Renders Markdown content as styled HTML',
  },
  {
    label: 'Format JSON',
    url: `${BASE}/?content=%7B%22name%22%3A%22MDView%22%2C%22version%22%3A1%7D&format=json`,
    desc: 'Pretty-prints JSON with 2-space indentation',
  },
  {
    label: 'Convert JSON to TOON',
    url: `${BASE}/?content=%7B%22name%22%3A%22MDView%22%2C%22users%22%3A%5B%7B%22id%22%3A1%2C%22role%22%3A%22admin%22%7D%2C%7B%22id%22%3A2%2C%22role%22%3A%22user%22%7D%5D%7D&format=toon`,
    desc: 'Converts JSON to Token-Oriented Object Notation for AI prompts',
  },
  {
    label: 'Render HTML',
    url: `${BASE}/?content=%3Ch1%3EHello%3C%2Fh1%3E%3Cp%3ERaw%20HTML%20render%3C%2Fp%3E&format=html`,
    desc: 'Renders raw HTML content directly',
  },
];

export function ApiDocs() {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg border-2 border-gray-300 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 border-b-2 border-indigo-800 px-6 py-4">
            <h2 className="text-lg font-bold text-white">URL API</h2>
            <p className="text-indigo-200 text-sm mt-1">
              Format content via URL query parameters - no UI needed
            </p>
          </div>

          <div className="p-6 space-y-6">
            <section>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Usage</h3>
              <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-gray-100 overflow-x-auto">
                {BASE}/?<span className="text-green-400">content</span>=...&<span className="text-green-400">format</span>=<span className="text-yellow-300">json</span> | <span className="text-yellow-300">toon</span> | <span className="text-yellow-300">markdown</span> | <span className="text-yellow-300">html</span>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Parameters</h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-bold text-gray-700">Param</th>
                      <th className="px-4 py-2 text-left font-bold text-gray-700">Required</th>
                      <th className="px-4 py-2 text-left font-bold text-gray-700">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-gray-200">
                      <td className="px-4 py-2 font-mono text-indigo-600">content</td>
                      <td className="px-4 py-2">Yes</td>
                      <td className="px-4 py-2 text-gray-600">URL-encoded content to process. Use <code className="bg-gray-100 px-1 rounded text-xs">encodeURIComponent()</code></td>
                    </tr>
                    <tr className="border-t border-gray-200">
                      <td className="px-4 py-2 font-mono text-indigo-600">format</td>
                      <td className="px-4 py-2">Yes</td>
                      <td className="px-4 py-2 text-gray-600">
                        <span className="font-mono text-xs bg-gray-100 px-1 rounded">json</span>{' '}
                        <span className="font-mono text-xs bg-gray-100 px-1 rounded">toon</span>{' '}
                        <span className="font-mono text-xs bg-gray-100 px-1 rounded">markdown</span>{' '}
                        <span className="font-mono text-xs bg-gray-100 px-1 rounded">html</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Formats</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { name: 'json', desc: 'Pretty-print JSON (2-space indent)' },
                  { name: 'toon', desc: 'Convert JSON to TOON for AI/LLM prompts' },
                  { name: 'markdown', desc: 'Render Markdown as styled HTML' },
                  { name: 'html', desc: 'Render raw HTML directly' },
                ].map((f) => (
                  <div key={f.name} className="border border-gray-200 rounded-lg p-3">
                    <span className="font-mono font-bold text-indigo-600 text-sm">{f.name}</span>
                    <p className="text-gray-600 text-xs mt-1">{f.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-amber-800 text-sm">
                <strong>Note:</strong> Special characters must be URL-encoded. Use{' '}
                <code className="bg-amber-100 px-1 rounded text-xs">encodeURIComponent()</code> in JavaScript or encode manually:{' '}
                <code className="bg-amber-100 px-1 rounded text-xs">#</code> ={'>'}{' '}
                <code className="bg-amber-100 px-1 rounded text-xs">%23</code>,{' '}
                <code className="bg-amber-100 px-1 rounded text-xs">{`{`}</code> ={'>'}{' '}
                <code className="bg-amber-100 px-1 rounded text-xs">%7B</code>,{' '}
                <code className="bg-amber-100 px-1 rounded text-xs">space</code> ={'>'}{' '}
                <code className="bg-amber-100 px-1 rounded text-xs">%20</code>
              </p>
            </section>

            <section>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Try it</h3>
              <div className="space-y-3">
                {API_EXAMPLES.map((ex) => (
                  <div key={ex.label} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-sm text-gray-800">{ex.label}</h4>
                      <a
                        href={ex.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-xs transition"
                      >
                        Open
                      </a>
                    </div>
                    <p className="text-gray-500 text-xs mb-2">{ex.desc}</p>
                    <div className="bg-gray-50 rounded p-2 font-mono text-xs text-gray-700 break-all">
                      {ex.url}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">JavaScript Example</h3>
              <pre className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-gray-100 overflow-x-auto">{`const content = encodeURIComponent(JSON.stringify({
  name: "MDView",
  features: ["markdown", "json", "toon"]
}));

// Open formatted JSON
window.open(\`${BASE}/?content=\${content}&format=json\`);

// Open TOON conversion
window.open(\`${BASE}/?content=\${content}&format=toon\`);`}</pre>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
