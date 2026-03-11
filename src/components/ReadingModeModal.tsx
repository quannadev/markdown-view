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
    <div className="fixed inset-0 z-50 bg-gray-50 overflow-hidden flex flex-col">
      <div className="flex-shrink-0 bg-white border-b-2 border-gray-200 px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center shadow-sm">
        <h2 className="text-xl font-bold text-gray-800">Reading Mode</h2>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition transform hover:scale-110 active:scale-95 flex items-center justify-center"
            title="Exit Reading Mode"
          >
            <Minimize2 size={24} />
          </button>
        </div>
      </div>
      <div
        className="flex-1 overflow-auto p-4 sm:p-8 relative"
        onScroll={(e) => onScroll(e.currentTarget.scrollTop)}
      >
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-gray-200 p-8 sm:p-12">
          {isJsonContent ? (
            mdFromJsonHtml ? (
              <article
                className="max-w-none text-gray-900 prose prose-indigo"
                dangerouslySetInnerHTML={{ __html: mdFromJsonHtml }}
              />
            ) : (
              <div className="text-gray-400 text-center py-20">Converting...</div>
            )
          ) : fullscreenHtml ? (
            <article
              className="max-w-none text-gray-900 prose prose-indigo"
              dangerouslySetInnerHTML={{ __html: fullscreenHtml }}
            />
          ) : (
            <div className="text-gray-400 text-center py-20">Loading full content...</div>
          )}
        </div>
        {showScrollTop && (
          <button
            onClick={(e) => {
              e.currentTarget.parentElement?.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="fixed bottom-8 right-8 p-3 bg-white border-2 border-gray-200 text-gray-600 rounded-full shadow-lg hover:bg-gray-50 hover:text-blue-600 transition-all transform hover:scale-110 active:scale-95 z-50"
            title="Scroll to Top"
          >
            <ArrowUp size={24} />
          </button>
        )}
      </div>
    </div>
  );
}
