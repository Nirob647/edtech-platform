import { supabase } from '../../services/database/supabaseClient'

export async function listTopicsBySubject(subjectId) {
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('subject_id', subjectId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createTopic({ subjectId, name }) {
  const { data, error } = await supabase
    .from('topics')
    .insert({ subject_id: subjectId, name })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteTopic(id) {
  const { error } = await supabase.from('topics').delete().eq('id', id)
  if (error) throw error
}
