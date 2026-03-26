import React, { useState, useEffect, Component, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Calendar, 
  Clock, 
  MapPin, 
  ChevronRight, 
  LayoutDashboard, 
  Zap, 
  Moon, 
  Sun,
  Info,
  Share2,
  Download,
  BrainCircuit,
  Compass,
  Star,
  Users,
  Fingerprint,
  Menu,
  X,
  History,
  CheckCircle2,
  Lock,
  Coins,
  ArrowRight,
  Plus,
  Globe,
  User
} from 'lucide-react';
import { 
  calculateBazi, 
  getZodiac, 
  getWesternZodiac, 
  calculateZiwei,
  calculateWesternAstrology,
  calculateLifeNumerology,
  BaziData,
  ZiweiData
} from './services/fateEngine';
import { Lunar, Solar, LunarYear } from 'lunar-javascript';
import { getUnifiedInterpretation, chatWithMaster } from './services/aiService';
import { auth, loginWithGoogle, logout, saveFateRecord, getHistory } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import ReactMarkdown from 'react-markdown';
import { SYSTEMS, YEARS } from './constants/fateData';
import { Country, State, City } from 'country-state-city';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState;
  public props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "出错了，请稍后再试。";
      try {
        const parsedError = JSON.parse(this.state.error.message);
        if (parsedError.error.includes("Missing or insufficient permissions")) {
          errorMessage = "权限不足，请确保您已登录。";
        }
      } catch (e) {
        // Not a JSON error
      }
      
      return (
        <div className="min-h-screen bg-paper-50 flex flex-col items-center justify-center p-8 text-center">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md space-y-4">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <X className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-serif text-ink-900">系统提示</h2>
            <p className="text-sm text-ink-500">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-ink-900 text-paper-50 py-3 rounded-xl text-sm font-bold hover:bg-ink-800 transition-all"
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import { CHINA_CITY_MAP } from './city-map';
import { CHINA_PROVINCE_CITIES, CHINA_PROVINCE_FULL_NAMES } from './china-cities';

export default function App() {
  const [step, setStep] = useState<'input' | 'dashboard'>('input');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [points, setPoints] = useState(100);
  const [selectedSystems, setSelectedSystems] = useState<string[]>(['bazi']);
  const [isAuthReady, setIsAuthReady] = useState(false); // Placeholder for auth readiness
  const [calcError, setCalcError] = useState<string | null>(null);
  const [selectedPalace, setSelectedPalace] = useState<number | null>(null);
  
  const [birthInfo, setBirthInfo] = useState({
    name: '徐聪',
    gender: 'male' as 'male' | 'female',
    calendarType: 'solar' as 'solar' | 'lunar',
    isLeap: false,
    year: 1996,
    month: 5,
    day: 8,
    hour: 8,
    minute: 30,
    longitude: 116.4,
    country: 'CN',
    province: 'GD',
    city: 'GZ',
    district: '',
  });

  const [mbti, setMbti] = useState({
    energy: 'I' as 'I' | 'E',
    perception: 'N' as 'S' | 'N',
    judgment: 'F' as 'T' | 'F',
    lifestyle: 'P' as 'J' | 'P',
  });
  const [showMbti, setShowMbti] = useState(false);

  const [saveToHistory, setSaveToHistory] = useState(true);

  // 辅助函数：获取国家的中文名称
  const getCountryName = (isoCode: string) => {
    try {
      return new Intl.DisplayNames(['zh-Hans'], { type: 'region' }).of(isoCode) || isoCode;
    } catch {
      return isoCode;
    }
  };

  // 中国省份 ISO 代码到中文的映射
  const CHINA_PROVINCE_MAP: Record<string, string> = {
    'AH': '安徽', 'BJ': '北京', 'CQ': '重庆', 'FJ': '福建', 'GD': '广东', 'GS': '甘肃', 'GX': '广西', 'GZ': '贵州', 'HA': '海南', 'HB': '湖北', 'HE': '河北', 'HI': '海南', 'HL': '黑龙江', 'HN': '湖南', 'JL': '吉林', 'JS': '江苏', 'JX': '江西', 'LN': '辽宁', 'NM': '内蒙古', 'NX': '宁夏', 'QH': '青海', 'SC': '四川', 'SD': '山东', 'SH': '上海', 'SN': '陕西', 'SX': '山西', 'TJ': '天津', 'XJ': '新疆', 'XZ': '西藏', 'YN': '云南', 'ZJ': '浙江', 'HK': '香港', 'MO': '澳门', 'TW': '台湾'
  };

  const getProvinceName = (countryCode: string, provinceCode: string, defaultName: string) => {
    if (countryCode === 'CN' && CHINA_PROVINCE_MAP[provinceCode]) {
      return CHINA_PROVINCE_MAP[provinceCode];
    }
    return defaultName;
  };

  const getCityName = (countryCode: string, cityName: string) => {
    if (countryCode === 'CN') {
      // 尝试直接匹配
      if (CHINA_CITY_MAP[cityName]) return CHINA_CITY_MAP[cityName];
      
      // 尝试去除常见后缀后匹配
      const cleanName = cityName.replace(/ (City|Shi|Prefecture|League|Autonomous Prefecture|Diqu|Zizhizhou)$/, '');
      if (CHINA_CITY_MAP[cleanName]) return CHINA_CITY_MAP[cleanName];

      // 尝试忽略大小写和空格的完全匹配
      const found = Object.keys(CHINA_CITY_MAP).find(key => 
        key.toLowerCase().replace(/\s+/g, '') === cityName.toLowerCase().replace(/\s+/g, '') || 
        key.toLowerCase().replace(/\s+/g, '') === cleanName.toLowerCase().replace(/\s+/g, '')
      );
      if (found) return CHINA_CITY_MAP[found];
    }
    return cityName;
  };

  const getCitiesForSelect = (countryCode: string, stateCode: string) => {
    if (countryCode === 'CN') {
      const fullProvinceName = CHINA_PROVINCE_FULL_NAMES[stateCode];
      if (fullProvinceName && CHINA_PROVINCE_CITIES[fullProvinceName]) {
        return CHINA_PROVINCE_CITIES[fullProvinceName].map(name => ({ name }));
      }
      return [];
    }
    return City.getCitiesOfState(countryCode, stateCode);
  };
  const [fateData, setFateData] = useState<{
    bazi: BaziData | null;
    ziwei: ZiweiData | null;
    western: any | null;
    mbti: any | null;
    zodiac: string;
    westernZodiac: string;
  }>({
    bazi: null,
    ziwei: null,
    western: null,
    mbti: null,
    zodiac: '',
    westernZodiac: '',
  });
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isUnlockingAi, setIsUnlockingAi] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [aiDepth, setAiDepth] = useState<'quick' | 'deep'>('quick');
  const [activeTab, setActiveTab] = useState('bazi');
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setIsLoggedIn(true);
        setUser(u);
        loadHistory(u.uid);
      } else {
        setIsLoggedIn(false);
        setUser(null);
        setHistory([]);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const loadHistory = async (uid: string) => {
    try {
      const h = await getHistory(uid);
      setHistory(h);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const getLunarDateDisplay = (year: number, month: number, day: number, type: 'solar' | 'lunar', isLeap?: boolean) => {
    try {
      if (type === 'solar') {
        const solar = Solar.fromYmd(year, month, day);
        const lunar = solar.getLunar();
        return `${lunar.getYearInGanZhi()}年 ${lunar.getMonthInChinese()}月 ${lunar.getDayInChinese()}`;
      } else {
        const lunar = Lunar.fromYmd(year, isLeap ? -month : month, day);
        return `${lunar.getYearInGanZhi()}年 ${lunar.getMonthInChinese()}月 ${lunar.getDayInChinese()}`;
      }
    } catch (e) {
      return '';
    }
  };

  const getSolarDateDisplay = (year: number, month: number, day: number, type: 'solar' | 'lunar', isLeap?: boolean) => {
    try {
      if (type === 'lunar') {
        const lunar = Lunar.fromYmd(year, isLeap ? -month : month, day);
        const solar = lunar.getSolar();
        return `${solar.getYear()}-${solar.getMonth()}-${solar.getDay()}`;
      } else {
        return `${year}-${month}-${day}`;
      }
    } catch (e) {
      return '';
    }
  };

  const getShichen = (hour: number) => {
    const shichen = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    const index = Math.floor((hour + 1) / 2) % 12;
    return shichen[index] + '时';
  };

  const getOtherCalendarPreview = () => {
    try {
      const shichenStr = getShichen(birthInfo.hour);
      if (birthInfo.calendarType === 'solar') {
        const solar = Solar.fromYmd(birthInfo.year, birthInfo.month, birthInfo.day);
        const lunar = solar.getLunar();
        return `对应农历：${lunar.getYearInGanZhi()}年 ${lunar.getMonth() < 0 ? '闰' : ''}${lunar.getMonthInChinese()}月 ${lunar.getDayInChinese()} (${shichenStr})`;
      } else {
        const lunar = Lunar.fromYmd(birthInfo.year, birthInfo.isLeap ? -birthInfo.month : birthInfo.month, birthInfo.day);
        const solar = lunar.getSolar();
        return `对应公历：${solar.getYear()}年 ${solar.getMonth()}月 ${solar.getDay()}日 (${shichenStr})`;
      }
    } catch (e) {
      return '日期无效';
    }
  };

  const getElementColor = (char: string) => {
    if ('甲乙寅卯'.includes(char)) return 'text-emerald-600'; // 木
    if ('丙丁巳午'.includes(char)) return 'text-red-600';     // 火
    if ('戊己辰戌丑未'.includes(char)) return 'text-amber-700'; // 土
    if ('庚辛申酉'.includes(char)) return 'text-zinc-400';   // 金
    if ('壬癸亥子'.includes(char)) return 'text-blue-600';    // 水
    return 'text-ink-900';
  };

  const toggleCalendarType = (type: 'solar' | 'lunar') => {
    if (type === birthInfo.calendarType) return;
    
    try {
      if (type === 'lunar') {
        // From Solar to Lunar
        const solar = Solar.fromYmd(birthInfo.year, birthInfo.month, birthInfo.day);
        const lunar = solar.getLunar();
        setBirthInfo({
          ...birthInfo,
          calendarType: 'lunar',
          isLeap: lunar.getMonth() < 0,
          year: lunar.getYear(),
          month: Math.abs(lunar.getMonth()),
          day: lunar.getDay()
        });
      } else {
        // From Lunar to Solar
        const lunar = Lunar.fromYmd(birthInfo.year, birthInfo.isLeap ? -birthInfo.month : birthInfo.month, birthInfo.day);
        const solar = lunar.getSolar();
        setBirthInfo({
          ...birthInfo,
          calendarType: 'solar',
          isLeap: false,
          year: solar.getYear(),
          month: solar.getMonth(),
          day: solar.getDay()
        });
      }
    } catch (e) {
      setBirthInfo({ ...birthInfo, calendarType: type });
    }
  };

  const isLeapMonthAvailable = (year: number, month: number) => {
    try {
      const lunarYear = LunarYear.fromYear(year);
      return lunarYear.getLeapMonth() === month;
    } catch (e) {
      return false;
    }
  };

  const handleCalculate = async () => {
    if (selectedSystems.length === 0) return;
    setIsCalculating(true);
    setCalcError(null);
    
    // Construct date for calculation
    let date: Date;
    try {
      if (birthInfo.calendarType === 'lunar') {
        const lunar = Lunar.fromYmd(birthInfo.year, birthInfo.isLeap ? -birthInfo.month : birthInfo.month, birthInfo.day);
        const solar = lunar.getSolar();
        date = new Date(solar.getYear(), solar.getMonth() - 1, solar.getDay(), birthInfo.hour, birthInfo.minute);
      } else {
        date = new Date(birthInfo.year, birthInfo.month - 1, birthInfo.day, birthInfo.hour, birthInfo.minute);
      }
    } catch (err: any) {
      console.error('Date construction error:', err);
      setCalcError(`日期错误: ${err.message || '请检查输入的日期是否有效（特别是闰月设置）'}`);
      setIsCalculating(false);
      return;
    }
    
    await new Promise(r => setTimeout(r, 1500));
    
    const data: any = {
      zodiac: getZodiac(date),
      westernZodiac: getWesternZodiac(date),
    };

    try {
      if (selectedSystems.includes('bazi')) {
        data.bazi = calculateBazi(
          birthInfo.year,
          birthInfo.month,
          birthInfo.day,
          birthInfo.hour,
          birthInfo.minute,
          birthInfo.calendarType,
          birthInfo.isLeap,
          birthInfo.gender
        );
      }
      if (selectedSystems.includes('ziwei')) {
        data.ziwei = calculateZiwei(
          birthInfo.year,
          birthInfo.month,
          birthInfo.day,
          birthInfo.hour,
          birthInfo.minute,
          birthInfo.calendarType,
          birthInfo.isLeap,
          birthInfo.gender,
          birthInfo.longitude
        );
      }
      if (selectedSystems.includes('western')) data.western = calculateWesternAstrology(date);
      if (selectedSystems.includes('mbti')) data.mbti = mbti;
      
      // Always calculate Life Numerology as it's part of AI's core systems
      data.lifeNumerology = calculateLifeNumerology(birthInfo.year, birthInfo.month, birthInfo.day);
    } catch (err) {
      console.error('Calculation error:', err);
      setIsCalculating(false);
      return;
    }

    if (saveToHistory && user) {
      try {
        await saveFateRecord({
          uid: user.uid,
          name: birthInfo.name,
          birthInfo,
          fateData: data
        });
        loadHistory(user.uid);
      } catch (err) {
        console.error('Failed to save history:', err);
      }
    }

    setFateData(data);
    setStep('dashboard');
    setSelectedPalace(null);
    setIsCalculating(false);
    setActiveTab(selectedSystems[0]);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const unlockAiInterpretation = async () => {
    const cost = aiDepth === 'deep' ? 50 : 10;
    if (points < cost) return;
    setIsUnlockingAi(true);
    setAiProgress(0);
    setPoints(prev => prev - cost);
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setAiProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 5;
      });
    }, 500);

    try {
      const report = await getUnifiedInterpretation(birthInfo, fateData, aiDepth);
      setAiReport(report);
      setAiProgress(100);
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setIsUnlockingAi(false);
        setAiProgress(0);
      }, 500);
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim() || isSendingChat) return;
    
    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsSendingChat(true);
    
    const response = await chatWithMaster(birthInfo, fateData, chatMessages, userMessage);
    setChatMessages(prev => [...prev, { role: 'model', text: response }]);
    setIsSendingChat(false);
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#FDFCF9] flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-2 border-gold-200 border-t-gold-600 rounded-full"
        />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#FDFCF9] text-ink-900 selection:bg-accent-muted/20">
      {/* Subtle Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />

      <header className="fixed top-0 left-0 right-0 z-50 bg-[#FDFCF9]/80 backdrop-blur-md border-b border-paper-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-serif tracking-tight text-ink-900">悬壶承光</h1>
            </div>
            <nav className="hidden md:flex items-center gap-8 text-[10px] uppercase tracking-[0.2em] font-bold text-ink-400">
              <a href="#" className="hover:text-ink-900 transition-colors flex items-center gap-1.5">
                {!isLoggedIn && <Lock size={10} />}
                ARCHIVE
              </a>
              <a href="#" className="hover:text-ink-900 transition-colors">PHILOSOPHY</a>
              <a href="#" className="hover:text-ink-900 transition-colors">CONSULTATION</a>
            </nav>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-ink-400">
              <button className="hover:text-ink-900 transition-colors"><Sun size={18} /></button>
              <button className="hover:text-ink-900 transition-colors"><Plus size={18} /></button>
              <button className="hover:text-ink-900 transition-colors"><Globe size={18} /></button>
            </div>
            <div className="h-4 w-[1px] bg-paper-200" />
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-[11px] font-bold text-ink-900">
                <span>积分: {points}</span>
                <button 
                  onClick={() => {
                    setPoints(prev => prev + 10);
                    setShowSuccessToast(true);
                  }}
                  className="text-gold-600 hover:text-gold-700 transition-colors ml-2"
                >
                  签到 +10
                </button>
              </div>
              {isLoggedIn && user ? (
                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-bold text-ink-900">{user.displayName}</p>
                    <button 
                      onClick={handleLogout}
                      className="text-[9px] text-ink-400 hover:text-red-500 transition-colors uppercase tracking-widest"
                    >
                      退出登录 / LOGOUT
                    </button>
                  </div>
                  <div className="w-10 h-10 rounded-full border border-paper-200 overflow-hidden">
                    <img 
                      src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                      alt={user.displayName || 'User'} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              ) : (
                <button 
                  onClick={handleLogin}
                  className="w-10 h-10 rounded-full border border-paper-200 flex items-center justify-center text-ink-400 hover:border-ink-900 hover:text-ink-900 transition-all"
                >
                  <User size={20} />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-16">
        <AnimatePresence mode="wait">
          {step === 'input' ? (
            <motion.div 
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto space-y-16"
            >
              {/* Header */}
              <div className="text-center space-y-6">
                <h2 className="text-4xl md:text-5xl font-serif leading-[1.2]">
                  探寻生命之<br className="md:hidden" />
                  <span className="italic">静谧</span>
                </h2>
                <div className="w-12 h-[1px] bg-ink-900/20 mx-auto" />
                <p className="text-ink-500 font-light tracking-wide max-w-sm mx-auto text-xs md:text-sm leading-relaxed">
                  输入您的生辰信息，<br className="md:hidden" />开启一场跨越东西方智慧的深度对话。
                </p>
              </div>

              {/* Module 1: System Selection */}
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-ink-900 text-paper-50 flex items-center justify-center text-[10px] font-bold">01</div>
                  <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold text-ink-900">选择测算体系 / SYSTEMS</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {SYSTEMS.map(system => (
                    <button
                      key={system.id}
                      onClick={() => {
                        setSelectedSystems(prev => 
                          prev.includes(system.id) 
                            ? prev.filter(id => id !== system.id)
                            : [...prev, system.id]
                        );
                      }}
                      className={cn(
                        "p-4 border text-left transition-all group relative overflow-hidden h-24 flex flex-col justify-between",
                        selectedSystems.includes(system.id)
                          ? "border-ink-900 bg-ink-900 text-paper-50"
                          : "border-paper-200 hover:border-ink-300 bg-white"
                      )}
                    >
                      <p className={cn(
                        "text-[9px] font-bold uppercase tracking-wider",
                        selectedSystems.includes(system.id) ? "text-paper-50/60" : "text-ink-400"
                      )}>{system.category}</p>
                      <p className="text-xs font-serif">{system.label}</p>
                      {selectedSystems.includes(system.id) && (
                        <CheckCircle2 className="absolute top-2 right-2 w-3 h-3 text-paper-50/50" />
                      )}
                    </button>
                  ))}
                </div>
              </section>

              {/* Module 2: History Data (Login Required) */}
              <section className="p-8 bg-paper-50/50 border border-dashed border-ink-900/20 rounded-xl flex items-center justify-between group hover:border-ink-900/40 transition-all">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 rounded-full bg-white border border-paper-200 flex items-center justify-center text-ink-300 group-hover:text-ink-900 transition-colors">
                    <History className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-ink-900 uppercase tracking-widest">从历史记录填充</p>
                    <p className="text-[10px] text-ink-400 mt-1">登录后可快速调用已保存的生辰信息</p>
                  </div>
                </div>
                {!isLoggedIn ? (
                  <button 
                    onClick={() => setIsLoggedIn(true)}
                    className="text-[10px] uppercase tracking-[0.2em] font-bold text-ink-400 hover:text-ink-900 flex items-center gap-2 transition-colors"
                  >
                    <Lock className="w-3 h-3" /> 登录解锁
                  </button>
                ) : (
                  <button className="text-[10px] uppercase tracking-[0.2em] font-bold text-ink-900">
                    选择档案
                  </button>
                )}
              </section>

              {/* Module 3: Identity & Birth Details */}
              <section className="space-y-12">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-ink-900 text-paper-50 flex items-center justify-center text-[10px] font-bold">02</div>
                  <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold text-ink-900">基本身份信息 / IDENTITY</h3>
                </div>

                <div className="space-y-12">
                  {/* Birth Details Integrated */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] uppercase tracking-[0.2em] text-ink-400 font-bold">年份 / YEAR</label>
                      <select 
                        value={birthInfo.year}
                        onChange={e => {
                          const newYear = parseInt(e.target.value);
                          setBirthInfo({
                            ...birthInfo, 
                            year: newYear,
                            isLeap: birthInfo.isLeap && isLeapMonthAvailable(newYear, birthInfo.month)
                          });
                        }}
                        className="w-full bg-transparent border-b border-paper-200 py-2 focus:outline-none focus:border-ink-900 text-sm font-light transition-all"
                      >
                        {YEARS.map(y => (
                          <option key={y.value} value={y.value}>{y.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] uppercase tracking-[0.2em] text-ink-400 font-bold">月份 / MONTH</label>
                      <select 
                        value={birthInfo.month}
                        onChange={e => {
                          const newMonth = parseInt(e.target.value);
                          setBirthInfo({
                            ...birthInfo, 
                            month: newMonth,
                            isLeap: birthInfo.isLeap && isLeapMonthAvailable(birthInfo.year, newMonth)
                          });
                        }}
                        className="w-full bg-transparent border-b border-paper-200 py-2 focus:outline-none focus:border-ink-900 text-sm font-light transition-all"
                      >
                        {Array.from({ length: 12 }, (_, i) => {
                          const m = i + 1;
                          const lunarMonths = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
                          const label = birthInfo.calendarType === 'lunar' ? `${lunarMonths[i]}月` : `${m}月`;
                          return <option key={m} value={m}>{label}</option>;
                        })}
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] uppercase tracking-[0.2em] text-ink-400 font-bold">日期 / DAY</label>
                      <select 
                        value={birthInfo.day}
                        onChange={e => setBirthInfo({...birthInfo, day: parseInt(e.target.value)})}
                        className="w-full bg-transparent border-b border-paper-200 py-2 focus:outline-none focus:border-ink-900 text-sm font-light transition-all"
                      >
                        {Array.from({ length: 31 }, (_, i) => {
                          const d = i + 1;
                          const lunarDays = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十', '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十', '卅一'];
                          const label = birthInfo.calendarType === 'lunar' ? lunarDays[i] : `${d}日`;
                          return <option key={d} value={d}>{label}</option>;
                        })}
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] uppercase tracking-[0.2em] text-ink-400 font-bold">时辰 / HOUR</label>
                      <select 
                        value={birthInfo.hour}
                        onChange={e => setBirthInfo({...birthInfo, hour: parseInt(e.target.value)})}
                        className="w-full bg-transparent border-b border-paper-200 py-2 focus:outline-none focus:border-ink-900 text-sm font-light transition-all"
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i}>{i}时</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-gold-600 font-serif italic">
                    <Info size={12} />
                    <span>{getOtherCalendarPreview()}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] uppercase tracking-[0.2em] text-ink-400 font-bold">国家 / COUNTRY</label>
                      <select 
                        value={birthInfo.country}
                        onChange={e => setBirthInfo({...birthInfo, country: e.target.value, province: '', city: ''})}
                        className="w-full bg-transparent border-b border-paper-200 py-2 focus:outline-none focus:border-ink-900 text-sm font-light transition-all"
                      >
                        <option value="">请选择国家</option>
                        {/* 将中国排在第一位，其他按中文名称排序 */}
                        {[...Country.getAllCountries()].sort((a, b) => {
                          if (a.isoCode === 'CN') return -1;
                          if (b.isoCode === 'CN') return 1;
                          return getCountryName(a.isoCode).localeCompare(getCountryName(b.isoCode), 'zh-Hans');
                        }).map(c => (
                          <option key={c.isoCode} value={c.isoCode}>{getCountryName(c.isoCode)}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] uppercase tracking-[0.2em] text-ink-400 font-bold">省份 / PROVINCE</label>
                      <select 
                        value={birthInfo.province}
                        onChange={e => setBirthInfo({...birthInfo, province: e.target.value, city: ''})}
                        className="w-full bg-transparent border-b border-paper-200 py-2 focus:outline-none focus:border-ink-900 text-sm font-light transition-all"
                        disabled={!birthInfo.country}
                      >
                        <option value="">请选择省份</option>
                        {birthInfo.country && State.getStatesOfCountry(birthInfo.country).map(p => (
                          <option key={p.isoCode} value={p.isoCode}>{getProvinceName(birthInfo.country, p.isoCode, p.name)}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] uppercase tracking-[0.2em] text-ink-400 font-bold">城市 / CITY</label>
                      <select 
                        value={birthInfo.city}
                        onChange={e => setBirthInfo({...birthInfo, city: e.target.value})}
                        className="w-full bg-transparent border-b border-paper-200 py-2 focus:outline-none focus:border-ink-900 text-sm font-light transition-all"
                        disabled={!birthInfo.province}
                      >
                        <option value="">请选择城市</option>
                        {birthInfo.country && birthInfo.province && getCitiesForSelect(birthInfo.country, birthInfo.province).map(c => (
                          <option key={c.name} value={c.name}>{getCityName(birthInfo.country, c.name)}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] uppercase tracking-[0.2em] text-ink-400 font-bold">经度 / LONGITUDE</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={birthInfo.longitude}
                        onChange={e => setBirthInfo({...birthInfo, longitude: parseFloat(e.target.value)})}
                        className="w-full bg-transparent border-b border-paper-200 py-2 focus:outline-none focus:border-ink-900 text-sm font-light transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-3">
                      <label className="text-[10px] uppercase tracking-[0.2em] text-ink-400 font-bold">姓名 / NAME</label>
                      <input 
                        type="text" 
                        placeholder="Your Name"
                        value={birthInfo.name}
                        onChange={e => setBirthInfo({...birthInfo, name: e.target.value})}
                        className="w-full bg-transparent border-b border-paper-200 py-2 focus:outline-none focus:border-ink-900 transition-all font-light"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] uppercase tracking-[0.2em] text-ink-400 font-bold">性别 / GENDER</label>
                      <div className="flex gap-4">
                        {['male', 'female'].map(g => (
                          <button
                            key={g}
                            onClick={() => setBirthInfo({...birthInfo, gender: g as any})}
                            className={cn(
                              "flex-1 py-2 text-[10px] uppercase tracking-widest border transition-all font-bold",
                              birthInfo.gender === g 
                                ? "bg-ink-900 text-paper-50 border-ink-900" 
                                : "border-paper-200 text-ink-400 hover:border-ink-300 bg-white"
                            )}
                          >
                            {g === 'male' ? '乾造 MALE' : '坤造 FEMALE'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-ink-400 font-bold">历法选择 / CALENDAR</label>
                    <div className="flex gap-4">
                      {['solar', 'lunar'].map(type => (
                        <button
                          key={type}
                          onClick={() => toggleCalendarType(type as any)}
                          className={cn(
                            "flex-1 py-2 text-[10px] uppercase tracking-widest border transition-all font-bold",
                            birthInfo.calendarType === type 
                              ? "bg-ink-900 text-paper-50 border-ink-900" 
                              : "border-paper-200 text-ink-400 hover:border-ink-300 bg-white"
                          )}
                        >
                          {type === 'solar' ? '公历 SOLAR' : '农历 LUNAR'}
                        </button>
                      ))}
                    </div>
                    {birthInfo.calendarType === 'lunar' && isLeapMonthAvailable(birthInfo.year, birthInfo.month) && (
                      <div className="flex items-center gap-2 mt-2">
                        <input 
                          type="checkbox" 
                          id="isLeap"
                          checked={birthInfo.isLeap}
                          onChange={e => setBirthInfo({...birthInfo, isLeap: e.target.checked})}
                          className="w-4 h-4 rounded border-paper-200 text-gold-600 focus:ring-gold-500"
                        />
                        <label htmlFor="isLeap" className="text-[10px] uppercase tracking-[0.2em] text-ink-400 font-bold cursor-pointer">
                          闰月 / LEAP MONTH
                        </label>
                      </div>
                    )}
                  </div>

                  {/* MBTI Selection */}
                  <div className="space-y-6 pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Fingerprint className="w-4 h-4 text-ink-400" />
                        <label className="text-[10px] uppercase tracking-[0.2em] text-ink-400 font-bold">性格倾向 / MBTI (可选)</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          id="showMbti"
                          checked={showMbti}
                          onChange={(e) => setShowMbti(e.target.checked)}
                          className="w-4 h-4 rounded border-paper-200 text-gold-600 focus:ring-gold-500"
                        />
                        <label htmlFor="showMbti" className="text-[10px] uppercase tracking-widest text-ink-400 font-bold cursor-pointer">开启 / ENABLE</label>
                      </div>
                    </div>
                    
                    {showMbti && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4 overflow-hidden"
                      >
                        {[
                          { key: 'energy', options: [{v: 'E', l: '外向 E'}, {v: 'I', l: '内向 I'}] },
                          { key: 'perception', options: [{v: 'S', l: '实感 S'}, {v: 'N', l: '直觉 N'}] },
                          { key: 'judgment', options: [{v: 'T', l: '思考 T'}, {v: 'F', l: '情感 F'}] },
                          { key: 'lifestyle', options: [{v: 'J', l: '判断 J'}, {v: 'P', l: '知觉 P'}] },
                        ].map((group) => (
                          <div key={group.key} className="flex flex-col gap-2">
                            {group.options.map(opt => (
                              <button
                                key={opt.v}
                                onClick={() => setMbti({...mbti, [group.key]: opt.v})}
                                className={cn(
                                  "py-2 text-[10px] border transition-all font-bold",
                                  (mbti as any)[group.key] === opt.v
                                    ? "bg-ink-900 text-paper-50 border-ink-900"
                                    : "border-paper-200 text-ink-400 hover:border-ink-300 bg-white"
                                )}
                              >
                                {opt.l}
                              </button>
                            ))}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </div>
                </div>
              </section>

              {/* Module 3: Identity & Birth Details */}
              <section className="pt-12 space-y-6">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={cn(
                    "w-4 h-4 border rounded flex items-center justify-center transition-all",
                    saveToHistory ? "bg-ink-900 border-ink-900" : "border-paper-300 group-hover:border-ink-900"
                  )} onClick={() => setSaveToHistory(!saveToHistory)}>
                    {saveToHistory && <CheckCircle2 className="w-3 h-3 text-paper-50" />}
                  </div>
                  <span className="text-[10px] text-ink-400 font-bold uppercase tracking-widest">将此生辰信息保存至我的档案 (SAVE TO HISTORY)</span>
                </label>

                {calcError && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                    <p className="text-[10px] text-red-600 font-bold uppercase tracking-widest mb-1">错误 / ERROR</p>
                    <p className="text-xs text-red-700">{calcError}</p>
                  </div>
                )}

                <button 
                  onClick={handleCalculate}
                  disabled={isCalculating || selectedSystems.length === 0}
                  className="w-full py-5 bg-ink-900 text-paper-50 text-[11px] uppercase tracking-[0.3em] font-bold hover:bg-ink-700 transition-all disabled:opacity-50 flex items-center justify-center gap-4 group"
                >
                  {isCalculating ? (
                    <div className="w-4 h-4 border border-paper-50/30 border-t-paper-50 rounded-full animate-spin" />
                  ) : (
                    <>
                      开启深度测算 / Start Reading
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </section>
            </motion.div>
          ) : (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-12"
            >
              {!fateData.zodiac ? (
                <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6">
                  <div className="w-12 h-12 border-2 border-gold-200 border-t-gold-500 rounded-full animate-spin" />
                  <p className="text-ink-400 text-xs uppercase tracking-widest">正在加载推演结果 / LOADING RESULTS...</p>
                </div>
              ) : (
                <>
              {/* Summary Section */}
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-white/50 backdrop-blur-sm border border-paper-200 rounded-3xl p-8 space-y-8">
                  <div className="space-y-2">
                    <p className="text-[9px] uppercase tracking-[0.3em] text-ink-400 font-bold">PROFILE</p>
                    <h2 className="text-3xl font-serif text-ink-900 leading-tight">{birthInfo.name}八字排盘</h2>
                  </div>
                  <div className="space-y-6 text-sm font-light text-ink-700">
                    <div className="flex justify-between items-center border-b border-paper-100 pb-3">
                      <span className="text-[10px] uppercase tracking-widest text-ink-400 font-bold">性别 / GENDER</span>
                      <span className="font-medium text-ink-900">{birthInfo.gender === 'male' ? '男 MALE' : '女 FEMALE'}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-paper-100 pb-3">
                      <span className="text-[10px] uppercase tracking-widest text-ink-400 font-bold">公历 / SOLAR</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-ink-900">{getSolarDateDisplay(birthInfo.year, birthInfo.month, birthInfo.day, birthInfo.calendarType, birthInfo.isLeap)} {birthInfo.hour}:{birthInfo.minute}</span>
                        <button className="text-[10px] text-gold-600 hover:text-gold-700">编辑</button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center border-b border-paper-100 pb-3">
                      <span className="text-[10px] uppercase tracking-widest text-ink-400 font-bold">农历 / LUNAR</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-ink-900">{getLunarDateDisplay(birthInfo.year, birthInfo.month, birthInfo.day, birthInfo.calendarType, birthInfo.isLeap)}</span>
                        <button className="text-[10px] text-gold-600 hover:text-gold-700">编辑</button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center border-b border-paper-100 pb-3">
                      <span className="text-[10px] uppercase tracking-widest text-ink-400 font-bold">出生地点 / LOCATION</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-ink-900 uppercase">
                          {getCountryName(birthInfo.country)} {getProvinceName(birthInfo.country, birthInfo.province, birthInfo.province)} {getCityName(birthInfo.country, birthInfo.city)}
                        </span>
                        <button className="text-[10px] text-gold-600 hover:text-gold-700">编辑</button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center border-b border-paper-100 pb-3">
                      <span className="text-[10px] uppercase tracking-widest text-ink-400 font-bold">生肖属相 / ZODIAC</span>
                      <span className="font-medium text-ink-900">{fateData.zodiac}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-paper-100 pb-3">
                      <span className="text-[10px] uppercase tracking-widest text-ink-400 font-bold">西洋星座 / WESTERN</span>
                      <span className="font-medium text-ink-900">{fateData.westernZodiac}座</span>
                    </div>
                    {fateData.mbti && (
                      <div className="flex justify-between items-center border-b border-paper-100 pb-3">
                        <span className="text-[10px] uppercase tracking-widest text-ink-400 font-bold">性格倾向 / MBTI</span>
                        <span className="font-medium text-ink-900">{fateData.mbti.energy}{fateData.mbti.perception}{fateData.mbti.judgment}{fateData.mbti.lifestyle}</span>
                      </div>
                    )}
                    {fateData.bazi && (
                      <div className="flex justify-between items-center border-b border-paper-100 pb-3">
                        <span className="text-[10px] uppercase tracking-widest text-ink-400 font-bold">日主强弱 / STRENGTH</span>
                        <span className={cn(
                          "font-bold px-3 py-1 rounded-full text-[10px]",
                          fateData.bazi.dayMaster.strength.includes('强') ? "bg-red-50 text-red-600" :
                          fateData.bazi.dayMaster.strength.includes('弱') ? "bg-blue-50 text-blue-600" :
                          "bg-paper-100 text-ink-600"
                        )}>
                          {fateData.bazi.dayMaster.strength}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-2 bg-white/50 backdrop-blur-sm border border-paper-200 rounded-3xl p-12 flex flex-col justify-center">
                  <div className="flex justify-between items-end mb-12">
                    <p className="text-[9px] uppercase tracking-[0.3em] text-ink-400 font-bold">ENERGY BALANCE</p>
                    <p className="text-[8px] text-gold-600/60 italic">基于八字原局数量统计 / Simple 8-Character Count</p>
                  </div>
                  <div className="grid grid-cols-5 gap-8">
                    {fateData.bazi ? Object.entries(fateData.bazi.fiveElements).map(([el, data]: [any, any]) => (
                      <div key={el} className="space-y-6 group cursor-pointer flex flex-col items-center">
                        <div className="relative w-3 h-64 bg-paper-50/30 rounded-full overflow-hidden border border-paper-100 transition-all group-hover:border-gold-300">
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: `${data.percentage}%` }}
                            className={cn(
                              "absolute bottom-0 left-0 right-0 transition-all duration-1000",
                              el === '木' ? 'bg-[#A7F3D0]' :
                              el === '火' ? 'bg-[#FECACA]' :
                              el === '土' ? 'bg-[#FDE68A]' :
                              el === '金' ? 'bg-[#E5E7EB]' :
                              'bg-[#BFDBFE]'
                            )}
                          />
                        </div>
                        <div className="text-center space-y-1">
                          <p className="text-[10px] font-serif italic text-ink-400">{data.count}/8 ({data.percentage}%)</p>
                          <p className="text-sm font-serif text-ink-900 group-hover:text-gold-600 transition-colors">{el}</p>
                        </div>
                      </div>
                    )) : (
                      <div className="col-span-5 flex items-center justify-center h-64 text-ink-400 text-[10px] uppercase tracking-widest">
                        未选择八字分析 / BAZI NOT SELECTED
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Chart Section */}
              <section className="bg-white/50 backdrop-blur-sm border border-paper-200 rounded-3xl p-8">
                <div className="flex flex-wrap gap-8 border-b border-paper-200 pb-4 text-[10px] uppercase tracking-[0.2em] font-semibold text-ink-500">
                  {selectedSystems.map(id => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id)}
                      className={cn(
                        "transition-all hover:text-ink-900 relative py-2 active:scale-95",
                        activeTab === id && "text-ink-900"
                      )}
                    >
                      {SYSTEMS.find(s => s.id === id)?.label || id}
                      {activeTab === id && (
                        <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-500" />
                      )}
                    </button>
                  ))}
                  {isLoggedIn && (
                    <button
                      onClick={() => setActiveTab('history')}
                      className={cn(
                        "transition-all hover:text-ink-900 relative py-2 active:scale-95",
                        activeTab === 'history' && "text-ink-900"
                      )}
                    >
                      历史记录 / HISTORY
                      {activeTab === 'history' && (
                        <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-500" />
                      )}
                    </button>
                  )}
                </div>

                <div className="mt-12">
                  {activeTab === 'bazi' && fateData.bazi && (
                    <div className="space-y-12">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[
                          { label: '阳历 / SOLAR', value: getSolarDateDisplay(birthInfo.year, birthInfo.month, birthInfo.day, birthInfo.calendarType, birthInfo.isLeap) },
                          { label: '农历 / LUNAR', value: getLunarDateDisplay(birthInfo.year, birthInfo.month, birthInfo.day, birthInfo.calendarType, birthInfo.isLeap) },
                          { label: '生肖星座 / ZODIAC', value: fateData.zodiac + ' / ' + fateData.westernZodiac + '座' },
                          { label: '胎元 / TAI YUAN', value: fateData.bazi.taiYuan },
                          { label: '命宫 / MING GONG', value: fateData.bazi.mingGong },
                          { label: '身宫 / SHEN GONG', value: fateData.bazi.shenGong },
                        ].map((item, i) => (
                          <div key={i} className="bg-white border border-paper-200 rounded-2xl p-4 space-y-1">
                            <p className="text-[9px] text-ink-400 uppercase tracking-widest font-bold">{item.label}</p>
                            <p className="text-sm font-medium text-ink-800">{item.value}</p>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-8">
                        <div className="flex items-center justify-between">
                          <h3 className="text-[9px] font-bold text-ink-400 uppercase tracking-[0.2em]">BAZI CHART</h3>
                        </div>
                        <div className="h-[1px] w-full bg-paper-100" />
                        
                        {/* BaZi Table (Desktop) */}
                        <div className="hidden md:block overflow-x-auto rounded-xl border border-paper-200">
                          <table className="w-full border-collapse text-center text-sm">
                            <thead>
                              <tr className="bg-paper-50 border-b border-paper-200">
                                <th className="p-3 text-[10px] font-bold text-ink-400 uppercase tracking-widest">项目</th>
                                <th className="p-3 text-[10px] font-bold text-ink-400 uppercase tracking-widest">年柱</th>
                                <th className="p-3 text-[10px] font-bold text-ink-400 uppercase tracking-widest">月柱</th>
                                <th className="p-3 text-[10px] font-bold text-ink-400 uppercase tracking-widest">日柱</th>
                                <th className="p-3 text-[10px] font-bold text-ink-400 uppercase tracking-widest">时柱</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b border-paper-100">
                                <td className="p-3 text-[10px] text-ink-400 font-bold">天干</td>
                                <td className={cn("p-3 text-2xl font-serif", getElementColor(fateData.bazi.pillars.year.gan))}>{fateData.bazi.pillars.year.gan}</td>
                                <td className={cn("p-3 text-2xl font-serif", getElementColor(fateData.bazi.pillars.month.gan))}>{fateData.bazi.pillars.month.gan}</td>
                                <td className={cn("p-3 text-2xl font-serif", getElementColor(fateData.bazi.pillars.day.gan))}>{fateData.bazi.pillars.day.gan}</td>
                                <td className={cn("p-3 text-2xl font-serif", getElementColor(fateData.bazi.pillars.hour.gan))}>{fateData.bazi.pillars.hour.gan}</td>
                              </tr>
                              <tr className="border-b border-paper-100">
                                <td className="p-3 text-[10px] text-ink-400 font-bold">地支</td>
                                <td className={cn("p-3 text-2xl font-serif", getElementColor(fateData.bazi.pillars.year.zhi))}>{fateData.bazi.pillars.year.zhi}</td>
                                <td className={cn("p-3 text-2xl font-serif", getElementColor(fateData.bazi.pillars.month.zhi))}>{fateData.bazi.pillars.month.zhi}</td>
                                <td className={cn("p-3 text-2xl font-serif", getElementColor(fateData.bazi.pillars.day.zhi))}>{fateData.bazi.pillars.day.zhi}</td>
                                <td className={cn("p-3 text-2xl font-serif", getElementColor(fateData.bazi.pillars.hour.zhi))}>{fateData.bazi.pillars.hour.zhi}</td>
                              </tr>
                              <tr className="border-b border-paper-100">
                                <td className="p-3 text-[10px] text-ink-400 font-bold">十神</td>
                                <td className="p-3 text-xs text-ink-600">{fateData.bazi.pillars.year.tenGod}</td>
                                <td className="p-3 text-xs text-ink-600">{fateData.bazi.pillars.month.tenGod}</td>
                                <td className="p-3 text-xs text-ink-600">{fateData.bazi.pillars.day.tenGod}</td>
                                <td className="p-3 text-xs text-ink-600">{fateData.bazi.pillars.hour.tenGod}</td>
                              </tr>
                              <tr>
                                <td className="p-3 text-[10px] text-ink-400 font-bold">纳音</td>
                                <td className="p-3 text-xs text-ink-600">{fateData.bazi.pillars.year.naYin}</td>
                                <td className="p-3 text-xs text-ink-600">{fateData.bazi.pillars.month.naYin}</td>
                                <td className="p-3 text-xs text-ink-600">{fateData.bazi.pillars.day.naYin}</td>
                                <td className="p-3 text-xs text-ink-600">{fateData.bazi.pillars.hour.naYin}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* BaZi Grid (Mobile) */}
                        <div className="md:hidden grid grid-cols-2 gap-3">
                          {[
                            { title: '年柱', pillar: fateData.bazi.pillars.year },
                            { title: '月柱', pillar: fateData.bazi.pillars.month },
                            { title: '日柱', pillar: fateData.bazi.pillars.day },
                            { title: '时柱', pillar: fateData.bazi.pillars.hour },
                          ].map((item, i) => (
                            <div key={i} className="bg-white border border-paper-200 rounded-xl p-3 flex flex-col items-center gap-2">
                              <div className="text-[10px] font-bold text-ink-400 uppercase tracking-widest border-b border-paper-100 w-full text-center pb-1">{item.title}</div>
                              <div className="flex gap-4">
                                <div className="text-center">
                                  <p className="text-[9px] text-ink-400">天干</p>
                                  <p className={cn("text-xl font-serif", getElementColor(item.pillar.gan))}>{item.pillar.gan}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-[9px] text-ink-400">地支</p>
                                  <p className={cn("text-xl font-serif", getElementColor(item.pillar.zhi))}>{item.pillar.zhi}</p>
                                </div>
                              </div>
                              <div className="text-[9px] text-ink-500 w-full text-center border-t border-paper-100 pt-1">{item.pillar.tenGod} · {item.pillar.naYin}</div>
                            </div>
                          ))}
                        </div>

                      {/* BaZi Relations Section */}
                      {fateData.bazi.relations && fateData.bazi.relations.length > 0 && (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <h3 className="text-[9px] font-bold text-ink-400 uppercase tracking-[0.2em]">RELATIONS / 冲刑合会</h3>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {fateData.bazi.relations.map((rel, i) => (
                              <div key={i} className="bg-white border border-paper-200 rounded-xl p-4 space-y-2 hover:border-gold-300 transition-colors">
                                <p className="text-[10px] text-ink-400 font-bold uppercase tracking-widest">{rel.type}</p>
                                <p className="text-sm font-serif text-ink-900">{rel.description}</p>
                                <div className="flex gap-1">
                                  {rel.elements.map((el, j) => (
                                    <span key={j} className={cn("text-xs font-bold", getElementColor(el))}>{el}</span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Da Yun Section */}
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-[9px] font-bold text-ink-400 uppercase tracking-[0.2em]">GREAT LUCK / 大运</h3>
                          <p className="text-[10px] text-ink-500">起运时间：{fateData.bazi.daYun.startYear}年 ({fateData.bazi.daYun.startAge}岁)</p>
                        </div>
                        <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                          {fateData.bazi.daYun.pillars.map((d, i) => (
                            <div key={i} className="bg-white border border-paper-200 rounded-xl p-3 text-center space-y-2">
                              <p className="text-[10px] text-ink-400 font-bold">{d.age}岁</p>
                              <p className={cn("text-xl font-serif", getElementColor(d.pillar[0]))}>{d.pillar}</p>
                              <p className="text-[9px] text-ink-500">{d.year}年</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-8">
                      {/* Day Master Section */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white border border-paper-200 rounded-2xl p-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-5 h-5 text-emerald-500" />
                              <h4 className="font-serif text-lg">日主</h4>
                            </div>
                            <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-medium">{fateData.bazi.dayMaster.element}</span>
                          </div>
                          <p className="text-sm text-ink-600 leading-relaxed">{fateData.bazi.dayMaster.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                  {activeTab === 'ziwei' && fateData.ziwei && (
                    <div className="space-y-8">
                       <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[
                          { label: '计算阳历 / CALC SOLAR', value: fateData.ziwei.solarDate },
                          { label: '计算农历 / CALC LUNAR', value: fateData.ziwei.lunarDate },
                          { label: '时辰 / HOUR', value: birthInfo.hour + '时' },
                          { label: '命主 / LORD', value: fateData.ziwei.lifeMaster || '未知' },
                          { label: '身主 / BODY', value: fateData.ziwei.bodyMaster || '未知' },
                          { label: '生肖星座 / ZODIAC', value: fateData.zodiac + ' / ' + fateData.westernZodiac + '座' },
                        ].map((item, i) => (
                          <div key={i} className="bg-white border border-paper-200 rounded-2xl p-4 space-y-1">
                            <p className="text-[9px] text-ink-400 uppercase tracking-widest font-bold">{item.label}</p>
                            <p className="text-sm font-medium text-ink-800">{item.value}</p>
                          </div>
                        ))}
                      </div>

                      <div className="bg-white border border-paper-200 rounded-3xl p-4 aspect-square max-w-2xl mx-auto relative overflow-hidden shadow-inner">
                        <div className="grid grid-cols-4 grid-rows-4 h-full gap-1 relative z-10">
                          {/* Standard Ziwei Grid Layout (Clockwise from Bottom-Left) */}
                            {[
                              { idx: 3, pos: 'col-start-1 row-start-1' }, { idx: 4, pos: 'col-start-2 row-start-1' }, { idx: 5, pos: 'col-start-3 row-start-1' }, { idx: 6, pos: 'col-start-4 row-start-1' },
                              { idx: 2, pos: 'col-start-1 row-start-2' }, { idx: 7, pos: 'col-start-4 row-start-2' },
                              { idx: 1, pos: 'col-start-1 row-start-3' }, { idx: 8, pos: 'col-start-4 row-start-3' },
                              { idx: 0, pos: 'col-start-1 row-start-4' }, { idx: 11, pos: 'col-start-2 row-start-4' }, { idx: 10, pos: 'col-start-3 row-start-4' }, { idx: 9, pos: 'col-start-4 row-start-4' },
                            ].map((p) => {
                              const palace = fateData.ziwei.palaces[p.idx];
                              const isSelected = selectedPalace === p.idx;
                              const isSanFang = selectedPalace !== null && fateData.ziwei.palaces[selectedPalace].sanFang.includes(palace.name);
                              const isSiZheng = selectedPalace !== null && fateData.ziwei.palaces[selectedPalace].siZheng === palace.name;

                              return (
                                <div 
                                  key={p.idx} 
                                  onClick={() => setSelectedPalace(isSelected ? null : p.idx)}
                                  className={cn(
                                    "border rounded p-0.5 flex flex-col justify-between transition-all cursor-pointer group relative overflow-hidden bg-white/50 backdrop-blur-sm",
                                    isSelected ? "border-gold-500 bg-gold-50 shadow-lg z-10 scale-105" : 
                                    isSanFang ? "border-emerald-300 bg-emerald-50/30" :
                                    isSiZheng ? "border-blue-300 bg-blue-50/30" :
                                    "border-paper-100 hover:border-gold-300 hover:bg-gold-50/10",
                                    p.pos
                                  )}
                                >
                                  {/* Palace Header */}
                                  <div className="flex justify-between items-start z-10">
                                    <div className="flex items-center gap-0.5 leading-none">
                                      <span className="text-[8px] font-bold text-ink-900">{palace.gan}</span>
                                      <span className="text-[8px] font-bold text-ink-900">{palace.zhi}</span>
                                    </div>
                                    <span className={cn(
                                      "text-[8px] font-bold transition-colors px-0.5 rounded leading-none",
                                      isSelected ? "bg-gold-600 text-white" : "text-gold-600 group-hover:text-gold-700"
                                    )}>{palace.name}</span>
                                  </div>

                                <div className="flex-1 flex justify-between gap-0.5 py-0.5 min-h-0 relative z-10">
                                  {/* Left: Minor Stars */}
                                  <div className="flex flex-row-reverse items-start gap-0.5 overflow-hidden">
                                    {palace.minorStars.map((star, sIdx) => (
                                      <div key={sIdx} className="flex flex-col items-center">
                                        <span 
                                          className="text-[8px] text-blue-600 font-medium leading-tight text-center"
                                          style={{ writingMode: 'vertical-rl' }}
                                        >
                                          {star.name}
                                        </span>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Right: Major Stars */}
                                  <div className="flex flex-row-reverse items-start gap-0.5 overflow-hidden">
                                    {palace.majorStars.map((star, sIdx) => (
                                      <div key={sIdx} className="flex flex-col items-center">
                                        <span 
                                          className={cn(
                                            "text-[10px] font-serif font-bold leading-tight text-center tracking-tighter",
                                            ['紫微', '天府', '武曲', '天相', '太阳', '太阴'].includes(star.name) ? 'text-red-600' : 'text-ink-900'
                                          )}
                                          style={{ writingMode: 'vertical-rl' }}
                                        >
                                          {star.name}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                  {/* Palace Footer */}
                                  <div className="flex justify-between items-end z-10">
                                    <div className="flex gap-0.5">
                                      {palace.yearlyStars.length > 0 && <span className="text-[6px] text-emerald-700 font-bold bg-emerald-50 px-0.5 rounded leading-none">流</span>}
                                      {palace.decadalStars.length > 0 && <span className="text-[6px] text-blue-700 font-bold bg-blue-50 px-0.5 rounded leading-none">大</span>}
                                    </div>
                                    <span className="text-[7px] text-ink-200 font-mono italic leading-none">
                                      {palace.gan}{palace.zhi}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          <div className="col-span-2 row-span-2 col-start-2 row-start-2 border border-paper-100 rounded-xl p-1 flex flex-col items-center justify-center text-center space-y-0.5">
                            <p className="text-[8px] text-ink-400 uppercase tracking-widest">基本</p>
                            <div className="text-[7px] leading-tight text-ink-600">
                              {fateData.ziwei.lifeMaster} / {fateData.ziwei.bodyMaster}
                            </div>
                          </div>
                          
                          {/* SVG Overlay for San Fang Si Zheng Lines */}
                          <div className="absolute inset-0 pointer-events-none z-0 p-4">
                            <svg className="w-full h-full" viewBox="0 0 100 100">
                              {selectedPalace !== null && (() => {
                                const coords: Record<number, [number, number]> = {
                                  0: [0, 3], 1: [0, 2], 2: [0, 1], 3: [0, 0],
                                  4: [1, 0], 5: [2, 0], 6: [3, 0], 7: [3, 1],
                                  8: [3, 2], 9: [3, 3], 10: [2, 3], 11: [1, 3]
                                };
                                const getEdgePoint = (idx: number) => {
                                  const [c, r] = coords[idx];
                                  let x = (c + 0.5) * 25;
                                  let y = (r + 0.5) * 25;
                                  
                                  // Constrain to inner edges of the 4x4 grid (the 2x2 center boundary)
                                  if (c === 0) x = 25;
                                  if (c === 3) x = 75;
                                  if (r === 0) y = 25;
                                  if (r === 3) y = 75;
                                  
                                  return [x, y];
                                };
                                const center = getEdgePoint(selectedPalace);
                                const sanFang1 = getEdgePoint((selectedPalace + 4) % 12);
                                const sanFang2 = getEdgePoint((selectedPalace + 8) % 12);
                                const siZheng = getEdgePoint((selectedPalace + 6) % 12);

                                return (
                                  <>
                                    {/* San Fang Lines (Triple Harmony) - Contained in center */}
                                    <motion.path 
                                      initial={{ pathLength: 0, opacity: 0 }}
                                      animate={{ pathLength: 1, opacity: 1 }}
                                      d={`M ${center[0]} ${center[1]} L ${sanFang1[0]} ${sanFang1[1]} L ${sanFang2[0]} ${sanFang2[1]} Z`}
                                      fill="rgba(16, 185, 129, 0.05)"
                                      stroke="rgba(16, 185, 129, 0.4)" 
                                      strokeWidth="0.5" 
                                      strokeDasharray="2 2"
                                    />
                                    {/* Si Zheng Line (Opposition) - Contained in center */}
                                    <motion.line 
                                      initial={{ pathLength: 0, opacity: 0 }}
                                      animate={{ pathLength: 1, opacity: 1 }}
                                      x1={center[0]} y1={center[1]} x2={siZheng[0]} y2={siZheng[1]} 
                                      stroke="rgba(59, 130, 246, 0.5)" 
                                      strokeWidth="0.8" 
                                      strokeDasharray="4 2"
                                    />
                                    {/* Connection Points at Borders */}
                                    {[center, sanFang1, sanFang2, siZheng].map((pt, i) => (
                                      <g key={i}>
                                        <circle cx={pt[0]} cy={pt[1]} r="1.2" fill={i === 0 ? "#EAB308" : i === 3 ? "#3B82F6" : "#10B981"} opacity="0.2" />
                                        <circle cx={pt[0]} cy={pt[1]} r="0.6" fill={i === 0 ? "#EAB308" : i === 3 ? "#3B82F6" : "#10B981"} />
                                      </g>
                                    ))}
                                  </>
                                );
                              })()}
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Palace Detail Section */}
                      {selectedPalace !== null && (
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white border border-paper-200 rounded-3xl p-8 space-y-8"
                        >
                          <div className="flex items-center justify-between border-b border-paper-100 pb-6">
                            <div className="space-y-1">
                              <h4 className="text-2xl font-serif text-ink-900">{fateData.ziwei.palaces[selectedPalace].name}宫 详情</h4>
                              <p className="text-[10px] text-ink-400 uppercase tracking-widest font-bold">Palace Details & San Fang Si Zheng</p>
                            </div>
                            <button 
                              onClick={() => setSelectedPalace(null)}
                              className="text-[10px] uppercase tracking-widest text-ink-400 hover:text-ink-900 transition-colors font-bold"
                            >
                              关闭 / CLOSE
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-6">
                              <h5 className="text-[11px] font-bold text-ink-400 uppercase tracking-[0.2em]">主星与辅星 / MAJOR & MINOR STARS</h5>
                              <div className="space-y-4">
                                {fateData.ziwei.palaces[selectedPalace].majorStars.map((s, i) => (
                                  <div key={i} className="flex items-center justify-between p-3 bg-red-50/30 rounded-xl border border-red-100/50">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-bold text-red-700">{s.name}</span>
                                      {s.transformation && <span className="px-1.5 py-0.5 bg-gold-500 text-white text-[8px] font-bold rounded">{s.transformation}</span>}
                                    </div>
                                    <span className="text-[10px] text-red-600/70 font-bold">{s.brightness}</span>
                                  </div>
                                ))}
                                {fateData.ziwei.palaces[selectedPalace].minorStars.map((s, i) => (
                                  <div key={i} className="flex items-center justify-between p-3 bg-paper-50 rounded-xl border border-paper-100">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium text-ink-800">{s.name}</span>
                                      {s.transformation && <span className="px-1.5 py-0.5 bg-gold-500 text-white text-[8px] font-bold rounded">{s.transformation}</span>}
                                    </div>
                                    <span className="text-[10px] text-ink-400 font-bold">{s.brightness}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-6">
                              <h5 className="text-[11px] font-bold text-ink-400 uppercase tracking-[0.2em]">杂曜与神煞 / ADJECTIVE & STATUS STARS</h5>
                              <div className="space-y-4">
                                <div className="flex flex-wrap gap-2">
                                  {fateData.ziwei.palaces[selectedPalace].adjectiveStars.map((s, i) => (
                                    <span key={i} className="px-2 py-1 bg-paper-50 text-ink-600 text-[10px] rounded border border-paper-100">{s}</span>
                                  ))}
                                  {fateData.ziwei.palaces[selectedPalace].statusStars.map((s, i) => (
                                    <span key={i} className="px-2 py-1 bg-gold-50/30 text-gold-700 text-[10px] rounded border border-gold-100/50">{s}</span>
                                  ))}
                                </div>
                                <div className="space-y-2">
                                  <p className="text-[9px] text-ink-400 uppercase tracking-widest font-bold">流年/流月/流日/流时星曜</p>
                                  <div className="flex flex-wrap gap-2">
                                    {fateData.ziwei.palaces[selectedPalace].yearlyStars.map((s, i) => (
                                      <span key={i} className="px-2 py-1 bg-blue-50/30 text-blue-600 text-[10px] rounded border border-blue-100/50">{s}</span>
                                    ))}
                                    {fateData.ziwei.palaces[selectedPalace].monthlyStars.map((s, i) => (
                                      <span key={i} className="px-2 py-1 bg-emerald-50/30 text-emerald-600 text-[10px] rounded border border-emerald-100/50">{s}</span>
                                    ))}
                                    {fateData.ziwei.palaces[selectedPalace].dailyStars.map((s, i) => (
                                      <span key={i} className="px-2 py-1 bg-purple-50/30 text-purple-600 text-[10px] rounded border border-purple-100/50">{s}</span>
                                    ))}
                                    {fateData.ziwei.palaces[selectedPalace].hourlyStars.map((s, i) => (
                                      <span key={i} className="px-2 py-1 bg-amber-50/30 text-amber-600 text-[10px] rounded border border-amber-100/50">{s}</span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-6">
                              <h5 className="text-[11px] font-bold text-ink-400 uppercase tracking-[0.2em]">三方四正 / SAN FANG SI ZHENG</h5>
                              <div className="space-y-4">
                                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                                  <p className="text-[9px] text-emerald-600 uppercase tracking-widest font-bold mb-2">三合宫位 (SAN FANG)</p>
                                  <div className="flex gap-4">
                                    {fateData.ziwei.palaces[selectedPalace].sanFang.map((name, i) => (
                                      <span key={i} className="text-sm font-bold text-emerald-700">{name}宫</span>
                                    ))}
                                  </div>
                                </div>
                                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                                  <p className="text-[9px] text-blue-600 uppercase tracking-widest font-bold mb-2">对冲宫位 (SI ZHENG)</p>
                                  <span className="text-sm font-bold text-blue-700">{fateData.ziwei.palaces[selectedPalace].siZheng}宫</span>
                                </div>
                                <p className="text-[10px] text-ink-400 leading-relaxed italic">
                                  三合派注重“三方四正”的星曜组合，通过观察对宫及合宫的星曜强弱与化星，来综合判断本宫的吉凶祸福。
                                </p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {activeTab === 'western' && fateData.western && (
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white border border-paper-200 rounded-3xl p-8 space-y-6">
                          <div className="flex items-center gap-3">
                            <Star className="w-6 h-6 text-gold-500" />
                            <h4 className="text-xl font-serif">核心相位 / MAJOR ASPECTS</h4>
                          </div>
                          <div className="space-y-4">
                            {fateData.western.aspects.map((aspect: any, i: number) => (
                              <div key={i} className="p-4 bg-paper-50 rounded-2xl space-y-1">
                                <p className="text-sm font-bold text-ink-900">{aspect.name}</p>
                                <p className="text-xs text-ink-500">{aspect.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="bg-white border border-paper-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4">
                          <div className="w-24 h-24 rounded-full bg-gold-50 flex items-center justify-center">
                            <Sun className="w-12 h-12 text-gold-500" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] uppercase tracking-widest text-ink-400 font-bold">太阳星座 / SUN SIGN</p>
                            <p className="text-3xl font-serif text-ink-900">{fateData.western.sunSign}座</p>
                          </div>
                          <p className="text-xs text-ink-500 max-w-xs">
                            太阳星座代表了您的核心自我、意志力以及生命力的源泉。
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'mbti' && fateData.mbti && (
                    <div className="space-y-8">
                      <div className="bg-white border border-paper-200 rounded-3xl p-12 space-y-12">
                        <div className="text-center space-y-4">
                          <div className="inline-flex items-center gap-2 px-4 py-1 bg-ink-900 text-paper-50 rounded-full text-[10px] uppercase tracking-widest font-bold">
                            Personality Profile
                          </div>
                          <h3 className="text-5xl font-serif">{fateData.mbti.energy}{fateData.mbti.perception}{fateData.mbti.judgment}{fateData.mbti.lifestyle}</h3>
                          <p className="text-ink-500 font-light italic">
                            {fateData.mbti.energy === 'E' ? '外向' : '内向'} · 
                            {fateData.mbti.perception === 'S' ? '实感' : '直觉'} · 
                            {fateData.mbti.judgment === 'T' ? '思考' : '情感'} · 
                            {fateData.mbti.lifestyle === 'J' ? '判断' : '知觉'}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                          <div className="space-y-6">
                            <h4 className="text-[11px] font-bold text-ink-400 uppercase tracking-[0.2em]">性格优势 / STRENGTHS</h4>
                            <ul className="space-y-3">
                              {[
                                fateData.mbti.perception === 'N' ? '富有远见，善于发现潜在可能性' : '脚踏实地，关注细节与现实',
                                fateData.mbti.judgment === 'F' ? '极具同理心，善于维护和谐关系' : '逻辑严密，决策果断客观',
                                fateData.mbti.energy === 'E' ? '充满活力，善于在社交中获取能量' : '深思熟虑，享受独处的宁静'
                              ].map((s, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-ink-700">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                                  {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="space-y-6">
                            <h4 className="text-[11px] font-bold text-ink-400 uppercase tracking-[0.2em]">成长建议 / GROWTH</h4>
                            <div className="p-6 bg-paper-50 rounded-2xl border border-paper-100">
                              <p className="text-sm text-ink-600 leading-relaxed font-light">
                                作为 {fateData.mbti.energy}{fateData.mbti.perception}{fateData.mbti.judgment}{fateData.mbti.lifestyle} 型人格，您在
                                {fateData.mbti.lifestyle === 'P' ? ' 灵活性与适应力 ' : ' 组织性与计划性 '} 方面表现卓越。
                                建议在日常生活中尝试平衡您的 {fateData.mbti.judgment === 'T' ? ' 情感表达 ' : ' 逻辑分析 '}，这将使您的决策更加全面。
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'history' && (
                    <div className="space-y-8">
                      <div className="bg-white border border-paper-200 rounded-3xl p-8 space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <History className="w-6 h-6 text-gold-500" />
                            <h4 className="text-xl font-serif">推演历史 / RECENT HISTORY</h4>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {history.length > 0 ? history.map((record, i) => (
                            <button 
                              key={i}
                              onClick={() => {
                                setBirthInfo(record.birthInfo);
                                setFateData(record.fateData);
                                setStep('dashboard');
                                setSelectedPalace(null);
                              }}
                              className="flex items-center justify-between p-4 bg-paper-50 rounded-2xl hover:bg-paper-100 transition-all text-left group"
                            >
                              <div className="space-y-1">
                                <p className="text-sm font-bold text-ink-900 group-hover:text-gold-600 transition-colors">{record.name}</p>
                                <p className="text-[10px] text-ink-400">
                                  {record.birthInfo.year}年{record.birthInfo.month}月{record.birthInfo.day}日
                                </p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-ink-300 group-hover:text-gold-500 transition-colors" />
                            </button>
                          )) : (
                            <div className="col-span-full py-12 text-center space-y-2">
                              <History className="w-12 h-12 text-paper-200 mx-auto" />
                              <p className="text-sm text-ink-400">暂无历史记录</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* AI Master Section */}
              <section className="bg-white/50 backdrop-blur-sm border border-paper-200 rounded-3xl p-16 text-center space-y-12 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-300 to-transparent opacity-50" />
                
                <div className="flex items-center justify-center gap-6">
                  <div className="h-[1px] w-16 bg-paper-200" />
                  <div className="flex items-center gap-3 text-ink-900">
                    <Sparkles className="w-5 h-5 text-gold-500" />
                    <h3 className="text-[11px] font-bold text-ink-400 uppercase tracking-[0.3em]">AI 大师深度解读 / AI MASTER INTERPRETATION</h3>
                    <Sparkles className="w-5 h-5 text-gold-500" />
                  </div>
                  <div className="h-[1px] w-16 bg-paper-200" />
                </div>

                <div className="max-w-md mx-auto space-y-4">
                  <p className="text-ink-600 font-light leading-relaxed">
                    跨体系排盘有点复杂？让AI大师为您深度解读吧～<br/>
                    还可与AI大师就命运分析深度畅聊！
                  </p>
                </div>

                <div className="flex flex-col items-center gap-6">
                  <div className="w-full max-w-md space-y-4">
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={unlockAiInterpretation}
                      disabled={isUnlockingAi || points < (aiDepth === 'deep' ? 50 : 10)}
                      className="w-full group relative bg-violet-800 hover:bg-violet-900 text-white px-12 py-4 rounded-full font-semibold tracking-wide transition-all shadow-lg shadow-violet-800/30 flex items-center justify-center gap-3 overflow-hidden"
                    >
                      {isUnlockingAi ? (
                        <div className="relative flex items-center gap-3 z-20">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span className="font-semibold tracking-wide">正在深度测算中... {Math.round(aiProgress)}%</span>
                        </div>
                      ) : (
                        <div className="relative flex items-center gap-3 z-20">
                          <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
                          <span className="text-white font-semibold tracking-wide">立马开启测算 ({aiDepth === 'deep' ? '50' : '10'}积分)</span>
                        </div>
                      )}
                      
                      {/* Progress Bar Background */}
                      {isUnlockingAi && (
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${aiProgress}%` }}
                          className="absolute inset-0 bg-violet-900/50 z-0"
                        />
                      )}
                    </motion.button>

                    {isUnlockingAi && (
                      <div className="space-y-2">
                        <div className="h-1 w-full bg-paper-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${aiProgress}%` }}
                            className="h-full bg-violet-800"
                          />
                        </div>
                        <p className="text-[10px] text-ink-400 italic">AI大师正在观星盘、查典籍，请稍候...</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 p-1 bg-paper-100 rounded-full">
                    <button 
                      onClick={() => setAiDepth('quick')}
                      className={cn(
                        "px-6 py-2 rounded-full text-xs font-medium flex items-center gap-2 transition-all",
                        aiDepth === 'quick' ? "bg-white shadow-sm text-ink-900" : "text-ink-400"
                      )}
                    >
                      <Sparkles className={cn("w-3 h-3", aiDepth === 'quick' ? "text-gold-500" : "text-ink-300")} />
                      快速测算
                    </button>
                    <button 
                      onClick={() => setAiDepth('deep')}
                      className={cn(
                        "px-6 py-2 rounded-full text-xs font-medium flex items-center gap-2 transition-all",
                        aiDepth === 'deep' ? "bg-white shadow-sm text-ink-900" : "text-ink-400"
                      )}
                    >
                      <Clock className={cn("w-3 h-3", aiDepth === 'deep' ? "text-gold-500" : "text-ink-300")} />
                      深度测算
                    </button>
                  </div>

                  <p className="text-[10px] text-ink-400">预计约 {aiDepth === 'deep' ? '120' : '40'} 秒完成，解读失败不扣积分。</p>

                  <button 
                    onClick={() => setStep('input')}
                    className="flex items-center gap-2 text-ink-400 hover:text-ink-900 transition-colors text-sm"
                  >
                    <History className="w-4 h-4" />
                    重新测算
                  </button>
                </div>
              </section>

              {/* AI Report Display */}
              {aiReport && (
                <motion.section 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-paper-200 rounded-3xl p-12 space-y-8"
                >
                  <div className="flex justify-between items-center border-b border-paper-100 pb-6">
                    <div className="flex items-center gap-3">
                      <BrainCircuit className="w-6 h-6 text-gold-500" />
                      <h3 className="text-[11px] font-bold text-ink-400 uppercase tracking-[0.2em]">大师解读报告 / MASTER REPORT</h3>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => {
                          const element = document.createElement('a');
                          const file = new Blob([aiReport], {type: 'text/plain'});
                          element.href = URL.createObjectURL(file);
                          element.download = `${birthInfo.name}_命理报告.txt`;
                          document.body.appendChild(element);
                          element.click();
                        }}
                        className="p-2 rounded-full hover:bg-paper-50 text-ink-400 transition-colors"
                      >
                        <Download size={20} />
                      </button>
                      <button 
                        onClick={async () => {
                          if (navigator.share) {
                            try {
                              await navigator.share({
                                title: `${birthInfo.name}的命理报告`,
                                text: aiReport.substring(0, 100) + '...',
                                url: window.location.href,
                              });
                            } catch (err) {
                              console.log('Share failed:', err);
                            }
                          } else {
                            navigator.clipboard.writeText(window.location.href);
                            alert('链接已复制到剪贴板');
                          }
                        }}
                        className="p-2 rounded-full hover:bg-paper-50 text-ink-400 transition-colors"
                      >
                        <Share2 size={20} />
                      </button>
                    </div>
                  </div>
                  <div className="prose prose-stone max-w-none">
                    <div className="text-ink-700 font-light leading-loose markdown-content">
                      <ReactMarkdown>{aiReport}</ReactMarkdown>
                    </div>
                  </div>

                  {/* Chat with AI Master */}
                  <div className="mt-12 pt-12 border-t border-paper-100 space-y-6">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-gold-500" />
                      <h4 className="text-sm font-bold text-ink-900 uppercase tracking-widest">与大师对话 / CHAT WITH MASTER</h4>
                    </div>
                    
                    <div className="bg-paper-50 rounded-2xl p-6 space-y-6">
                      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        {chatMessages.length === 0 && (
                          <p className="text-center text-xs text-ink-400 py-4">您可以就这份报告向大师提问，例如：<br/>“我适合在哪个城市发展？” 或 “我的性格弱点是什么？”</p>
                        )}
                        {chatMessages.map((msg, i) => (
                          <div key={i} className={cn(
                            "flex flex-col",
                            msg.role === 'user' ? "items-end" : "items-start"
                          )}>
                            <div className={cn(
                              "max-w-[80%] p-3 rounded-2xl text-sm prose prose-sm prose-stone",
                              msg.role === 'user' ? "bg-gold-500 text-white prose-invert" : "bg-white border border-paper-200 text-ink-700"
                            )}>
                              <ReactMarkdown>{msg.text}</ReactMarkdown>
                            </div>
                          </div>
                        ))}
                        {isSendingChat && (
                          <div className="flex items-start">
                            <div className="bg-white border border-paper-200 p-3 rounded-2xl">
                              <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 bg-gold-400 rounded-full animate-bounce" />
                                <span className="w-1.5 h-1.5 bg-gold-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                                <span className="w-1.5 h-1.5 bg-gold-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-4">
                        <input 
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="向大师提问..."
                          className="flex-1 bg-white border border-paper-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-gold-200 outline-none transition-all"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleChat();
                          }}
                        />
                        <button 
                          onClick={handleChat}
                          disabled={isSendingChat || !chatInput.trim()}
                          className="bg-ink-900 text-paper-50 px-6 py-3 rounded-xl text-sm font-bold hover:bg-ink-800 disabled:opacity-50 transition-all flex items-center gap-2"
                        >
                          {isSendingChat ? '思考中...' : '发送'} <ArrowRight size={16} />
                        </button>
                      </div>
                      <p className="text-[10px] text-ink-400">大师将结合您的命盘数据为您提供针对性建议。</p>
                    </div>
                  </div>
                </motion.section>
              )}

              <div className="flex justify-center pt-24">
                <button 
                  onClick={() => setStep('input')}
                  className="text-[10px] uppercase tracking-[0.3em] text-ink-500 hover:text-ink-900 transition-colors"
                >
                  返回重新输入 / RETURN
                </button>
              </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="bg-white border-t border-paper-200 py-24">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16">
            <div className="col-span-2 space-y-8">
              <h2 className="text-3xl font-serif text-ink-900 tracking-tight">悬壶承光</h2>
              <p className="text-sm text-ink-400 max-w-sm font-light leading-relaxed">
                融合东方玄学智慧与现代数据科学，为您提供深度、精准的生命轨迹分析。探索命运的无限可能，寻得内心的宁静与指引。
              </p>
            </div>
            <div className="space-y-8">
              <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-ink-900">快速链接 / LINKS</h4>
              <nav className="flex flex-col gap-4 text-sm text-ink-400 font-light">
                <a href="#" className="hover:text-ink-900 transition-colors">关于我们 / ABOUT</a>
                <a href="#" className="hover:text-ink-900 transition-colors">算法说明 / ALGORITHM</a>
                <a href="#" className="hover:text-ink-900 transition-colors">隐私政策 / PRIVACY</a>
                <a href="#" className="hover:text-ink-900 transition-colors">使用条款 / TERMS</a>
              </nav>
            </div>
            <div className="space-y-8">
              <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-ink-900">联系我们 / CONTACT</h4>
              <div className="space-y-4">
                <p className="text-sm text-ink-400 font-light">support@ichingfate.com</p>
                <div className="flex gap-4 text-ink-300">
                  <Globe size={18} className="hover:text-ink-900 cursor-pointer transition-colors" />
                  <History size={18} className="hover:text-ink-900 cursor-pointer transition-colors" />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-24 pt-8 border-t border-paper-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[10px] text-ink-300 uppercase tracking-[0.2em]">© 2024 悬壶承光. All rights reserved.</p>
            <p className="text-[10px] text-ink-300 uppercase tracking-[0.2em]">Designed for Serenity & Insight.</p>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-ink-900 text-paper-50 px-8 py-4 rounded-full shadow-2xl z-50 flex items-center gap-3"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-medium tracking-wide">推演成功，已为您生成命理报告</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </ErrorBoundary>
  );
}
