import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    console.log("AuthContext checkAuth: Initiating check.");
    const token = localStorage.getItem("token");
    if (token) {
      console.log("AuthContext checkAuth: Token found in localStorage.");
      try {
        const response = await axios.get("http://localhost:5000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data.user);
        console.log(
          "AuthContext checkAuth: User data fetched successfully:",
          response.data.user
        );
      } catch (error) {
        console.error("AuthContext checkAuth: Auth check failed:", error);
        localStorage.removeItem("token");
        setUser(null);
        console.log("AuthContext checkAuth: User set to null due to error.");
      }
    } else {
      console.log("AuthContext checkAuth: No token found in localStorage.");
    }
    setLoading(false);
    console.log("AuthContext checkAuth: Loading set to false.");
  };

  const login = async (email, password) => {
    try {
      console.log("AuthContext login: Logging in");
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        { email, password }
      );
      const { token, user } = response.data;
      localStorage.setItem("token", token);
      console.log(
        "AuthContext login: Token saved and retrieved from localStorage: Success"
      );
      setUser(user);
      console.log("AuthContext login: user set to Object");
      return { success: true };
    } catch (error) {
      console.error("AuthContext login: Login failed:", error);
      return {
        success: false,
        error:
          error.response?.data?.message ||
          "Login failed. Please check your credentials.",
      };
    }
  };

  const register = async (userData) => {
    try {
      console.log("AuthContext register: Registering user.");
      const response = await axios.post(
        "http://localhost:5000/api/auth/register",
        userData
      );
      const { token, user } = response.data;
      localStorage.setItem("token", token);
      console.log(
        "AuthContext register: Token saved and retrieved from localStorage: Success"
      );
      setUser(user);
      console.log("AuthContext register: user set to Object");
      return { success: true };
    } catch (error) {
      console.error("AuthContext register: Registration failed:", error);
      return {
        success: false,
        error:
          error.response?.data?.message ||
          "Registration failed. Please try again.",
      };
    }
  };

  const logout = () => {
    console.log("AuthContext logout: Logging out user");
    localStorage.removeItem("token");
    setUser(null);
  };

  // Add axios interceptor for token expiration
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.log(
            "AuthContext interceptor: 401 Unauthorized, logging out."
          );
          localStorage.removeItem("token");
          setUser(null);
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const value = {
    user,
    loading,
    login,
    register,
    logout,
  };

  console.log("AuthContext render: Current state", {
    user: value.user?.email,
    loading: value.loading,
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
