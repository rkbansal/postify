import React, { createContext, useContext, useEffect, useState } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  picture: string;
  preferences: {
    defaultTone: string;
    defaultPlatforms: string[];
    defaultHashtags: string[];
  };
  stats: {
    totalGenerations: number;
    lastGeneratedAt?: string;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => void;
  logout: () => Promise<void>;
  updatePreferences: (
    preferences: Partial<User["preferences"]>
  ) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();

    // Check for auth success in URL params (from OAuth redirect)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("auth") === "success") {
      // Remove the auth param from URL
      window.history.replaceState({}, document.title, window.location.pathname);
      // Refresh user data
      setTimeout(checkAuthStatus, 1000);
    }
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch(`${apiUrl}/auth/user`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = () => {
    window.location.href = `${apiUrl}/auth/google`;
  };

  const logout = async () => {
    try {
      await fetch(`${apiUrl}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      setUser(null);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const updatePreferences = async (
    preferences: Partial<User["preferences"]>
  ) => {
    try {
      const response = await fetch(`${apiUrl}/auth/preferences`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        const data = await response.json();
        setUser((prev) =>
          prev
            ? {
                ...prev,
                preferences: { ...prev.preferences, ...data.preferences },
              }
            : null
        );
      } else {
        throw new Error("Failed to update preferences");
      }
    } catch (error) {
      console.error("Error updating preferences:", error);
      throw error;
    }
  };

  const refreshUser = async () => {
    await checkAuthStatus();
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    updatePreferences,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
