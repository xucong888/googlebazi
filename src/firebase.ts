// Firebase replaced with self-hosted Express + SQLite backend
import { apiSaveHistory, apiGetHistory, apiDeleteHistory, apiUpdateHistory, getCurrentUser } from './api';

export { logout } from './api';

export const auth = {
  currentUser: null as any,
  onAuthStateChanged: (_cb: (u: any) => void) => () => {},
};

export const loginWithGoogle = async () => {
  throw new Error('Google login not available');
};

export interface HistoryRecord {
  uid: string;
  name: string;
  birthInfo: any;
  fateData: any;
  aiReport?: string | null;
  createdAt: number;
}

export const saveFateRecord = async (record: Omit<HistoryRecord, 'createdAt'>) => {
  return apiSaveHistory({
    name: record.name,
    birthInfo: record.birthInfo,
    fateData: record.fateData,
    aiReport: record.aiReport,
  });
};

export const getHistory = async (_uid?: string) => {
  return apiGetHistory();
};

export const deleteFateRecord = async (id: string) => {
  return apiDeleteHistory(id);
};

export const updateFateRecord = async (id: string, data: Partial<HistoryRecord>) => {
  if (data.aiReport !== undefined) {
    return apiUpdateHistory(id, data.aiReport ?? null);
  }
};
