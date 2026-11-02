import React, { createContext, useContext, useEffect, useState } from "react";
import API from "../services/api";
import { PermissionKey, User, UserRole } from "../types";
import { hasPermission } from "../services/permissions";
import {
  addAuditLog,
  getStoredUsers,
  saveStoredUsers,
} from "../services/mockDataStore";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  switchRoleEmulator: (targetRole: UserRole) => void;
  checkPermission: (
    permission: PermissionKey,
    scope?: {
      projectId?: number;
      managedProjectIds?: number[];
      assigneeId?: number;
    }
  ) => boolean;
  isTemporaryPasswordRequired: boolean;
  resolveTemporaryPassword: (newPassword: string) => void;
  allUsers: User[];
  refreshUsers: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("token")
  );
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [allUsers, setAllUsers] = useState<User[]>(getStoredUsers);
  const [loading, setLoading] = useState(false);

  const refreshUsers = () => {
    setAllUsers(getStoredUsers());
  };

  useEffect(() => {
    // If token exists, attempt to sync profile from /api/me
    if (token) {
      API.get("/me")
        .then((res) => {
          if (res.data) {
            setUser((prev) => {
              const updated: User = {
                ...(prev || { id: res.data.id, name: res.data.name, email: res.data.email, role: res.data.role, status: "ACTIVE" }),
                ...res.data,
              };
              localStorage.setItem("user", JSON.stringify(updated));
              return updated;
            });
          }
        })
        .catch(() => {
          // Keep existing local user on offline or prototype fallback
        });
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // First attempt real backend authentication
      const response = await API.post("/auth/login", { email, password });
      const apiToken = response.data.token;
      const apiUser = response.data.user;

      localStorage.setItem("token", apiToken);
      localStorage.setItem("user", JSON.stringify(apiUser));
      setToken(apiToken);
      setUser(apiUser);
      addAuditLog(apiUser, "LOGIN_SUCCESS", "Session", apiUser.id, `Signed in via primary auth`);
    } catch (apiError: any) {
      // If backend is not running or credentials match mock data accounts (e.g. testing different developers)
      const normalizedEmail = email.toLowerCase().trim();
      const matched = allUsers.find(
        (u) => u.email.toLowerCase() === normalizedEmail
      );

      if (matched) {
        // Mock fallback login for testing all roles seamlessly
        const syntheticToken = `mock-token-${matched.id}-${Date.now()}`;
        localStorage.setItem("token", syntheticToken);
        localStorage.setItem("user", JSON.stringify(matched));
        setToken(syntheticToken);
        setUser(matched);
        addAuditLog(matched, "LOGIN_SUCCESS", "Session", matched.id, `Signed in via organization credentials (prototype/offline fallback)`);
        setLoading(false);
        return;
      }

      setLoading(false);
      throw apiError;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    if (user) {
      addAuditLog(user, "LOGOUT", "Session", user.id, `User logged out`);
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;
    const updated: User = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem("user", JSON.stringify(updated));

    // Update in allUsers collection as well
    const updatedUsers = allUsers.map((u) =>
      u.id === user.id ? { ...u, ...updates } : u
    );
    saveStoredUsers(updatedUsers);
    setAllUsers(updatedUsers);

    // If backend profile endpoint available, send patch
    API.patch("/me", updates).catch(() => undefined);
  };

  const resolveTemporaryPassword = (newPassword: string) => {
    if (!user) return;
    updateUser({ isTemporaryPassword: false });
    addAuditLog(
      user,
      "PASSWORD_RESET_COMPLETED",
      "User",
      user.id,
      "Temporary password changed on initial setup"
    );
  };

  const switchRoleEmulator = (targetRole: UserRole) => {
    const roleMatch = allUsers.find(
      (u) => (u.role || "").toUpperCase() === targetRole.toUpperCase()
    );

    if (roleMatch) {
      setUser(roleMatch);
      localStorage.setItem("user", JSON.stringify(roleMatch));
    } else if (user) {
      const switched: User = { ...user, role: targetRole };
      setUser(switched);
      localStorage.setItem("user", JSON.stringify(switched));
    }
  };

  const checkPermission = (
    permission: PermissionKey,
    scope?: {
      projectId?: number;
      managedProjectIds?: number[];
      assigneeId?: number;
    }
  ) => {
    return hasPermission(user, permission, scope);
  };

  const isTemporaryPasswordRequired = !!user?.isTemporaryPassword;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        updateUser,
        switchRoleEmulator,
        checkPermission,
        isTemporaryPasswordRequired,
        resolveTemporaryPassword,
        allUsers,
        refreshUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};
