import React, { createContext, useContext, useState, useEffect } from "react";
import { config } from "../config";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("AuthContext useEffect: Initial token check", {
      tokenExists: !!token,
    });

    if (token) {
      console.log(
        "AuthContext useEffect: Token found, attempting to fetch user."
      );
      fetchUser(token);
    } else {
      console.log(
        "AuthContext useEffect: No token found, setting loading to false."
      );
      setLoading(false);
    }
  }, []);

  const fetchUser = async (token) => {
    console.log(
      "AuthContext fetchUser: Attempting to fetch user with token:",
      token
    );
    try {
      const response = await fetch(config.AUTH.ME, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(
          "AuthContext fetchUser: Failed to fetch user, response not ok",
          errorData
        );
        throw new Error(errorData.message || "Failed to fetch user");
      }

      const user = await response.json();
      console.log("AuthContext fetchUser: Fetched user successfully", user);
      setCurrentUser(user);
      console.log("AuthContext fetchUser: currentUser set to", user);
    } catch (error) {
      console.error("AuthContext fetchUser: Error fetching user:", error);
      localStorage.removeItem("token");
      setCurrentUser(null);
    } finally {
      console.log("AuthContext fetchUser: Setting loading to false");
      setLoading(false);
    }
  };

  const login = async (token, user) => {
    console.log("AuthContext login: Logging in");
    try {
      localStorage.setItem("token", token);
      const retrievedToken = localStorage.getItem("token");
      console.log(
        "AuthContext login: Token saved and retrieved from localStorage:",
        retrievedToken ? "Success" : "Failed"
      );
      setCurrentUser(user);
      console.log("AuthContext login: currentUser set to", user);
      setLoading(false);
    } catch (error) {
      console.error("AuthContext login: Login error:", error);
      throw error;
    }
  };

  const logout = () => {
    console.log("AuthContext logout: Logging out user");
    try {
      localStorage.removeItem("token");
      setCurrentUser(null);
      setLoading(false);
    } catch (error) {
      console.error("AuthContext logout: Logout error:", error);
    }
  };

  const value = {
    currentUser,
    login,
    logout,
    loading,
  };

  console.log("AuthContext render: Current state", {
    currentUser: currentUser?.email,
    loading,
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
