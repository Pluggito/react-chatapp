import { createContext, useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

const BASE_URL = "http://localhost:3050";

export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Start with true for initial load
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ---- Refresh token ----
  const refreshAccessToken = async () => {
    try {
      const res = await axios.post(
        `${BASE_URL}/chatserver/auth/refresh`,
        {},
        { withCredentials: true }
      );
      setAuthToken(res.data.accessToken);
      return res.data.accessToken;
    } catch (err) {
      console.error("Refresh token failed", err);
      // Only show toast if user was previously logged in
      if (isLoggedIn) {
        toast.error("Session expired. Please sign in again.");
      }
      userSignOut();
      throw new Error("Session expired. Please sign in again.");
    }
  };

  // ---- Signup ----
  const userSignUp = async (userData) => {
    setLoading(true);
    setError("");
    try {
      await axios.post(`${BASE_URL}/chatserver/auth/signUp`, userData);
      toast.success("SignUp Successful. Please sign in to continue.");
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
      const res = await axios.post(`${BASE_URL}/chatserver/auth/signIn`, credentials, {
        withCredentials: true,
      });
      setAuthToken(res.data.accessToken);
      setIsLoggedIn(true);
      await getCurrentUser(res.data.accessToken);
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
      const res = await axios.get(`${BASE_URL}/chatserver/auth/current`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setUser(res.data);
      return res.data;
    } catch (err) {
      if (err.response?.status === 401 && !loading) {
        // Only retry refresh if we're not in the initial loading state
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
      // Call backend logout to clear refresh token cookie
      await axios.post(`${BASE_URL}/chatserver/auth/signOut`, {}, {
        withCredentials: true
      });
    } catch (err) {
      console.error("Logout request failed:", err);
      // Continue with client-side cleanup even if server call fails
    }
    
    setUser(null);
    setAuthToken("");
    setIsLoggedIn(false);
    setError("");
  };

  // ---- Check if refresh token exists (optional helper) ----
  const checkRefreshTokenExists = async () => {
    try {
      // Make a simple request to check if refresh token cookie exists
      // This is optional - you can remove this if your backend doesn't support it
      await axios.get(`${BASE_URL}/chatserver/auth/check-refresh`, {
        withCredentials: true
      });
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
        
        // Optional: Check if refresh token exists before attempting refresh
        const hasRefreshToken = await checkRefreshTokenExists();
        if (!hasRefreshToken) {
          console.log("No valid refresh token available");
          return;
        }

        const newToken = await refreshAccessToken();
        if (newToken) {
          await getCurrentUser(newToken);
          setIsLoggedIn(true);
        }
      } catch (err) {
        toast.error(err.message || "Failed to restore session");
        // Silently handle - user just needs to sign in
        console.log("No active session or session expired");
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []); // Empty dependency array is correct here

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