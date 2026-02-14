'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import MarkdownEditor from "@/components/MarkdownEditor";
import RawView from "@/components/RawView";

function PageContent() {
  const searchParams = useSearchParams();
  const hasRawParams = searchParams.has('content') && searchParams.has('format');

  if (hasRawParams) {
    return <RawView />;
  }

  return <MarkdownEditor />;
}

export default function Home() {
  return (
    <Suspense>
      <PageContent />
    </Suspense>
  );
}
