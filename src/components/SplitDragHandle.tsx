import { RefObject } from 'react';

interface SplitDragHandleProps {
  isDraggingSplit: boolean;
  setIsDraggingSplit: (v: boolean) => void;
  setSplitRatio: (v: number) => void;
  containerRef: RefObject<HTMLDivElement | null>;
}

export function SplitDragHandle({
  isDraggingSplit,
  setIsDraggingSplit,
  setSplitRatio,
  containerRef,
}: SplitDragHandleProps) {
  return (
    <div
      className="hidden lg:flex items-center justify-center cursor-col-resize group flex-shrink-0 select-none"
      style={{ width: 8 }}
      onMouseDown={(e) => {
        e.preventDefault();
        setIsDraggingSplit(true);
        const onMouseMove = (ev: MouseEvent) => {
          if (!containerRef.current) return;
          const rect = containerRef.current.getBoundingClientRect();
          const pct = ((ev.clientX - rect.left) / rect.width) * 100;
          setSplitRatio(Math.min(80, Math.max(20, pct)));
        };
        const onMouseUp = () => {
          setIsDraggingSplit(false);
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
      }}
    >
      <div className={`w-1 h-8 rounded-full transition ${
        isDraggingSplit ? 'bg-gray-400' : 'bg-gray-200 group-hover:bg-gray-400'
      }`} />
    </div>
  );
}
