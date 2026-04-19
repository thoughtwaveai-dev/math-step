'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const VALID_CATEGORIES = ['bug', 'idea', 'confusion', 'praise'] as const

export async function submitFeedback(
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const category = formData.get('category') as string
  const studentId = (formData.get('student_id') as string) || null
  const message = (formData.get('message') as string)?.trim()

  if (!category || !VALID_CATEGORIES.includes(category as typeof VALID_CATEGORIES[number])) {
    return { error: 'Please select a category.' }
  }
  if (!message) return { error: 'Message is required.' }
  if (message.length > 2000) return { error: 'Message must be under 2000 characters.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  let studentName: string | null = null

  // If student_id provided, verify ownership and get name
  if (studentId) {
    const { data: student } = await supabase
      .from('students')
      .select('id, name')
      .eq('id', studentId)
      .eq('parent_id', user.id)
      .maybeSingle()
    if (!student) return { error: 'Student not found.' }
    studentName = student.name
  }

  const { error: insertError } = await supabase
    .from('feedback')
    .insert({
      parent_id: user.id,
      student_id: studentId || null,
      category,
      message,
      parent_email: user.email ?? null,
      parent_name: (user.user_metadata?.name as string) ?? null,
      student_name: studentName,
    })

  if (insertError) return { error: insertError.message }

  redirect('/feedback?sent=1')
}
