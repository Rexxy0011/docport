import axios from "axios";

const unauthorizedHandlers = {};

export const setUnauthorizedHandler = (tokenKey, fn) => {
  unauthorizedHandlers[tokenKey] = fn;
};

const createApiClient = (tokenKey) => {
  const client = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL,
  });

  client.interceptors.request.use((config) => {
    const token = localStorage.getItem(tokenKey);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error?.response?.status === 401 && unauthorizedHandlers[tokenKey]) {
        unauthorizedHandlers[tokenKey]();
      }
      return Promise.reject(error);
    }
  );

  return client;
};

export const adminApi = createApiClient("aToken");
export const doctorApi = createApiClient("dToken");

export const apiErrorMessage = (error, fallback = "Request failed") =>
  error?.response?.data?.message || error?.message || fallback;
