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



// DASHBOARD PAGE

export type HouseholdMember = {
  household_id: string
  role: "admin" | string
  status: "active" | "inactive" | "pending" | string
  user_id: string
}


export type MonthlyCycle = {
  id: string
  household_id?: string
  month?: number
  year?: number
  is_closed?: boolean
  opening_balance?: number
  closing_balance?: number
  created_at?: string
}

// Catefory Table: [id, household_id, name]
export type Category = {
  id: string
  household_id: string
  name: string
}