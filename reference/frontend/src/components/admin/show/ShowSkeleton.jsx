import React from 'react';

const ShowSkeleton = () => (
  <div className="rounded-2xl border p-5 h-44 flex gap-6 animate-pulse shadow-sm" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
    <div className="w-32 h-32 rounded-xl shrink-0 opacity-50" style={{ backgroundColor: 'var(--bg-secondary)' }} />
    <div className="flex-1 space-y-4 py-2">
      <div className="h-6 w-1/2 rounded-md opacity-50" style={{ backgroundColor: 'var(--bg-secondary)' }} />
      <div className="h-4 w-3/4 rounded-md opacity-50" style={{ backgroundColor: 'var(--bg-secondary)' }} />
      <div className="h-4 w-1/4 rounded-md mt-6 opacity-50" style={{ backgroundColor: 'var(--bg-secondary)' }} />
    </div>
  </div>
);

export default ShowSkeleton;