// types/todo.ts
export interface Todo {
  id: string;
  title: string;
  completed: boolean;
   genre_id: string | null;  
  created_at: string;
  optimistic?: boolean;
}

// //LOGIN PAGE

export type LoginState = {
  error: string | null;
  issues: Record<string, string[]>;
};

export const initialLoginState: LoginState = {
  error: null,
  issues: {},
};
