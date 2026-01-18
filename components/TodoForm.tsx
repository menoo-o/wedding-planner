'use client';

import { useState } from 'react';

interface TodoFormProps {
  onAdd: (title: string, genreId: string | null) => void;
  isPending: boolean;
}

export default function TodoForm({ onAdd, isPending }: TodoFormProps) {
  const [title, setTitle] = useState<string>('');

  function handleSubmit() {
    if (!title.trim()) return;
    onAdd(title, null);
    setTitle('');
  }

  return (
    <div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="New todo..."
      />
      <button onClick={handleSubmit} disabled={isPending}>
        {isPending ? 'Adding...' : 'Add Todo'}
      </button>
    </div>
  );
}
