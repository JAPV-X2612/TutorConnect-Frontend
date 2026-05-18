import { useAuth } from '@clerk/clerk-expo';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

const extractErrorMessage = (data: unknown): string => {
  if (typeof data === 'string') return data;
  if (data !== null && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    if (typeof d['error'] === 'string' && d['error']) return d['error'];
    if (typeof d['message'] === 'string' && d['message']) return d['message'];
  }
  return 'Request failed';
};

const isFrontendOnlyMode =
  process.env.EXPO_PUBLIC_FRONTEND_ONLY === 'true';

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const getMockResponse = async <T = any>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT',
  body?: any,
): Promise<ApiResponse<T>> => {
  if (method === 'GET' && endpoint.includes('/dashboard/learner')) {
    await sleep(400);
    return {
      status: 200,
      data: {
        weeklyProgress: { completed: 2, total: 4 },
        upcomingSessions: [
          {
            id: 'mock-session-1',
            subject: 'Álgebra Lineal',
            tutorName: 'Dr. Martínez',
            scheduledAt: new Date(Date.now() + 86_400_000).toISOString(),
            status: 'confirmed',
          },
          {
            id: 'mock-session-2',
            subject: 'Historia Universal',
            tutorName: 'Lic. Elena',
            scheduledAt: new Date(Date.now() + 3 * 86_400_000).toISOString(),
            status: 'pending',
          },
        ],
      } as T,
    };
  }

  if (method === 'POST' && endpoint.includes('/tutors/register')) {
    await sleep(500);
    return {
      status: 201,
      data: { id: 'mock-tutor-id', status: 'PENDING' } as T,
    };
  }

  if (method === 'POST' && endpoint.includes('/tutors/certifications')) {
    await sleep(900);
    return {
      status: 201,
      data: { id: `mock-cert-${Date.now()}` } as T,
    };
  }

  if (method === 'GET' && endpoint.includes('/payments/bookings/') && endpoint.endsWith('/summary')) {
    await sleep(400);
    const now = new Date();
    return {
      status: 200,
      data: {
        subject: 'Matemáticas Avanzadas',
        tutorName: 'Juan García',
        scheduledAt: new Date(now.getTime() + 3 * 86_400_000).toISOString(),
        duration: 60,
        timeRange: '10:00 – 11:00',
        grossAmount: 120000,
        commissionRate: 0.15,
        commissionAmount: 18000,
        netAmount: 102000,
        expiresAt: new Date(now.getTime() + 10 * 60_000).toISOString(),
      } as T,
    };
  }

  if (method === 'POST' && endpoint.includes('/payments/bookings/') && endpoint.endsWith('/pay')) {
    await sleep(1500);
    const cardNumber = (body?.cardNumber ?? '').replace(/\s/g, '');
    if (cardNumber !== '4111111111111111') {
      return {
        status: 200,
        data: {
          transactionId: '',
          status: 'REJECTED',
          amount: 0,
          rejectionReason: cardNumber === '4000000000000002'
            ? 'Fondos insuficientes'
            : 'Tarjeta inválida',
        } as T,
      };
    }
    return {
      status: 200,
      data: {
        transactionId: `TXN-${Date.now()}`,
        status: 'CONFIRMED',
        amount: 120000,
      } as T,
    };
  }

  if (method === 'GET' && endpoint.includes('/payments/tutor/history')) {
    await sleep(500);
    const now = Date.now();
    return {
      status: 200,
      data: {
        records: [
          {
            id: 'pay-1',
            bookingId: 'book-1',
            learnerName: 'Ana Martínez',
            subject: 'Matemáticas',
            sessionDate: new Date(now - 2 * 86_400_000).toISOString(),
            grossAmount: 120000,
            commissionRate: 0.15,
            commissionAmount: 18000,
            netAmount: 102000,
            transactionId: 'TXN-001',
          },
          {
            id: 'pay-2',
            bookingId: 'book-2',
            learnerName: 'Carlos Reyes',
            subject: 'Física',
            sessionDate: new Date(now - 5 * 86_400_000).toISOString(),
            grossAmount: 90000,
            commissionRate: 0.15,
            commissionAmount: 13500,
            netAmount: 76500,
            transactionId: 'TXN-002',
          },
        ],
        summary: {
          totalSessions: 2,
          grossTotal: 210000,
          commissionTotal: 31500,
          netTotal: 178500,
          month: new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }),
        },
      } as T,
    };
  }

  await sleep(300);
  return { status: 200, data: {} as T };
};

export const useApiRequest = () => {
  const { getToken } = useAuth();

  const request = async <T = any>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT',
    endpoint: string,
    body?: any,
    isFormData: boolean = false
  ): Promise<ApiResponse<T>> => {
    try {
      if (isFrontendOnlyMode) {
        return getMockResponse<T>(endpoint, method, body);
      }

      const token = await getToken().catch(() => null);

      const headers: HeadersInit = {
        'ngrok-skip-browser-warning': 'true',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      if (!isFormData) {
        headers['Content-Type'] = 'application/json';
      }

      const config: RequestInit = {
        method,
        headers,
      };

      if (body && !isFormData) {
        config.body = JSON.stringify(body);
      } else if (body && isFormData) {
        config.body = body;
      }

      const response = await fetch(endpoint, config);

      // Handle response based on content type
      const contentType = response.headers.get('content-type');
      let data;

      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else if (contentType?.includes('text')) {
        data = await response.text();
      } else {
        data = await response.blob();
      }

      if (!response.ok) {
        return {
          error: extractErrorMessage(data),
          status: response.status,
          data: data,
        };
      }

      return {
        data,
        status: response.status,
      };
    } catch (error: any) {
      return {
        error: error?.message || 'Network error occurred',
        status: 0,
      };
    }
  };

  return {
    get: <T = any>(endpoint: string) => request<T>('GET', endpoint),
    post: <T = any>(endpoint: string, body?: any, isFormData?: boolean) =>
      request<T>('POST', endpoint, body, isFormData),
    patch: <T = any>(endpoint: string, body?: any) => request<T>('PATCH', endpoint, body),
    delete: <T = any>(endpoint: string) => request<T>('DELETE', endpoint),
    put: <T = any>(endpoint: string, body?: any) => request<T>('PUT', endpoint, body),
  };
};
