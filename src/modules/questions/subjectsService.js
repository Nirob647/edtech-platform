import { supabase } from '../../services/database/supabaseClient'

export async function listSubjects() {
  const { data, error } = await supabase.from('subjects').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createSubject({ name, description }) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('subjects')
    .insert({ name, description, created_by: user.id })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateSubject(id, { name, description }) {
  const { data, error } = await supabase
    .from('subjects')
    .update({ name, description, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteSubject(id) {
  const { error } = await supabase.from('subjects').delete().eq('id', id)
  if (error) throw error
}
