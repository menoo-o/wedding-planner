// app/todo/page.tsx
import { getTodos } from './actions';
import TodoListClient from './TodoListClient';
import { Todo } from '@/lib/types';

export default async function TodoPage() {
  const todos: Todo[] = (await getTodos()) ?? [];

  return (
    <main>
      <h1>Todo List</h1>
      <TodoListClient todos={todos} />
    </main>
  );
}
