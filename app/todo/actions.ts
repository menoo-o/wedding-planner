'use server'
// reading from a supabase table

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';


export async function getTodos() {
    const supabase = await createClient();
    // step: get todos from supabase
    const { data: todos } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false });
    return todos;
}

export async function getGenres() {
    const supabase = await createClient();
    // step: get todos from supabase
    const { data: genres } = await supabase
        .from('genres')
        .select('*')
        .order('created_at', { ascending: false });
    return genres;
}


export async function addTodo(
    title: string,
    genreId: string | null
 ){ 
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('todos')
    .insert({
      title,
      completed: false,
      genre_id: genreId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  revalidatePath('/todos');

  return data;
}