import { apiFetch } from '@lib/api'

export interface Student {
  id: string
  user_id: string
  full_name: string
  email: string
  student_id: string
}

export interface CreateStudentPayload {
  full_name: string
  email: string
  password: string
  student_id: string
  passwordConfirmation: string
}

export interface UpdateStudentPayload {
  full_name?: string
  email?: string
  password?: string
  student_id?: string
  passwordConfirmation?: string
}

export function fetchStudents(q?: string) {
  const query = q ? `?q=${encodeURIComponent(q)}` : ''
  return apiFetch<Student[]>(`/students/${query}`)
}

export function createStudent(data: CreateStudentPayload) {
  return apiFetch<Student>('/students/', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateStudent(id: string, data: UpdateStudentPayload) {
  return apiFetch<Student>(`/students/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function deleteStudent(id: string) {
  return apiFetch<void>(`/students/${id}/`, { method: 'DELETE' })
}
