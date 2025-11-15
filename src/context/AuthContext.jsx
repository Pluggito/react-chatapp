import { createContext, useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

const ACCESS_TOKEN_KEY = "accessToken";
const TOKEN_EXPIRY_KEY = "tokenExpiry";

// ===== Local Storage Helpers =====
const saveAccessToken = (token, expiresInHours = 24) => {
  const expiryTime = Date.now() + expiresInHours * 60 * 60 * 1000; // 24 hours
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
};

const getAccessToken = () => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!token || !expiry) return null;
  if (Date.now() > parseInt(expiry)) {
    removeAccessToken();
    return null;
  }
  return token;
};

const removeAccessToken = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
};

// ===== Auth + Socket Provider =====
export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ---- Refresh token ----
  const refreshAccessToken = async () => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/chatserver/auth/refresh`,
        {},
        { withCredentials: true }
      );
      setAuthToken(res.data.accessToken);
      saveAccessToken(res.data.accessToken);
      return res.data.accessToken;
    } catch (err) {
      console.error("Refresh token failed", err);
      if (isLoggedIn) toast.error("Session expired. Please sign in again.");
      userSignOut();
      throw new Error("Session expired. Please sign in again.");
    }
  };

  // ---- Signup ----
  const userSignUp = async (userData) => {
    setLoading(true);
    setError("");
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/chatserver/auth/signUp`, userData);
      toast.success("SignUp Successful.");
      setIsLoggedIn(false);
    } catch (err) {
      toast.error("SignUp Failed");
      setError(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  // ---- Signin ----
  const userSignIn = async (credentials) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/chatserver/auth/signIn`,
        credentials,
        { withCredentials: true }
      );

      const token = res.data.accessToken;
      setAuthToken(token);
      saveAccessToken(token);
      setIsLoggedIn(true);

      await getCurrentUser(token);

      toast.success("SignIn Successful");
    } catch (err) {
      toast.error("SignIn Failed");
      setError(err.response?.data?.message || "SignIn failed");
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  // ---- Fetch current user ----
  const getCurrentUser = async (token = authToken) => {
    if (!token) return;
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/chatserver/auth/current`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      setUser(res.data);
      return res.data;
    } catch (err) {
      if (err.response?.status === 401 && !loading) {
        try {
          const newToken = await refreshAccessToken();
          return getCurrentUser(newToken);
        } catch (refreshErr) {
          console.error("Refresh failed:", refreshErr);
          throw refreshErr;
        }
      }
      setError(err.response?.data?.message || "Failed to fetch current user");
      throw err;
    }
  };

  // ---- Signout ----
  const userSignOut = async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/chatserver/auth/signOut`,
        {},
        { withCredentials: true }
      );
    } catch (err) {
      console.error("Logout request failed:", err);
    }

    removeAccessToken();
    setUser(null);
    setAuthToken("");
    setIsLoggedIn(false);
    setError("");
  };

  // ---- Check refresh token ----
  const checkRefreshTokenExists = async () => {
    try {
      await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/chatserver/auth/check-refresh`,
        { withCredentials: true }
      );
      return true;
    } catch {
      return false;
    }
  };

  // ---- Restore session on reload ----
  useEffect(() => {
    const restoreSession = async () => {
      try {
        setLoading(true);

        const storedToken = getAccessToken();
        if (storedToken) {
          setAuthToken(storedToken);
          await getCurrentUser(storedToken);
          setIsLoggedIn(true);
          return;
        }

        const hasRefreshToken = await checkRefreshTokenExists();
        if (hasRefreshToken) {
          const newToken = await refreshAccessToken();
          if (newToken) {
            await getCurrentUser(newToken);
            setIsLoggedIn(true);
          }
        }
      } catch {
        console.log("No active session or session expired");
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        authToken,
        loading,
        error,
        isLoggedIn,
        userSignUp,
        userSignIn,
        getCurrentUser,
        userSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
