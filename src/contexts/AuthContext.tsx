import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { setApiActor, usersApi } from '@/lib/api';

const AUTH_STORAGE_KEY = 'goofe_auth';
const GLAUNET_AUTH_STORAGE_KEY = 'glaunet_auth';
const LEGACY_STORAGE_PREFIX = ['truck', 'track'].join('_');
const LEGACY_AUTH_STORAGE_KEY = `${LEGACY_STORAGE_PREFIX}_auth`;

export type UserRole = 'admin' | 'pdg' | 'gestion_manager' | 'comptable';

export interface User {
  login: string;
  role: UserRole;
}

export interface UserSummary {
  login: string;
  role: UserRole;
}

function normalizeRole(role: string): UserRole {
  if (role === 'gestionnaire') return 'gestion_manager';
  if (role === 'admin' || role === 'pdg' || role === 'gestion_manager' || role === 'comptable') {
    return role;
  }
  return 'comptable';
}

function validateNewPassword(password: string) {
  if (password.trim().length < 6) {
    throw new Error('Le mot de passe doit contenir au moins 6 caractères.');
  }
}

function normalizeLogin(login: string): string {
  return login.trim().toLowerCase();
}

function validateLogin(login: string) {
  if (!login) throw new Error('Utilisateur invalide.');
  if (!/^[a-z0-9._-]{3,30}$/.test(login)) {
    throw new Error('Le login doit contenir 3 à 30 caractères : lettres, chiffres, point, tiret ou underscore.');
  }
}

function validateRole(role: UserRole) {
  if (!['admin', 'pdg', 'gestion_manager', 'comptable'].includes(role)) {
    throw new Error('Rôle invalide.');
  }
}

interface AuthContextType {
  user: User | null;
  login: (login: string, password: string) => Promise<boolean>;
  logout: () => void;
  users: UserSummary[];
  refreshUsers: () => Promise<void>;
  createUser: (login: string, role: UserRole, password: string) => Promise<void>;
  changeUserPassword: (targetLogin: string, newPassword: string) => Promise<void>;
  changeUserRole: (targetLogin: string, role: UserRole) => Promise<void>;
  changeOwnPassword: (currentPassword: string, newPassword: string) => Promise<void>;
  canManageFleet: boolean;
  canManageAccounting: boolean;
  canManageTreasury: boolean;
  canManageCredits: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw =
        localStorage.getItem(AUTH_STORAGE_KEY) ||
        localStorage.getItem(GLAUNET_AUTH_STORAGE_KEY) ||
        localStorage.getItem(LEGACY_AUTH_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [users, setUsers] = useState<UserSummary[]>([]);

  const refreshUsers = useCallback(async () => {
    try {
      const list = await usersApi.getAll();
      setUsers(list.map((u) => ({ login: u.login, role: normalizeRole(u.role) })));
    } catch {
      setUsers([]);
    }
  }, []);

  useEffect(() => {
    void refreshUsers();
  }, [refreshUsers]);

  useEffect(() => {
    setApiActor(user ? { login: user.login, role: user.role } : null);
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    }
  }, [user]);

  const login = async (loginInput: string, password: string): Promise<boolean> => {
    try {
      const result = await usersApi.login(loginInput, password);
      const u: User = { login: result.login, role: normalizeRole(result.role) };
      setUser(u);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(u));
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(GLAUNET_AUTH_STORAGE_KEY);
    localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY);
  };

  const createUser = async (loginInput: string, role: UserRole, password: string): Promise<void> => {
    if (!user || user.role !== 'admin') {
      throw new Error('Action réservée à l’administrateur.');
    }
    const normalizedLogin = normalizeLogin(loginInput);
    validateLogin(normalizedLogin);
    validateNewPassword(password);
    validateRole(role);

    await usersApi.create({ login: normalizedLogin, role, password });
    await refreshUsers();
  };

  const changeUserPassword = async (targetLogin: string, newPassword: string): Promise<void> => {
    if (!user || user.role !== 'admin') {
      throw new Error('Action réservée à l’administrateur.');
    }
    const normalizedLogin = normalizeLogin(targetLogin);
    validateLogin(normalizedLogin);
    validateNewPassword(newPassword);

    await usersApi.changePassword(normalizedLogin, newPassword);
    await refreshUsers();
  };

  const changeUserRole = async (targetLogin: string, role: UserRole): Promise<void> => {
    if (!user || user.role !== 'admin') {
      throw new Error('Action réservée à l’administrateur.');
    }
    const normalizedLogin = normalizeLogin(targetLogin);
    validateLogin(normalizedLogin);
    validateRole(role);

    const updated = await usersApi.changeRole(normalizedLogin, role);
    await refreshUsers();
    if (user.login.toLowerCase() === normalizedLogin) {
      setUser({ login: updated.login, role: normalizeRole(updated.role) });
    }
  };

  const changeOwnPassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    if (!user) throw new Error('Utilisateur non connecté.');
    validateNewPassword(newPassword);
    await usersApi.changeOwnPassword(currentPassword, newPassword);
    await refreshUsers();
  };

  const isAdmin = user?.role === 'admin';
  const isGestionManager = user?.role === 'gestion_manager';
  const isComptable = user?.role === 'comptable';

  const canManageFleet = !user || isAdmin || isGestionManager;
  const canManageAccounting = !user || isAdmin || isComptable;
  const canManageTreasury = !user || isAdmin || isComptable;
  const canManageCredits = !user || isAdmin || isComptable;

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        users,
        refreshUsers,
        createUser,
        changeUserPassword,
        changeUserRole,
        changeOwnPassword,
        canManageFleet,
        canManageAccounting,
        canManageTreasury,
        canManageCredits,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

/** Liste des utilisateurs disponibles pour la sélection à la connexion */
export const LOGIN_USER_OPTIONS = [
  {
    login: 'pdg',
    label: 'PDG',
    description:
      'Lecture seule sur toute l’application : consultation complète sans création, modification ni suppression.',
  },
  {
    login: 'gestion_manager',
    label: 'Gestion manager',
    description:
      'Flotte : camions, trajets, expéditions, chauffeurs, personnel, tiers. Pas dépenses, facturation, comptes bancaires, caisse ni crédits.',
  },
  {
    login: 'comptable',
    label: 'Comptable',
    description:
      'Comptabilité : dépenses, factures, comptes bancaires, caisse et crédits. Consultation du reste de l’application (lecture seule hors ces modules).',
  },
  {
    login: 'admin',
    label: 'Administrateur',
    description: 'Tous les droits : flotte, trésorerie, comptabilité et paramètres.',
  },
] as const;
