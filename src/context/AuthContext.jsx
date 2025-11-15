import { createContext, useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

const ACCESS_TOKEN_KEY = "accessToken";
const TOKEN_EXPIRY_KEY = "tokenExpiry";

// ===== Local Storage Helpers =====
const saveAccessToken = (token, expiresInHours = 24) => {
  const expiryTime = Date.now() + expiresInHours * 60 * 60 * 1000;
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

export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ---- Refresh token ----
  const refreshAccessToken = async () => {
    try {
      console.log('🔄 Attempting to refresh access token...');
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/chatserver/auth/refresh`,
        {},
        { withCredentials: true }
      );
      
      const newToken = res.data.accessToken;
      console.log('✅ New token received:', newToken?.substring(0, 30) + '...');
      
      setAuthToken(newToken);
      saveAccessToken(newToken);
      return newToken;
    } catch (err) {
      console.error("❌ Refresh token failed", err);
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
      console.log('✅ SignIn successful, token received:', token?.substring(0, 30) + '...');
      
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
    if (!token) {
      console.log('⚠️ No token provided to getCurrentUser');
      return;
    }
    
    try {
      console.log('📡 Fetching current user with token:', token?.substring(0, 30) + '...');
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/chatserver/auth/current`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      
      console.log('✅ Current user fetched:', res.data);
      setUser(res.data);
      return res.data;
    } catch (err) {
      if (err.response?.status === 401 && !loading) {
        try {
          console.log('⚠️ 401 error, attempting token refresh...');
          const newToken = await refreshAccessToken();
          return getCurrentUser(newToken);
        } catch (refreshErr) {
          console.error("❌ Refresh failed:", refreshErr);
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
    setAuthToken(null); // Changed from "" to null for consistency
    setIsLoggedIn(false);
    setError("");
    console.log('✅ User signed out');
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
        console.log('🔄 Attempting to restore session...');

        const storedToken = getAccessToken();
        if (storedToken) {
          console.log('✅ Found stored token:', storedToken?.substring(0, 30) + '...');
          setAuthToken(storedToken);
          await getCurrentUser(storedToken);
          setIsLoggedIn(true);
          return;
        }

        console.log('⚠️ No stored token, checking for refresh token...');
        const hasRefreshToken = await checkRefreshTokenExists();
        if (hasRefreshToken) {
          console.log('✅ Refresh token exists, refreshing access token...');
          const newToken = await refreshAccessToken();
          if (newToken) {
            await getCurrentUser(newToken);
            setIsLoggedIn(true);
          }
        } else {
          console.log('❌ No refresh token found');
        }
      } catch (err) {
        console.log("❌ Session restoration failed:", err);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  // Debug: Log token changes
  useEffect(() => {
    console.log('🔑 AuthToken changed:', authToken ? authToken.substring(0, 30) + '...' : 'null');
  }, [authToken]);

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
        refreshAccessToken, // ✅ EXPORT THIS
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};