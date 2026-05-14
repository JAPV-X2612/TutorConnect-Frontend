import { useCallback, useEffect, useState } from 'react';
import { useApiRequest } from '@/services/api';
import { API_ENDPOINTS } from '@/constants/api';

export interface ScheduleSlot {
  day: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  startTime: string;
  endTime: string;
}

export interface TutorCourse {
  id: string;
  subject: string;
  description?: string;
  price: number;
  duration: number;
  modalidad: string;
  academicLevel?: string;
  schedule: ScheduleSlot[];
  isActive: boolean;
  createdAt: string;
}

export interface CreateCoursePayload {
  subject: string;
  description?: string;
  objectives?: string;
  experienceYears?: number;
  price: number;
  duration: number;
  modalidad: string;
  academicLevel?: string;
  schedule?: ScheduleSlot[];
}

export function useTutorCourses() {
  const api = useApiRequest();
  const [courses, setCourses] = useState<TutorCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await api.get<TutorCourse[]>(API_ENDPOINTS.tutorCourses);
    if (res.error || !res.data) {
      setError('No se pudieron cargar los cursos.');
    } else {
      setCourses(res.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (payload: CreateCoursePayload): Promise<TutorCourse | null> => {
    const res = await api.post<TutorCourse>(API_ENDPOINTS.tutorCourses, payload);
    if (res.error || !res.data) return null;
    setCourses((p) => [res.data!, ...p]);
    return res.data;
  };

  const update = async (id: string, partial: Partial<CreateCoursePayload> & { isActive?: boolean }): Promise<boolean> => {
    const res = await api.patch<TutorCourse>(API_ENDPOINTS.tutorCourse(id), partial);
    if (res.error || !res.data) return false;
    setCourses((p) => p.map((c) => (c.id === id ? res.data! : c)));
    return true;
  };

  const remove = async (id: string): Promise<boolean> => {
    const res = await api.delete(API_ENDPOINTS.tutorCourse(id));
    if (res.status !== 204 && res.error) return false;
    setCourses((p) => p.filter((c) => c.id !== id));
    return true;
  };

  return { courses, loading, error, refetch: fetch, create, update, remove };
}
