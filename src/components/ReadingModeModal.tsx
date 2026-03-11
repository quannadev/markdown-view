import { Minimize2, ArrowUp } from 'lucide-react';

interface ReadingModeModalProps {
  isJsonContent: boolean;
  mdFromJsonHtml: string;
  fullscreenHtml: string | null;
  showScrollTop: boolean;
  onClose: () => void;
  onScroll: (scrollTop: number) => void;
}

export function ReadingModeModal({
  isJsonContent,
  mdFromJsonHtml,
  fullscreenHtml,
  showScrollTop,
  onClose,
  onScroll,
}: ReadingModeModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-white overflow-hidden flex flex-col">
      <div className="flex-shrink-0 border-b border-gray-200 px-5 py-2 flex justify-between items-center">
        <h2 className="text-sm font-semibold text-gray-700">Reading Mode</h2>
        <button
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-gray-700 rounded transition"
          title="Exit Reading Mode"
        >
          <Minimize2 size={18} />
        </button>
      </div>
      <div
        className="flex-1 overflow-auto px-5 py-4 relative"
        onScroll={(e) => onScroll(e.currentTarget.scrollTop)}
      >
        {isJsonContent ? (
          mdFromJsonHtml ? (
            <article
              className="max-w-none text-gray-900"
              dangerouslySetInnerHTML={{ __html: mdFromJsonHtml }}
            />
          ) : (
            <div className="text-gray-400 text-center py-20">Converting...</div>
          )
        ) : fullscreenHtml ? (
          <article
            className="max-w-none text-gray-900"
            dangerouslySetInnerHTML={{ __html: fullscreenHtml }}
          />
        ) : (
          <div className="text-gray-400 text-center py-20">Loading full content...</div>
        )}
        {showScrollTop && (
          <button
            onClick={(e) => {
              e.currentTarget.parentElement?.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="fixed bottom-6 right-6 p-2 bg-white border border-gray-200 text-gray-400 rounded-full hover:text-gray-700 transition z-50"
            title="Scroll to Top"
          >
            <ArrowUp size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
