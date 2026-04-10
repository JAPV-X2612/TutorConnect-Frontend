import { useAuth } from '@clerk/clerk-expo';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

const isFrontendOnlyMode =
  process.env.EXPO_PUBLIC_FRONTEND_ONLY === 'true';

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const getMockResponse = async <T = any>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT'
): Promise<ApiResponse<T>> => {
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
        return getMockResponse<T>(endpoint, method);
      }

      const token = await getToken();

      if (!token) {
        return {
          error: 'No authentication token available',
          status: 401,
        };
      }

      const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`,
      };

      // Only add Content-Type if not FormData (FormData sets it automatically)
      if (!isFormData && !body) {
        headers['Content-Type'] = 'application/json';
      } else if (!isFormData && body) {
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
          error: data?.error || data?.message || 'Request failed',
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
