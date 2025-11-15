import axios from "axios";
import jwtDecode from "jwt-decode";
import dayjs from "dayjs";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export const useAxiosAuth = () => {
  const { authToken, refreshAccessToken, setAuthToken } = useContext(AuthContext);

  const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    withCredentials: true,
  });

  axiosInstance.interceptors.request.use(async (config) => {
    let token = localStorage.getItem("accessToken") || authToken;

    if (!token) return config;

    try {
      const decoded = jwtDecode(token);
      const isExpired = dayjs.unix(decoded.exp).diff(dayjs()) < 1;

      if (isExpired && refreshAccessToken) {
        // Refresh token using AuthContext
        token = await refreshAccessToken();
        setAuthToken(token);
      }

      config.headers.Authorization = `Bearer ${token}`;
    } catch (err) {
      console.error("Error in Axios interceptor", err);
      localStorage.removeItem("accessToken");
      token = null;
    }

    return config;
  }, (error) => Promise.reject(error));

  return axiosInstance;
};
