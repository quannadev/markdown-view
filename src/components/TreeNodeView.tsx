'use client';

import { useState } from 'react';
import { TreeNode } from '@/lib/json';

export function TreeNodeView({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div style={{ paddingLeft: depth > 0 ? 16 : 0 }}>
      <div
        className={`flex items-start gap-1 py-0.5 ${hasChildren ? 'cursor-pointer hover:bg-gray-100 rounded' : ''}`}
        onClick={hasChildren ? () => setExpanded(!expanded) : undefined}
      >
        {hasChildren && (
          <span className="text-gray-400 w-4 text-center flex-shrink-0 select-none">
            {expanded ? '▼' : '▶'}
          </span>
        )}
        {!hasChildren && <span className="w-4 flex-shrink-0" />}
        <span className="json-key font-semibold">{node.key}</span>
        <span className="text-gray-400 mx-0.5">:</span>
        {hasChildren ? (
          <span className="text-gray-500 text-xs">{String(node.value)}</span>
        ) : (
          <span className={`json-value-${node.type}`}>
            {node.type === 'string' ? `"${String(node.value)}"` : String(node.value)}
          </span>
        )}
      </div>
      {hasChildren && expanded && (
        <div>
          {node.children!.map((child, i) => (
            <TreeNodeView key={`${child.key}-${i}`} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
