// types/todo.ts
export interface Todo {
  id: string;
  title: string;
  completed: boolean;
   genre_id: string | null;  
  created_at: string;
  optimistic?: boolean;
}
