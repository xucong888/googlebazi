import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  apiGetPoints,
  apiUsePoints,
  apiAddPoints,
  apiDailyCheckIn,
  apiGetPointsHistory,
  getCurrentUser,
  type PointsHistoryItem,
} from '../api';

interface PointsContextType {
  points: number;
  isLoading: boolean;
  usePoints: (amount: number, description: string) => Promise<{ success: boolean; message: string }>;
  addPoints: (amount: number, description: string, source: string) => Promise<void>;
  checkPoints: (amount: number) => boolean;
  getPointsHistory: () => Promise<PointsHistoryItem[]>;
  dailyCheckIn: () => Promise<{ success: boolean; message: string }>;
  refreshPoints: () => Promise<void>;
}

const PointsContext = createContext<PointsContextType | undefined>(undefined);

export const PointsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [points, setPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const refreshPoints = async () => {
    if (!getCurrentUser()) return;
    try {
      const p = await apiGetPoints();
      setPoints(p);
    } catch {
      // token expired or network error — handled elsewhere
    }
  };

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setPoints(user.points ?? 0);
      refreshPoints().finally(() => setIsLoading(false));
    } else {
      setPoints(0);
      setIsLoading(false);
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'auth_token') {
        const user = getCurrentUser();
        if (user) {
          refreshPoints();
        } else {
          setPoints(0);
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const checkPoints = useCallback((amount: number): boolean => points >= amount, [points]);

  const usePoints = async (amount: number, description: string): Promise<{ success: boolean; message: string }> => {
    if (!getCurrentUser()) return { success: false, message: '请先登录' };
    try {
      const result = await apiUsePoints(amount, description);
      if (result.success && result.balance !== undefined) setPoints(result.balance);
      return result;
    } catch (err: any) {
      return { success: false, message: err?.message || '积分扣除失败' };
    }
  };

  const addPoints = async (amount: number, description: string, source: string) => {
    if (!getCurrentUser()) return;
    try {
      const result = await apiAddPoints(amount, description, source);
      if (result.balance !== undefined) setPoints(result.balance);
    } catch (err) {
      console.error('Add points error:', err);
    }
  };

  const dailyCheckIn = async (): Promise<{ success: boolean; message: string }> => {
    if (!getCurrentUser()) return { success: false, message: '请先登录' };
    try {
      const result = await apiDailyCheckIn();
      if (result.success && result.balance !== undefined) setPoints(result.balance);
      return result;
    } catch (err: any) {
      return { success: false, message: err?.message || '签到失败' };
    }
  };

  const getPointsHistory = async (): Promise<PointsHistoryItem[]> => {
    if (!getCurrentUser()) return [];
    try {
      return await apiGetPointsHistory();
    } catch {
      return [];
    }
  };

  return (
    <PointsContext.Provider value={{ points, isLoading, usePoints, addPoints, checkPoints, getPointsHistory, dailyCheckIn, refreshPoints }}>
      {children}
    </PointsContext.Provider>
  );
};

export const usePoints = (): PointsContextType => {
  const context = useContext(PointsContext);
  if (context === undefined) throw new Error('usePoints must be used within a PointsProvider');
  return context;
};
