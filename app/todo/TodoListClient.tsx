// app/todo/TodoListClient.tsx
'use client';

import { useOptimistic, useTransition } from 'react';
import { addTodo } from './actions';
import TodoForm from '@/components/TodoForm';
import { Todo } from '@/lib/types';

interface TodoListClientProps {
  todos: Todo[];
}

export default function TodoListClient({ todos }: TodoListClientProps) {
  const [isPending, startTransition] = useTransition();

  const [optimisticTodos, addOptimisticTodo] = useOptimistic<Todo[], Todo>(
    todos,
    (current, newTodo) => [newTodo, ...current]
  );

  async function handleAddTodo(
  title: string,
  genreId: string | null
): Promise<void> {
  const optimisticTodo: Todo = {
    id: crypto.randomUUID(),
    title,
    completed: false,
    genre_id: genreId,
    created_at: new Date().toISOString(),
    optimistic: true,
  };

  

  startTransition(async () => {
    addOptimisticTodo(optimisticTodo);
    await addTodo(title, genreId);
  });
}

  return (
    <>
      <TodoForm onAdd={handleAddTodo} isPending={isPending} />

      <ul>
        {optimisticTodos.map((todo) => (
        //   display todo and genres id
            <li key={todo.id}>
                {todo.title} {todo.genre_id ? `(Genre ID: ${todo.genre_id})` : ''}
            </li>
        ))}
      </ul>
    </>
  );
}
