import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  type CreateStudentPayload,
  type UpdateStudentPayload,
} from '../services/students'

export const studentsKeys = {
  all: ['students'] as const,
}

export function useStudents(q?: string) {
  return useQuery({
    queryKey: [...studentsKeys.all, q],
    queryFn: () => fetchStudents(q),
  })
}

export function useCreateStudent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateStudentPayload) => createStudent(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: studentsKeys.all }),
  })
}

export function useUpdateStudent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStudentPayload }) =>
      updateStudent(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: studentsKeys.all }),
  })
}

export function useDeleteStudent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteStudent(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: studentsKeys.all }),
  })
}
