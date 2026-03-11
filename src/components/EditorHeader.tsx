export function EditorHeader() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 print:hidden">
      <div className="px-4 sm:px-6 py-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <h1 className="text-lg font-bold text-gray-900">MDView</h1>
          <span className="text-gray-400 text-xs hidden sm:inline">v0.1.0</span>
        </div>
        <a
          href="/intro"
          className="text-sm text-gray-500 hover:text-gray-900 transition"
        >
          Features
        </a>
      </div>
    </header>
  );
}
