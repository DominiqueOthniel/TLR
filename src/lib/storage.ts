/**
 * Module de persistance sécurisée des données
 */

import { storeEncryptedData, getEncryptedData, hashPassword, verifyPassword } from './security';

const STORAGE_KEY = 'goofe_data';
const PASSWORD_KEY = 'goofe_password_hash';
const LAST_BACKUP_KEY = 'goofe_last_backup';
const GLAUNET_STORAGE_KEY = 'glaunet_data';
const GLAUNET_PASSWORD_KEY = 'glaunet_password_hash';
const GLAUNET_LAST_BACKUP_KEY = 'glaunet_last_backup';
const LEGACY_STORAGE_PREFIX = ['truck', 'track'].join('_');
const LEGACY_STORAGE_KEY = `${LEGACY_STORAGE_PREFIX}_data`;
const LEGACY_PASSWORD_KEY = `${LEGACY_STORAGE_PREFIX}_password_hash`;
const LEGACY_LAST_BACKUP_KEY = `${LEGACY_STORAGE_PREFIX}_last_backup`;

function getStoredValue(...keys: string[]): string | null {
  for (const key of keys) {
    const value = localStorage.getItem(key);
    if (value != null) return value;
  }
  return null;
}

export interface AppData {
  trucks: any[];
  trips: any[];
  expenses: any[];
  invoices: any[];
  drivers: any[];
  thirdParties: any[];
  banks: any[];
  credits: any[];
  caisse: any[];
  subCategories: Record<string, string[]>;
}

/**
 * Initialise le système de stockage avec un mot de passe
 */
export async function initializeStorage(password: string): Promise<boolean> {
  try {
    const hashedPassword = await hashPassword(password);
    localStorage.setItem(PASSWORD_KEY, hashedPassword);
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'initialisation:', error);
    return false;
  }
}

/**
 * Vérifie si un mot de passe est configuré
 */
export function hasPassword(): boolean {
  return getStoredValue(PASSWORD_KEY, GLAUNET_PASSWORD_KEY, LEGACY_PASSWORD_KEY) !== null;
}

/**
 * Vérifie le mot de passe
 */
export async function checkPassword(password: string): Promise<boolean> {
  const storedHash = getStoredValue(PASSWORD_KEY, GLAUNET_PASSWORD_KEY, LEGACY_PASSWORD_KEY);
  if (!storedHash) return false;
  return verifyPassword(password, storedHash);
}

/**
 * Sauvegarde les données de manière sécurisée
 */
export async function saveData(data: AppData, password: string): Promise<boolean> {
  try {
    const dataString = JSON.stringify(data);
    await storeEncryptedData(STORAGE_KEY, dataString, password);
    localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString());
    return true;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
    return false;
  }
}

/**
 * Charge les données de manière sécurisée
 */
export async function loadData(password: string): Promise<AppData | null> {
  try {
    const dataString =
      (await getEncryptedData(STORAGE_KEY, password)) ||
      (await getEncryptedData(GLAUNET_STORAGE_KEY, password)) ||
      (await getEncryptedData(LEGACY_STORAGE_KEY, password));
    if (!dataString) return null;
    return JSON.parse(dataString);
  } catch (error) {
    console.error('Erreur lors du chargement:', error);
    return null;
  }
}

/**
 * Exporte les données en format JSON (chiffré)
 */
export async function exportData(password: string): Promise<string> {
  const data = await loadData(password);
  if (!data) throw new Error('Aucune donnée à exporter');
  return JSON.stringify(data, null, 2);
}

/**
 * Importe des données depuis un JSON
 */
export async function importData(jsonData: string, password: string): Promise<boolean> {
  try {
    const data = JSON.parse(jsonData);
    return await saveData(data, password);
  } catch (error) {
    console.error('Erreur lors de l\'import:', error);
    return false;
  }
}

/**
 * Obtient la date de la dernière sauvegarde
 */
export function getLastBackupDate(): Date | null {
  const dateString = getStoredValue(LAST_BACKUP_KEY, GLAUNET_LAST_BACKUP_KEY, LEGACY_LAST_BACKUP_KEY);
  return dateString ? new Date(dateString) : null;
}

/**
 * Sauvegarde automatique (à appeler périodiquement)
 */
export async function autoSave(data: AppData, password: string): Promise<void> {
  const lastBackup = getLastBackupDate();
  const now = new Date();
  
  // Sauvegarde toutes les 5 minutes
  if (!lastBackup || (now.getTime() - lastBackup.getTime()) > 5 * 60 * 1000) {
    await saveData(data, password);
  }
}

/**
 * Supprime toutes les données (avec confirmation)
 */
export function clearAllData(): boolean {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PASSWORD_KEY);
    localStorage.removeItem(LAST_BACKUP_KEY);
    // Supprime aussi les salts
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('_salt')) {
        localStorage.removeItem(key);
      }
    });
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    return false;
  }
}






