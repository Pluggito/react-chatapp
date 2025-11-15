import axios from "axios";

export const useAxiosAuth = () => {
  const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    withCredentials: true,
  });

  // Attach auth token from localStorage before each request
  axiosInstance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("accessToken"); // <-- read from localStorage
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  return axiosInstance;
};
