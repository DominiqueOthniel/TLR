import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { setApiActor, usersApi } from '@/lib/api';

const AUTH_STORAGE_KEY = 'goofe_auth';
const FALLBACK_PASSWORDS_STORAGE_KEY = 'tlr_fallback_password_hashes';
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

const FALLBACK_USERS: UserSummary[] = [
  { login: 'pdg', role: 'pdg' },
  { login: 'sara', role: 'admin' },
  { login: 'hammanwabi', role: 'admin' },
];

const FALLBACK_PASSWORD_HASHES: Record<string, string> = {
  pdg: '3c7c0c24b79903bae96dc85669cc58d82a0142ca87084ac0958652179de21ad3',
  sara: '926b4b8a00cfab44b758450fa6bf188d4bf8541c2fd6b3d9b93d152d43a99f64',
  hammanwabi: '0892b4377c41d5c3d7d85f2161212e1bd1c57c19b9b446ce8dfea7b7bee8c9c5',
};

function readFallbackPasswordHashes(): Record<string, string> {
  try {
    const raw = localStorage.getItem(FALLBACK_PASSWORDS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function getFallbackPasswordHash(login: string): string | undefined {
  return readFallbackPasswordHashes()[login] || FALLBACK_PASSWORD_HASHES[login];
}

function saveFallbackPasswordHash(login: string, passwordHash: string): void {
  const hashes = readFallbackPasswordHashes();
  hashes[login] = passwordHash;
  localStorage.setItem(FALLBACK_PASSWORDS_STORAGE_KEY, JSON.stringify(hashes));
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

interface AuthContextType {
  user: User | null;
  login: (login: string, password: string) => Promise<boolean>;
  logout: () => void;
  users: UserSummary[];
  usersLoading: boolean;
  usersError: string | null;
  refreshUsers: () => Promise<void>;
  createUser: (login: string, role: UserRole, password: string) => Promise<void>;
  changeUserPassword: (targetLogin: string, newPassword: string) => Promise<void>;
  changeUserRole: (targetLogin: string, role: UserRole) => Promise<void>;
  deleteUser: (targetLogin: string) => Promise<void>;
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
  const [users, setUsers] = useState<UserSummary[]>(FALLBACK_USERS);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);

  const refreshUsers = useCallback(async () => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const list = await usersApi.getAll();
      if (list.length > 0) {
        setUsers(list.map((u) => ({ login: u.login, role: normalizeRole(u.role) })));
      } else {
        setUsers(FALLBACK_USERS);
        setUsersError('Aucun compte trouvé en ligne. Vérifiez que le backend est bien déployé avec la table app_users.');
      }
    } catch {
      setUsers(FALLBACK_USERS);
      setUsersError('Impossible de joindre le serveur des comptes. Vérifiez VITE_API_URL et le redéploiement du backend.');
    } finally {
      setUsersLoading(false);
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
    const normalizedLogin = normalizeLogin(loginInput);
    try {
      const result = await usersApi.login(normalizedLogin, password);
      const u: User = { login: result.login, role: normalizeRole(result.role) };
      setUser(u);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(u));
      return true;
    } catch {
      const fallback = FALLBACK_USERS.find((u) => u.login === normalizedLogin);
      if (!fallback) return false;
      const passwordHash = await hashPassword(password);
      if (passwordHash !== getFallbackPasswordHash(normalizedLogin)) return false;

      const u: User = { login: fallback.login, role: fallback.role };
      setUser(u);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(u));
      return true;
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

    try {
      await usersApi.changePassword(normalizedLogin, newPassword);
      await refreshUsers();
    } catch (err) {
      const fallback = FALLBACK_USERS.find((u) => u.login === normalizedLogin);
      if (!fallback) throw err;
      saveFallbackPasswordHash(normalizedLogin, await hashPassword(newPassword));
    }
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

  const deleteUser = async (targetLogin: string): Promise<void> => {
    if (!user || user.role !== 'admin') {
      throw new Error('Action réservée à l’administrateur.');
    }
    const normalizedLogin = normalizeLogin(targetLogin);
    validateLogin(normalizedLogin);
    if (normalizedLogin === user.login.toLowerCase()) {
      throw new Error('Impossible de supprimer le compte actuellement connecté.');
    }

    await usersApi.delete(normalizedLogin);
    await refreshUsers();
  };

  const changeOwnPassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    if (!user) throw new Error('Utilisateur non connecté.');
    validateNewPassword(newPassword);
    try {
      await usersApi.changeOwnPassword(currentPassword, newPassword);
      await refreshUsers();
    } catch (err) {
      const normalizedLogin = normalizeLogin(user.login);
      const fallback = FALLBACK_USERS.find((u) => u.login === normalizedLogin);
      if (!fallback) throw err;

      const currentHash = await hashPassword(currentPassword);
      if (currentHash !== getFallbackPasswordHash(normalizedLogin)) {
        throw new Error('Mot de passe actuel incorrect.');
      }
      saveFallbackPasswordHash(normalizedLogin, await hashPassword(newPassword));
    }
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
        usersLoading,
        usersError,
        refreshUsers,
        createUser,
        changeUserPassword,
        changeUserRole,
        deleteUser,
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
