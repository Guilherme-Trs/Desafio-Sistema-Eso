import React from 'react';

export function Toast({msg, type='info'}) {
  if(!msg) return null;
  const bg = type === 'error' ? 'bg-red-600' : 'bg-green-600';
  return (
    <div className={`fixed top-6 right-6 z-50 ${bg} text-white px-4 py-2 rounded-md shadow`}>
      {msg}
    </div>
  );
}
