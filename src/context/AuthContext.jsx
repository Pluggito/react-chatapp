import { createContext, useState } from "react";
import axios from "axios";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);


  // Signup (just creates the user, no token)
  const userSignUp = async (userData) => {
    setLoading(true);
    setError("");
    try {
      await axios.post(`${BASE_URL}/chatserver/signUp`, userData);
      setIsLoggedIn(false); // not logged in yet
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  // Signin (returns accessToken)
  const userSignIn = async (credentials) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${BASE_URL}/chatserver/signIn`, credentials);
      setAuthToken(res.data.accessToken);
      setIsLoggedIn(true);
      await getCurrentUser(res.data.accessToken); // fetch user after login
    } catch (err) {
      setError(err.response?.data?.message || "Signin failed");
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  // Fetch current user using token
  const getCurrentUser = async (token = authToken) => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/chatserver/current`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch current user");
    } finally {
      setLoading(false);
    }
  };

  const userSignOut = () => {
    setUser(null);
    setAuthToken("");
    setIsLoggedIn(false);
  };

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
const BASE_URL = "http://localhost:3050"