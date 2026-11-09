import React, { createContext, useContext, useEffect, useState } from "react";
import API from "../services/api";
import { PermissionKey, User, UserRole } from "../types";
import { hasPermission } from "../services/permissions";

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
  refreshUsers: () => Promise<void>;
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
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetches the live org roster from the backend so newly provisioned users
  // show up in assignee dropdowns, kanban, and workload views.
  const refreshUsers = async () => {
    try {
      const res = await API.get("/admin/users");
      const list = res.data?.users ?? res.data;
      if (Array.isArray(list)) {
        const mapped: User[] = list.map((su: any) => ({
          id: su.id,
          orgId: su.orgId,
          name: su.name,
          email: su.email,
          role: su.role,
          department: su.department || undefined,
          team: su.team || undefined,
          specialty: su.specialty || undefined,
          assignedPmId: su.assignedPmId || undefined,
          status: su.status || "ACTIVE",
          phoneNumber: su.phoneNumber || null,
          githubUsername: su.githubUsername || null,
          telegramLinked: !!su.telegramChatId,
          isTemporaryPassword: su.isTemporaryPassword === true,
          avatar: su.name ? su.name.slice(0, 2).toUpperCase() : "U",
          createdAt: su.createdAt,
        }));
        setAllUsers(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch users from backend:", err);
    }
  };

  useEffect(() => {
    // If token exists, sync profile and user roster from the backend.
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
          // Token may be expired — clear it so the user sees the login screen.
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setToken(null);
          setUser(null);
        });

      refreshUsers();
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await API.post("/auth/login", { email, password });
      const apiToken = response.data.token;
      const apiUser = response.data.user;

      localStorage.setItem("token", apiToken);
      localStorage.setItem("user", JSON.stringify(apiUser));
      setToken(apiToken);
      setUser(apiUser);
    } catch (apiError: any) {
      setLoading(false);
      throw apiError;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
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
    setAllUsers(updatedUsers);

    // Sync to backend profile endpoint
    API.patch("/me", updates).catch(() => undefined);
  };

  const resolveTemporaryPassword = (_newPassword: string) => {
    if (!user) return;
    updateUser({ isTemporaryPassword: false });
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
