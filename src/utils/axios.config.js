import axios from "axios";
import { useContext, useMemo } from "react";
import { AuthContext } from "../context/AuthContext";

export const useAxiosAuth = () => {
  const { authToken } = useContext(AuthContext);

  // useMemo ensures we don't recreate Axios instance on every render unnecessarily
  const axiosInstance = useMemo(() => {
    const instance = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL,
      withCredentials: true,
    });

    // Attach auth token before each request
    instance.interceptors.request.use(
      (config) => {
        if (authToken) {
          config.headers.Authorization = `Bearer ${authToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return instance;
  }, [authToken]);

  return axiosInstance;
};
