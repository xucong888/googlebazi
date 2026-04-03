import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { auth, db } from '../firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  serverTimestamp,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
  increment,
  runTransaction
} from 'firebase/firestore';
import { POINT_COSTS, FREE_POINTS, POINTS_EXPIRY_DAYS } from './pointConfig';

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

interface PointsHistoryItem {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  description: string;
  source: string;
  createdAt: Timestamp;
  balance: number;
}

const PointsContext = createContext<PointsContextType | undefined>(undefined);

export const PointsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [points, setPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化用户积分
  const initUserPoints = async (uid: string) => {
    const userPointsRef = doc(db, 'userPoints', uid);
    const docSnap = await getDoc(userPointsRef);
    
    if (!docSnap.exists()) {
      // 新用户，赠送注册积分
      await setDoc(userPointsRef, {
        points: FREE_POINTS.REGISTER,
        totalEarned: FREE_POINTS.REGISTER,
        totalSpent: 0,
        lastCheckIn: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      // 记录积分流水
      await addDoc(collection(db, 'pointsHistory'), {
        uid,
        amount: FREE_POINTS.REGISTER,
        type: 'income',
        description: '新用户注册奖励',
        source: 'register',
        balance: FREE_POINTS.REGISTER,
        createdAt: serverTimestamp(),
      });
      
      setPoints(FREE_POINTS.REGISTER);
    } else {
      setPoints(docSnap.data().points || 0);
    }
  };

  // 刷新积分
  const refreshPoints = async () => {
    if (!auth.currentUser) return;
    
    const userPointsRef = doc(db, 'userPoints', auth.currentUser.uid);
    const docSnap = await getDoc(userPointsRef);
    
    if (docSnap.exists()) {
      setPoints(docSnap.data().points || 0);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        initUserPoints(user.uid);
      } else {
        setPoints(0);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 检查积分是否足够
  const checkPoints = useCallback((amount: number): boolean => {
    return points >= amount;
  }, [points]);

  // 使用积分
  const usePoints = async (amount: number, description: string): Promise<{ success: boolean; message: string }> => {
    if (!auth.currentUser) {
      return { success: false, message: '请先登录' };
    }

    if (points < amount) {
      return { success: false, message: `积分不足，需要 ${amount} 积分，当前 ${points} 积分` };
    }

    try {
      const uid = auth.currentUser.uid;
      const userPointsRef = doc(db, 'userPoints', uid);

      await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(userPointsRef);
        
        if (!docSnap.exists()) {
          throw new Error('User points document not found');
        }

        const currentPoints = docSnap.data().points;
        
        if (currentPoints < amount) {
          throw new Error('Insufficient points');
        }

        const newBalance = currentPoints - amount;

        // 更新积分
        transaction.update(userPointsRef, {
          points: newBalance,
          totalSpent: increment(amount),
          updatedAt: serverTimestamp(),
        });

        // 记录流水
        const historyRef = doc(collection(db, 'pointsHistory'));
        transaction.set(historyRef, {
          uid,
          amount: -amount,
          type: 'expense',
          description,
          source: 'consumption',
          balance: newBalance,
          createdAt: serverTimestamp(),
        });
      });

      setPoints(prev => prev - amount);
      return { success: true, message: `已消耗 ${amount} 积分` };
    } catch (error: any) {
      console.error('Use points error:', error);
      return { success: false, message: error.message || '积分扣除失败' };
    }
  };

  // 增加积分
  const addPoints = async (amount: number, description: string, source: string) => {
    if (!auth.currentUser) return;

    const uid = auth.currentUser.uid;
    const userPointsRef = doc(db, 'userPoints', uid);

    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(userPointsRef);
      
      let currentPoints = 0;
      if (docSnap.exists()) {
        currentPoints = docSnap.data().points;
      }

      const newBalance = currentPoints + amount;

      if (docSnap.exists()) {
        transaction.update(userPointsRef, {
          points: newBalance,
          totalEarned: increment(amount),
          updatedAt: serverTimestamp(),
        });
      } else {
        transaction.set(userPointsRef, {
          points: newBalance,
          totalEarned: amount,
          totalSpent: 0,
          lastCheckIn: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      // 记录流水
      const historyRef = doc(collection(db, 'pointsHistory'));
      transaction.set(historyRef, {
        uid,
        amount,
        type: 'income',
        description,
        source,
        balance: newBalance,
        createdAt: serverTimestamp(),
      });
    });

    setPoints(prev => prev + amount);
  };

  // 每日签到
  const dailyCheckIn = async (): Promise<{ success: boolean; message: string }> => {
    if (!auth.currentUser) {
      return { success: false, message: '请先登录' };
    }

    const uid = auth.currentUser.uid;
    const userPointsRef = doc(db, 'userPoints', uid);
    const docSnap = await getDoc(userPointsRef);

    if (!docSnap.exists()) {
      return { success: false, message: '用户数据不存在' };
    }

    const lastCheckIn = docSnap.data().lastCheckIn?.toDate();
    const now = new Date();

    // 检查今天是否已签到
    if (lastCheckIn) {
      // 检查今天是否已签到
      const lastDate = new Date(lastCheckIn);
      const isSameYear = lastDate.getFullYear() === now.getFullYear();
      const isSameMonth = lastDate.getMonth() === now.getMonth();
      const isSameDay = lastDate.getDate() === now.getDate();
      
      if (isSameYear && isSameMonth && isSameDay) {
        return { success: false, message: '今日已签到，明天再来吧' };
      }    }

    // 计算连续签到奖励
    let bonusPoints = FREE_POINTS.DAILY_CHECKIN;
    // TODO: 连续签到 7 天额外奖励

    await updateDoc(userPointsRef, {
      points: increment(bonusPoints),
      lastCheckIn: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 记录流水
    await addDoc(collection(db, 'pointsHistory'), {
      uid,
      amount: bonusPoints,
      type: 'income',
      description: `每日签到 +${bonusPoints} 积分`,
      source: 'daily_checkin',
      balance: points + bonusPoints,
      createdAt: serverTimestamp(),
    });

    setPoints(prev => prev + bonusPoints);
    return { success: true, message: `签到成功，获得 ${bonusPoints} 积分` };
  };

  // 获取积分历史
  const getPointsHistory = async (): Promise<PointsHistoryItem[]> => {
    if (!auth.currentUser) return [];

    const q = query(
      collection(db, 'pointsHistory'),
      where('uid', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as PointsHistoryItem));
  };

  return (
    <PointsContext.Provider
      value={{
        points,
        isLoading,
        usePoints,
        addPoints,
        checkPoints,
        getPointsHistory,
        dailyCheckIn,
        refreshPoints,
      }}
    >
      {children}
    </PointsContext.Provider>
  );
};

export const usePoints = (): PointsContextType => {
  const context = useContext(PointsContext);
  if (context === undefined) {
    throw new Error('usePoints must be used within a PointsProvider');
  }
  return context;
};
