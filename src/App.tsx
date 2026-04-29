import React, { useState, useEffect, useRef, Component, ReactNode } from 'react';
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
  User,
  Wallet
} from 'lucide-react';
import { 
  calculateBazi, 
  getZodiac, 
  getWesternZodiac, 
  calculateZiwei,
  calculateWesternAstrology,
  calculateLifeNumerology,
  getStructuredAnalysis,
  BaziData,
  ZiweiData
} from './services/fateEngine';
import { Lunar, Solar, LunarYear } from 'lunar-javascript';
import { getUnifiedInterpretation, chatWithMaster } from './services/aiService';
import { logout, saveFateRecord, getHistory } from './firebase';
import { verifyToken, getCurrentUser } from './api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import ReactMarkdown from 'react-markdown';
import { SYSTEMS, YEARS } from './constants/fateData';
import { usePoints, PointsProvider } from './points';
import { LoginModal } from './auth/LoginModal';
import { PaymentModal } from './components/PaymentModal';
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
  const [selectedSystems, setSelectedSystems] = useState<string[]>(['bazi']);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [selectedPalace, setSelectedPalace] = useState<number | null>(null);
  
  // 登录和支付弹窗
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // 使用积分系统
  const { points: userPoints, refreshPoints, checkPoints, usePoints: spendPoints, addPoints } = usePoints();
  
  const [birthInfo, setBirthInfo] = useState({
    name: '',
    gender: 'male' as 'male' | 'female',
    calendarType: 'solar' as 'solar' | 'lunar',
    isLeap: false,
    year: 1990,
    month: 1,
    day: 1,
    hour: 12,
    minute: 0,
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
  const [structuredAnalysis, setStructuredAnalysis] = useState<any>(null);
  const [selectedPillar, setSelectedPillar] = useState<'year' | 'month' | 'day' | 'hour' | null>(null);
  const [showShareToast, setShowShareToast] = useState(false);
  const [selectedDaYunIdx, setSelectedDaYunIdx] = useState<number | null>(null);
  const aiReportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cached = getCurrentUser();
    if (cached) {
      setIsLoggedIn(true);
      setUser(cached);
      loadHistory();
    }
    verifyToken().then(u => {
      if (u) {
        setIsLoggedIn(true);
        setUser(u);
        loadHistory();
      } else {
        setIsLoggedIn(false);
        setUser(null);
        setHistory([]);
      }
      setIsAuthReady(true);
    });
  }, []);

  const loadHistory = async () => {
    try {
      const h = await getHistory();
      setHistory(h as any[]);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const handleLogin = () => {
    setShowLoginModal(true);
  };

  const handleLogout = () => {
    logout();
    setIsLoggedIn(false);
    setUser(null);
    setHistory([]);
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

  const getCharElement = (char: string): string => {
    if ('甲乙寅卯'.includes(char)) return '木';
    if ('丙丁巳午'.includes(char)) return '火';
    if ('戊己辰戌丑未'.includes(char)) return '土';
    if ('庚辛申酉'.includes(char)) return '金';
    if ('壬癸亥子'.includes(char)) return '水';
    return '';
  };

  const getBrightnessColor = (brightness: string) => {
    if (brightness === '庙') return 'text-red-700';
    if (brightness === '旺') return 'text-orange-600';
    if (brightness === '得' || brightness === '利') return 'text-amber-600';
    if (brightness === '平') return 'text-ink-700';
    if (brightness === '不' || brightness === '闲') return 'text-ink-400';
    if (brightness === '陷') return 'text-blue-500';
    return 'text-ink-800';
  };

  const getTransformationStyle = (t: string) => {
    if (t === '化禄') return { char: '禄', cls: 'text-yellow-500' };
    if (t === '化权') return { char: '权', cls: 'text-red-500' };
    if (t === '化科') return { char: '科', cls: 'text-blue-500' };
    if (t === '化忌') return { char: '忌', cls: 'text-gray-900' };
    return null;
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

  const getMaxDays = (year: number, month: number, calendarType: 'solar' | 'lunar') => {
    if (calendarType === 'solar') {
      return new Date(year, month, 0).getDate();
    }
    return 30; // lunar months are 29-30 days
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
          uid: String(user.uid),
          name: birthInfo.name,
          birthInfo,
          fateData: data
        });
        loadHistory();
      } catch (err) {
        console.error('Failed to save history:', err);
      }
    }

    const sa = data.bazi ? getStructuredAnalysis(data.bazi) : null;
    setStructuredAnalysis(sa);
    setFateData(data);
    setStep('dashboard');
    window.scrollTo({ top: 0, behavior: 'instant' });
    setSelectedPalace(null);
    setIsCalculating(false);
    setActiveTab(selectedSystems[0]);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const unlockAiInterpretation = async () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    const cost = aiDepth === 'deep' ? 100 : 20;
    if (!checkPoints(cost)) {
      setShowPaymentModal(true);
      return;
    }
    const deductResult = await spendPoints(cost, aiDepth === 'deep' ? 'AI深度解读' : 'AI快速解读');
    if (!deductResult.success) {
      setShowPaymentModal(true);
      return;
    }
    setIsUnlockingAi(true);
    setAiProgress(0);
    setAiReport('');
    setTimeout(() => aiReportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);

    const expectedChars = aiDepth === 'deep' ? 2200 : 1000;
    let charCount = 0;

    try {
      const result = await getUnifiedInterpretation(
        birthInfo, fateData, structuredAnalysis, aiDepth,
        (chunk) => {
          charCount += chunk.length;
          setAiProgress(Math.min(95, (charCount / expectedChars) * 100));
          setAiReport(prev => (prev ?? '') + chunk);
        }
      );

      if (charCount === 0) {
        // 流式调用失败，result 是错误信息字符串
        setAiReport('AI 解读暂时无法连接，积分已退还，请稍后重试。');
        await addPoints(cost, 'AI解读失败退款', 'refund');
      } else {
        setAiProgress(100);
      }
    } catch {
      setAiReport('AI 解读出现异常，积分已退还，请稍后重试。');
      await addPoints(cost, 'AI解读失败退款', 'refund');
    } finally {
      setTimeout(() => {
        setIsUnlockingAi(false);
        setAiProgress(0);
      }, 500);
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim() || isSendingChat) return;
    if (!isLoggedIn) { setShowLoginModal(true); return; }

    const CHAT_COST = 10;
    if (!checkPoints(CHAT_COST)) {
      setShowPaymentModal(true);
      return;
    }
    const deductResult = await spendPoints(CHAT_COST, '与大师对话');
    if (!deductResult.success) {
      setShowPaymentModal(true);
      return;
    }

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsSendingChat(true);

    try {
      const response = await chatWithMaster(birthInfo, fateData, structuredAnalysis, chatMessages, userMessage);
      const failed = !response || response.startsWith('抱歉');
      if (failed) {
        await addPoints(CHAT_COST, '对话失败退款', 'refund');
        setChatMessages(prev => [...prev, { role: 'model', text: '连接暂时失败，积分已退还，请重试。' }]);
      } else {
        setChatMessages(prev => [...prev, { role: 'model', text: response }]);
      }
    } catch {
      await addPoints(CHAT_COST, '对话失败退款', 'refund');
      setChatMessages(prev => [...prev, { role: 'model', text: '连接出现异常，积分已退还，请重试。' }]);
    } finally {
      setIsSendingChat(false);
    }
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
              <button
                onClick={() => { setStep('input'); }}
                className="hover:text-ink-900 transition-colors"
              >
                新排盘 / NEW
              </button>
              {isLoggedIn && step === 'dashboard' && (
                <button
                  onClick={() => setActiveTab('history')}
                  className="hover:text-ink-900 transition-colors"
                >
                  历史 / ARCHIVE
                </button>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-ink-400">
              <button onClick={() => setStep('input')} title="新排盘" className="hover:text-ink-900 transition-colors"><Plus size={18} /></button>
            </div>
            <div className="h-4 w-[1px] bg-paper-200" />
            <div className="flex items-center gap-4">
              {/* 积分显示 */}
              {isLoggedIn ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full">
                  <Coins size={14} className="text-amber-600" />
                  <span className="text-xs font-bold text-amber-700">{userPoints}</span>
                  <button 
                    onClick={() => setShowPaymentModal(true)}
                    className="ml-1 text-[10px] bg-amber-600 text-white px-2 py-0.5 rounded-full hover:bg-amber-700 transition-colors"
                  >
                    充值
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-full">
                  <Coins size={14} className="text-gray-400" />
                  <span className="text-xs text-gray-500">登录查看积分</span>
                </div>
              )}
              
              <div className="h-4 w-[1px] bg-paper-200" />
              
              {/* 用户登录状态 */}
              {isLoggedIn && user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(v => !v)}
                    className="flex items-center gap-2 focus:outline-none"
                  >
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] font-bold text-ink-900">{user.name || user.email}</p>
                      <p className="text-[9px] text-ink-400 uppercase tracking-widest">点击管理账户</p>
                    </div>
                    <div className="w-10 h-10 rounded-full border border-paper-200 overflow-hidden">
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email || 'U')}&background=2D2D2D&color=F5F0E8`}
                        alt={user.name || user.email || 'User'}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </button>
                  {showUserMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                      <div className="absolute right-0 top-12 z-50 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 overflow-hidden">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-xs font-bold text-gray-900 truncate">{user.name || '用户'}</p>
                          <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                        </div>
                        <button
                          onClick={() => { setShowUserMenu(false); handleLogout(); }}
                          className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                        >
                          退出登录
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-xs font-medium rounded-full hover:bg-gray-800 transition-colors"
                >
                  <User size={14} />
                  登录
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 pt-24 pb-8 md:pt-32 md:pb-16">
        <AnimatePresence mode="wait">
          {step === 'input' ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto space-y-16 pb-24 md:pb-0"
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
                    onClick={() => setShowLoginModal(true)}
                    className="text-[10px] uppercase tracking-[0.2em] font-bold text-ink-400 hover:text-ink-900 flex items-center gap-2 transition-colors"
                  >
                    <Lock className="w-3 h-3" /> 登录解锁
                  </button>
                ) : (
                  <div className="relative">
                    <button
                      onClick={() => setShowHistoryPanel(v => !v)}
                      className="text-[10px] uppercase tracking-[0.2em] font-bold text-ink-900 flex items-center gap-1 hover:text-ink-600 transition-colors"
                    >
                      选择档案 <ChevronRight size={10} className={cn("transition-transform", showHistoryPanel && "rotate-90")} />
                    </button>
                    {showHistoryPanel && history.length > 0 && (
                      <div className="absolute right-0 top-7 z-20 w-64 bg-white border border-paper-200 rounded-xl shadow-lg overflow-hidden">
                        {history.slice(0, 5).map((rec, i) => (
                          <button
                            key={rec.id || i}
                            onClick={() => {
                              if (rec.birthInfo) setBirthInfo(rec.birthInfo);
                              setShowHistoryPanel(false);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-paper-50 transition-colors border-b border-paper-100 last:border-0"
                          >
                            <p className="text-xs font-medium text-ink-900">{rec.name || '未命名'}</p>
                            <p className="text-[10px] text-ink-400 mt-0.5">
                              {rec.birthInfo?.year}年{rec.birthInfo?.month}月{rec.birthInfo?.day}日 · {rec.birthInfo?.gender === 'male' ? '男' : '女'}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                    {showHistoryPanel && history.length === 0 && (
                      <div className="absolute right-0 top-7 z-20 w-48 bg-white border border-paper-200 rounded-xl shadow-lg px-4 py-3">
                        <p className="text-[10px] text-ink-400">暂无历史记录</p>
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* Module 3: Identity & Birth Details */}
              <section className="space-y-12">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-ink-900 text-paper-50 flex items-center justify-center text-[10px] font-bold">02</div>
                  <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold text-ink-900">基本身份信息 / IDENTITY</h3>
                </div>

                <div className="space-y-12">
                  {/* Name + Gender first */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-3">
                      <label className="text-[10px] uppercase tracking-[0.2em] text-ink-400 font-bold">姓名 / NAME</label>
                      <input
                        type="text"
                        placeholder="请输入姓名"
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

                  {/* Calendar toggle BEFORE date entry */}
                  <div className="space-y-3">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-ink-400 font-bold">历法 / CALENDAR</label>
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

                  {/* Date & Time — day options respect calendar + month */}
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
                          const maxD = getMaxDays(birthInfo.year, newMonth, birthInfo.calendarType);
                          setBirthInfo({
                            ...birthInfo,
                            month: newMonth,
                            day: Math.min(birthInfo.day, maxD),
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
                        {Array.from({ length: getMaxDays(birthInfo.year, birthInfo.month, birthInfo.calendarType) }, (_, i) => {
                          const d = i + 1;
                          const lunarDays = ['初一','初二','初三','初四','初五','初六','初七','初八','初九','初十','十一','十二','十三','十四','十五','十六','十七','十八','十九','二十','廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'];
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

                  {/* Location */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] uppercase tracking-[0.2em] text-ink-400 font-bold">国家 / COUNTRY</label>
                      <select
                        value={birthInfo.country}
                        onChange={e => setBirthInfo({...birthInfo, country: e.target.value, province: '', city: ''})}
                        className="w-full bg-transparent border-b border-paper-200 py-2 focus:outline-none focus:border-ink-900 text-sm font-light transition-all"
                      >
                        <option value="">请选择国家</option>
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
                        onChange={e => {
                          const cityName = e.target.value;
                          // Auto-fill longitude for non-CN cities
                          let newLon = birthInfo.longitude;
                          if (birthInfo.country !== 'CN' && cityName) {
                            const cityData = City.getCitiesOfState(birthInfo.country, birthInfo.province).find(c => c.name === cityName);
                            if (cityData?.longitude) newLon = parseFloat(cityData.longitude);
                          }
                          setBirthInfo({...birthInfo, city: cityName, longitude: newLon});
                        }}
                        className="w-full bg-transparent border-b border-paper-200 py-2 focus:outline-none focus:border-ink-900 text-sm font-light transition-all"
                        disabled={!birthInfo.province}
                      >
                        <option value="">请选择城市</option>
                        {birthInfo.country && birthInfo.province && getCitiesForSelect(birthInfo.country, birthInfo.province).map(c => (
                          <option key={c.name} value={c.name}>{getCityName(birthInfo.country, c.name)}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-ink-400 font-bold">出生经度 / LONGITUDE <span className="text-ink-300 normal-case font-normal">（影响真太阳时，用于精确排盘）</span></label>
                    <input
                      type="number"
                      step="0.01"
                      min="-180"
                      max="180"
                      value={birthInfo.longitude}
                      onChange={e => setBirthInfo({...birthInfo, longitude: parseFloat(e.target.value)})}
                      className="w-full bg-transparent border-b border-paper-200 py-2 focus:outline-none focus:border-ink-900 text-sm font-light transition-all"
                    />
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

                {/* Desktop submit button (inline) */}
                <button
                  onClick={handleCalculate}
                  disabled={isCalculating || selectedSystems.length === 0}
                  className="hidden md:flex w-full py-5 bg-ink-900 text-paper-50 text-[11px] uppercase tracking-[0.3em] font-bold hover:bg-ink-700 transition-all disabled:opacity-50 items-center justify-center gap-4 group"
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

              {/* Mobile sticky submit button */}
              <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 p-4 bg-[#FDFCF9]/95 backdrop-blur-md border-t border-paper-200">
                <button
                  onClick={handleCalculate}
                  disabled={isCalculating || selectedSystems.length === 0}
                  className="w-full py-4 bg-ink-900 text-paper-50 text-[11px] uppercase tracking-[0.3em] font-bold hover:bg-ink-700 transition-all disabled:opacity-50 flex items-center justify-center gap-3 rounded-2xl"
                >
                  {isCalculating ? (
                    <div className="w-4 h-4 border border-paper-50/30 border-t-paper-50 rounded-full animate-spin" />
                  ) : (
                    <>
                      开启深度测算
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
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
              {/* Hero Section — Identity + 四柱 + 命主画像 合并 */}
              <section className="bg-white/60 backdrop-blur-sm border border-paper-200 rounded-3xl overflow-hidden">
                {/* Top accent */}
                <div className="h-px bg-gradient-to-r from-transparent via-gold-400/60 to-transparent" />

                <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-paper-100">

                  {/* Col 1 — 身份信息 */}
                  <div className="lg:col-span-3 p-6 md:p-8 flex flex-col gap-6">
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.3em] text-ink-400 font-bold">命主 / PROFILE</p>
                      <h2 className="text-3xl font-serif text-ink-900 mt-2 leading-tight">{birthInfo.name}</h2>
                      <p className="text-[10px] text-ink-400 mt-1">
                        {birthInfo.gender === 'male' ? '乾造' : '坤造'} · 虚岁 {new Date().getFullYear() - birthInfo.year + 1} 岁
                      </p>
                    </div>
                    <div className="space-y-3 text-xs">
                      {[
                        { label: '公历', value: `${getSolarDateDisplay(birthInfo.year, birthInfo.month, birthInfo.day, birthInfo.calendarType, birthInfo.isLeap)} ${birthInfo.hour}:${String(birthInfo.minute).padStart(2,'0')}` },
                        { label: '农历', value: getLunarDateDisplay(birthInfo.year, birthInfo.month, birthInfo.day, birthInfo.calendarType, birthInfo.isLeap) },
                        { label: '出生地', value: `${getCountryName(birthInfo.country)} ${getProvinceName(birthInfo.country, birthInfo.province, birthInfo.province)} ${getCityName(birthInfo.country, birthInfo.city)}` },
                        { label: '生肖 / 星座', value: `${fateData.zodiac} · ${fateData.westernZodiac}座` },
                        ...(fateData.mbti ? [{ label: 'MBTI', value: `${fateData.mbti.energy}${fateData.mbti.perception}${fateData.mbti.judgment}${fateData.mbti.lifestyle}` }] : []),
                      ].map((row, i, arr) => (
                        <div key={i} className={cn("flex justify-between items-start gap-4 pb-3", i < arr.length - 1 && "border-b border-paper-100")}>
                          <span className="text-ink-400 flex-shrink-0">{row.label}</span>
                          <span className="text-ink-800 font-medium text-right">{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Col 2 — 四柱命盘 */}
                  <div className="lg:col-span-5 p-6 md:p-8 flex flex-col gap-5">
                    <p className="text-[9px] uppercase tracking-[0.3em] text-ink-400 font-bold">四柱命盘 / FOUR PILLARS</p>
                    {fateData.bazi ? (
                      <>
                        <div className="grid grid-cols-4 gap-2 md:gap-3 flex-1">
                          {(['year', 'month', 'day', 'hour'] as const).map((key) => {
                            const pillar = fateData.bazi!.pillars[key];
                            const labels: Record<string, string> = { year: '年柱', month: '月柱', day: '日柱', hour: '时柱' };
                            const isDay = key === 'day';
                            return (
                              <div key={key} className={cn(
                                "flex flex-col items-center rounded-2xl py-5 px-1 gap-2 border relative overflow-hidden",
                                isDay ? "bg-amber-50/60 border-gold-200 shadow-sm shadow-gold-100" : "bg-white border-paper-200"
                              )}>
                                {isDay && <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-gold-300 via-gold-500 to-gold-300" />}
                                <span className={cn("text-[9px] font-bold tracking-widest", isDay ? "text-gold-600" : "text-ink-400")}>{labels[key]}</span>
                                <span className={cn("text-3xl md:text-4xl font-serif font-bold", getElementColor(pillar.gan))}>{pillar.gan}</span>
                                <span className={cn("text-2xl md:text-3xl font-serif", getElementColor(pillar.zhi))}>{pillar.zhi}</span>
                                <span className={cn("text-[8px] font-medium tracking-wide", isDay ? "text-ink-500" : "text-ink-400")}>{pillar.tenGod}</span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                          {(['木','火','土','金','水'] as const).map(el => {
                            const elData = fateData.bazi!.fiveElements[el];
                            if (!elData) return null;
                            const isYong = structuredAnalysis?.xiYongShen.yongShen === el;
                            const isXi = structuredAnalysis?.xiYongShen.xiShen === el;
                            const isJi = structuredAnalysis?.xiYongShen.jiShen === el;
                            const colorMap: Record<string, string> = {
                              '木': 'bg-emerald-50 text-emerald-700 border-emerald-200',
                              '火': 'bg-red-50 text-red-700 border-red-200',
                              '土': 'bg-amber-50 text-amber-700 border-amber-200',
                              '金': 'bg-zinc-100 text-zinc-600 border-zinc-200',
                              '水': 'bg-blue-50 text-blue-700 border-blue-200'
                            };
                            return (
                              <span key={el} className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1", colorMap[el])}>
                                {el} {elData.percentage}%
                                {isYong && <span className="font-bold text-emerald-600">用</span>}
                                {isXi && <span className="font-bold text-amber-600">喜</span>}
                                {isJi && <span className="font-bold text-red-500">忌</span>}
                              </span>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-ink-300 text-[10px] uppercase tracking-widest">
                        未选择八字分析
                      </div>
                    )}
                  </div>

                  {/* Col 3 — 命主画像 */}
                  <div className="lg:col-span-4 p-6 md:p-8 flex flex-col gap-5">
                    <p className="text-[9px] uppercase tracking-[0.3em] text-ink-400 font-bold">命主画像 / FATE PORTRAIT</p>
                    {structuredAnalysis ? (
                      <>
                        {/* 格局 + 强弱 */}
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-base font-serif text-ink-900">{structuredAnalysis.pattern.name}</span>
                            <span className={cn(
                              "text-[9px] font-bold px-2 py-0.5 rounded-full",
                              structuredAnalysis.strength.level.includes('强') ? "bg-red-50 text-red-600" :
                              structuredAnalysis.strength.level.includes('弱') ? "bg-blue-50 text-blue-600" :
                              "bg-paper-100 text-ink-600"
                            )}>{structuredAnalysis.strength.level}</span>
                          </div>
                          <p className="text-[10px] text-ink-500 leading-relaxed">{structuredAnalysis.strength.reason}</p>
                          <p className="text-[10px] text-ink-500 leading-relaxed">{structuredAnalysis.pattern.description}</p>
                        </div>

                        {/* 用喜忌 */}
                        <div className="flex gap-2">
                          <span className="flex-1 text-center py-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold">
                            <span className="block text-[8px] text-emerald-400 mb-0.5">用神</span>
                            {structuredAnalysis.xiYongShen.yongShen}
                          </span>
                          <span className="flex-1 text-center py-2 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 text-[10px] font-bold">
                            <span className="block text-[8px] text-amber-400 mb-0.5">喜神</span>
                            {structuredAnalysis.xiYongShen.xiShen}
                          </span>
                          <span className="flex-1 text-center py-2 rounded-xl bg-red-50 border border-red-100 text-red-600 text-[10px] font-bold">
                            <span className="block text-[8px] text-red-300 mb-0.5">忌神</span>
                            {structuredAnalysis.xiYongShen.jiShen}
                          </span>
                        </div>

                        {/* 当前大运 */}
                        {fateData.bazi?.daYun && (() => {
                          const cy = new Date().getFullYear();
                          const va = cy - birthInfo.year + 1;
                          const pillars = fateData.bazi!.daYun.pillars;
                          const idx = pillars.findIndex((d: any, i: number) => va >= d.age && va < (pillars[i+1]?.age ?? 999));
                          const cur = idx >= 0 ? pillars[idx] : null;
                          const nxt = idx >= 0 ? pillars[idx + 1] : null;
                          return cur ? (
                            <div className="bg-ink-800 rounded-2xl p-4 flex items-center justify-between">
                              <div>
                                <p className="text-[8px] uppercase tracking-widest text-paper-300 mb-1">当前大运</p>
                                <p className="text-2xl font-serif text-gold-300">{cur.pillar}</p>
                                <p className="text-[9px] text-paper-300 mt-0.5">{cur.age}岁起 · {cur.year}年{nxt ? ` → ${nxt.age}岁` : ''}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[8px] text-paper-300">虚岁</p>
                                <p className="text-2xl font-serif text-paper-100">{va}</p>
                                <p className="text-[8px] text-paper-300">{cy}年</p>
                              </div>
                            </div>
                          ) : null;
                        })()}
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-ink-300 text-[10px] uppercase tracking-widest">
                        请先选择八字分析
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

                      {/* Five Elements inside BaZi tab */}
                      {structuredAnalysis && (
                        <div className="bg-white border border-paper-200 rounded-2xl p-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-[9px] font-bold text-ink-400 uppercase tracking-[0.2em]">FIVE ELEMENTS / 五行能量</h3>
                            <div className="flex gap-1.5 text-[9px] font-bold">
                              <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">用 {structuredAnalysis.xiYongShen.yongShen}</span>
                              <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">喜 {structuredAnalysis.xiYongShen.xiShen}</span>
                              <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded">忌 {structuredAnalysis.xiYongShen.jiShen}</span>
                            </div>
                          </div>
                          <div className="space-y-3">
                            {(['木','火','土','金','水'] as const).map((el) => {
                              const elData = fateData.bazi!.fiveElements[el];
                              if (!elData) return null;
                              const isYong = structuredAnalysis.xiYongShen.yongShen === el;
                              const isXi = structuredAnalysis.xiYongShen.xiShen === el;
                              const isJi = structuredAnalysis.xiYongShen.jiShen === el;
                              const barColor = el === '木' ? 'bg-emerald-400' : el === '火' ? 'bg-red-400' : el === '土' ? 'bg-amber-400' : el === '金' ? 'bg-zinc-300' : 'bg-blue-400';
                              return (
                                <div key={el} className="flex items-center gap-3">
                                  <div className="flex items-center gap-1.5 w-16 flex-shrink-0">
                                    <span className={cn("text-sm font-serif font-bold", getElementColor(el))}>{el}</span>
                                    {isYong && <span className="text-[8px] bg-emerald-100 text-emerald-700 px-1 rounded font-bold">用</span>}
                                    {isXi && <span className="text-[8px] bg-amber-100 text-amber-700 px-1 rounded font-bold">喜</span>}
                                    {isJi && <span className="text-[8px] bg-red-100 text-red-600 px-1 rounded font-bold">忌</span>}
                                  </div>
                                  <div className="flex-1 h-4 bg-paper-100 rounded-full overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${elData.percentage}%` }}
                                      transition={{ duration: 0.8, ease: 'easeOut' }}
                                      className={cn("h-full rounded-full", barColor, isJi ? 'opacity-50' : '')}
                                    />
                                  </div>
                                  <div className="w-20 flex-shrink-0 text-right">
                                    <span className="text-[10px] text-ink-500">{elData.count}字</span>
                                    <span className="text-[10px] text-ink-400 ml-1">({elData.percentage}%)</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="space-y-8">
                        <div className="flex items-center justify-between">
                          <h3 className="text-[9px] font-bold text-ink-400 uppercase tracking-[0.2em]">BAZI CHART</h3>
                        </div>
                        <div className="h-[1px] w-full bg-paper-100" />
                        
                        {/* BaZi Table */}
                        {(() => {
                          const cols: { key: 'year' | 'month' | 'day' | 'hour'; label: string; pillar: any }[] = [
                            { key: 'year', label: '年柱', pillar: fateData.bazi.pillars.year },
                            { key: 'month', label: '月柱', pillar: fateData.bazi.pillars.month },
                            { key: 'day', label: '日柱', pillar: fateData.bazi.pillars.day },
                            { key: 'hour', label: '时柱', pillar: fateData.bazi.pillars.hour },
                          ];
                          return (
                            <>
                              <div className="overflow-x-auto rounded-xl border border-paper-200">
                                <table className="w-full border-collapse text-center text-sm">
                                  <thead>
                                    <tr className="bg-paper-50 border-b border-paper-200">
                                      <th className="p-3 text-[10px] font-bold text-ink-400 uppercase tracking-widest">项目</th>
                                      {cols.map(c => (
                                        <th key={c.key}
                                          onClick={() => setSelectedPillar(selectedPillar === c.key ? null : c.key)}
                                          className={cn(
                                            "p-3 text-[10px] font-bold uppercase tracking-widest cursor-pointer transition-colors select-none",
                                            selectedPillar === c.key ? "bg-ink-900 text-gold-300" : "text-ink-400 hover:text-ink-900"
                                          )}
                                        >
                                          {c.label} {selectedPillar === c.key ? '▲' : ''}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {[
                                      { row: '天干', render: (p: any) => <span className={cn("text-2xl font-serif", getElementColor(p.gan))}>{p.gan}</span> },
                                      { row: '地支', render: (p: any) => <span className={cn("text-2xl font-serif", getElementColor(p.zhi))}>{p.zhi}</span> },
                                      { row: '十神', render: (p: any) => <span className="text-xs text-ink-600">{p.tenGod}</span> },
                                      { row: '纳音', render: (p: any) => <span className="text-xs text-ink-500">{p.naYin}</span> },
                                    ].map(({ row, render }) => (
                                      <tr key={row} className="border-b border-paper-100 last:border-0">
                                        <td className="p-3 text-[10px] text-ink-400 font-bold">{row}</td>
                                        {cols.map(c => (
                                          <td key={c.key}
                                            onClick={() => setSelectedPillar(selectedPillar === c.key ? null : c.key)}
                                            className={cn(
                                              "p-3 cursor-pointer transition-colors",
                                              selectedPillar === c.key ? "bg-ink-50" : "hover:bg-paper-50"
                                            )}
                                          >
                                            {render(c.pillar)}
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              {/* Pillar Detail Panel */}
                              {selectedPillar && (() => {
                                const p = fateData.bazi.pillars[selectedPillar];
                                const labelMap = { year: '年柱', month: '月柱', day: '日柱', hour: '时柱' };
                                return (
                                  <motion.div
                                    key={selectedPillar}
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-ink-50 border border-ink-100 rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-3 gap-6"
                                  >
                                    <div className="sm:col-span-3 flex items-center justify-between">
                                      <h4 className="text-xs font-bold text-ink-700 uppercase tracking-widest">
                                        {labelMap[selectedPillar]} 详情 — {p.gan}{p.zhi}
                                      </h4>
                                      <button onClick={() => setSelectedPillar(null)} className="text-[10px] text-ink-400 hover:text-ink-900 font-bold">关闭</button>
                                    </div>
                                    <div className="space-y-2">
                                      <p className="text-[9px] uppercase tracking-widest text-ink-400 font-bold">藏干 / HIDDEN STEMS</p>
                                      <div className="flex flex-wrap gap-2">
                                        {p.hiddenStems?.length > 0 ? p.hiddenStems.map((h: any, i: number) => (
                                          <span key={i} className="flex items-center gap-1 bg-white border border-paper-200 rounded-lg px-2 py-1">
                                            <span className={cn("text-sm font-serif font-bold", getElementColor(h.gan))}>{h.gan}</span>
                                            <span className="text-[9px] text-ink-400">{h.tenGod}</span>
                                          </span>
                                        )) : <span className="text-xs text-ink-400">无</span>}
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <p className="text-[9px] uppercase tracking-widest text-ink-400 font-bold">空亡 / KONG WANG</p>
                                      <p className="text-sm font-serif text-ink-700">{p.kongWang || '无'}</p>
                                      <p className="text-[9px] uppercase tracking-widest text-ink-400 font-bold mt-3">纳音 / NA YIN</p>
                                      <p className="text-sm text-ink-700">{p.naYin}</p>
                                    </div>
                                    <div className="space-y-2">
                                      <p className="text-[9px] uppercase tracking-widest text-ink-400 font-bold">神煞 / SHEN SHA</p>
                                      <div className="flex flex-wrap gap-1">
                                        {p.shenSha?.length > 0 ? p.shenSha.map((s: string, i: number) => (
                                          <span key={i} className="bg-gold-50 border border-gold-200 text-gold-800 text-[10px] px-2 py-0.5 rounded">{s}</span>
                                        )) : <span className="text-xs text-ink-400">无</span>}
                                      </div>
                                    </div>
                                  </motion.div>
                                );
                              })()}
                            </>
                          );
                        })()}

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

                      {/* Da Yun Timeline */}
                      {(() => {
                        const currentYear = new Date().getFullYear();
                        const virtualAge = currentYear - birthInfo.year + 1;
                        const pillars = fateData.bazi.daYun.pillars;
                        return (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="text-[9px] font-bold text-ink-400 uppercase tracking-[0.2em]">GREAT LUCK / 大运</h3>
                              <p className="text-[10px] text-ink-500">起运：{fateData.bazi.daYun.startYear}年（{fateData.bazi.daYun.startAge}岁）</p>
                            </div>
                            <div className="overflow-x-auto pb-2 -mx-2 px-2">
                              <div className="flex items-stretch gap-0 min-w-max relative">
                                {/* Connecting line */}
                                <div className="absolute top-8 left-8 right-8 h-[1px] bg-paper-200 z-0" />
                                {pillars.map((d: any, i: number) => {
                                  const nextAge = pillars[i + 1]?.age ?? 999;
                                  const isCurrent = virtualAge >= d.age && virtualAge < nextAge;
                                  const isSelected = selectedDaYunIdx === i;
                                  return (
                                    <div
                                      key={i}
                                      onClick={() => setSelectedDaYunIdx(isSelected ? null : i)}
                                      className="flex flex-col items-center gap-2 relative z-10 cursor-pointer"
                                      style={{ minWidth: '72px' }}
                                    >
                                      {/* Year dot */}
                                      <div className={cn(
                                        "w-4 h-4 rounded-full border-2 transition-all mt-6",
                                        isCurrent
                                          ? "bg-gold-500 border-gold-500 shadow-lg shadow-gold-500/40 scale-125"
                                          : isSelected ? "bg-ink-700 border-ink-700"
                                          : "bg-white border-paper-300"
                                      )} />
                                      {/* Card */}
                                      <div className={cn(
                                        "rounded-xl px-2 py-2 text-center border transition-all w-full",
                                        isSelected
                                          ? "bg-ink-900 border-ink-900 shadow-md"
                                          : isCurrent
                                          ? "bg-amber-50 border-amber-400 shadow-md shadow-amber-100"
                                          : "bg-white border-paper-200 hover:border-gold-300"
                                      )}>
                                        <p className={cn("text-[9px] font-bold", isSelected ? "text-paper-400" : isCurrent ? "text-amber-600" : "text-ink-400")}>{d.age}岁</p>
                                        <p className={cn("text-lg font-serif leading-tight", isSelected ? "text-white" : getElementColor(d.pillar[0]))}>{d.pillar}</p>
                                        <p className={cn("text-[8px]", isSelected ? "text-paper-400" : isCurrent ? "text-amber-500" : "text-ink-400")}>{d.year}</p>
                                      </div>
                                      {isCurrent && !isSelected && (
                                        <span className="text-[7px] text-amber-500 font-bold uppercase tracking-wider">▲ 当前</span>
                                      )}
                                      {isSelected && (
                                        <span className="text-[7px] text-ink-500 font-bold uppercase tracking-wider">▼ 详情</span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Da Yun Detail Panel */}
                    {selectedDaYunIdx !== null && fateData.bazi.daYun?.pillars && (() => {
                      const pillars = fateData.bazi.daYun.pillars;
                      const d = pillars[selectedDaYunIdx];
                      if (!d) return null;
                      const nextD = pillars[selectedDaYunIdx + 1];
                      const gan = d.pillar[0];
                      const zhi = d.pillar[1];
                      const ganEl = getCharElement(gan);
                      const zhiEl = getCharElement(zhi);
                      const getTag = (el: string) => {
                        if (structuredAnalysis?.xiYongShen.yongShen === el) return { text: '用神', cls: 'bg-emerald-100 text-emerald-700' };
                        if (structuredAnalysis?.xiYongShen.xiShen === el) return { text: '喜神', cls: 'bg-amber-100 text-amber-700' };
                        if (structuredAnalysis?.xiYongShen.jiShen === el) return { text: '忌神', cls: 'bg-red-100 text-red-600' };
                        return null;
                      };
                      const ganTag = getTag(ganEl);
                      const zhiTag = getTag(zhiEl);
                      const isYong = (el: string) => structuredAnalysis?.xiYongShen.yongShen === el;
                      const isJi = (el: string) => structuredAnalysis?.xiYongShen.jiShen === el;
                      const bothYong = isYong(ganEl) || isYong(zhiEl);
                      const bothJi = isJi(ganEl) && isJi(zhiEl);
                      const anyJi = isJi(ganEl) || isJi(zhiEl);
                      const summary = bothYong && !anyJi
                        ? `${d.pillar}大运用喜神并临，运势大旺，宜积极进取把握机遇。`
                        : bothJi
                        ? `${d.pillar}大运忌神当令，宜守成为主，谨慎决策避免冒进。`
                        : anyJi
                        ? `${d.pillar}大运用忌混杂，有机亦有阻，需审时度势行事。`
                        : `${d.pillar}大运五行平和，随缘而为，保持稳健。`;
                      return (
                        <motion.div
                          key={selectedDaYunIdx}
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-ink-50 border border-ink-200 rounded-2xl p-6 space-y-5"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-ink-800">
                              第 {selectedDaYunIdx + 1} 柱大运 · <span className={cn("font-serif text-base", getElementColor(gan))}>{gan}</span><span className={cn("font-serif text-base", getElementColor(zhi))}>{zhi}</span>
                              <span className="ml-2 text-xs font-normal text-ink-500">
                                {d.age}岁起 – {nextD ? `${nextD.age - 1}岁` : ''}（{d.year}年）
                              </span>
                            </h4>
                            <button onClick={() => setSelectedDaYunIdx(null)} className="text-[10px] text-ink-400 hover:text-ink-900 font-bold transition-colors">关闭</button>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white border border-paper-200 rounded-xl p-4 space-y-2">
                              <p className="text-[9px] uppercase tracking-widest text-ink-400 font-bold">天干 / HEAVENLY STEM</p>
                              <div className="flex items-center gap-3">
                                <span className={cn("text-4xl font-serif font-bold", getElementColor(gan))}>{gan}</span>
                                <div className="space-y-1">
                                  <p className="text-xs text-ink-600">{ganEl}行</p>
                                  {ganTag && <span className={cn("text-[10px] px-2 py-0.5 rounded font-bold", ganTag.cls)}>{ganTag.text}</span>}
                                </div>
                              </div>
                            </div>
                            <div className="bg-white border border-paper-200 rounded-xl p-4 space-y-2">
                              <p className="text-[9px] uppercase tracking-widest text-ink-400 font-bold">地支 / EARTHLY BRANCH</p>
                              <div className="flex items-center gap-3">
                                <span className={cn("text-4xl font-serif font-bold", getElementColor(zhi))}>{zhi}</span>
                                <div className="space-y-1">
                                  <p className="text-xs text-ink-600">{zhiEl}行</p>
                                  {zhiTag && <span className={cn("text-[10px] px-2 py-0.5 rounded font-bold", zhiTag.cls)}>{zhiTag.text}</span>}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white border border-paper-100 rounded-xl p-4 text-xs text-ink-600 leading-relaxed">
                            {summary}
                          </div>
                        </motion.div>
                      );
                    })()}

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

                      <div className="bg-white border border-paper-200 rounded-3xl p-2 md:p-4 w-full max-w-3xl mx-auto relative overflow-hidden shadow-inner" style={{ aspectRatio: '1/1', minWidth: '300px' }}>
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
                              const isDecadal = fateData.ziwei.decadal?.name === palace.name;
                              const isYearly = fateData.ziwei.yearly?.name === palace.name;

                              return (
                                <div
                                  key={p.idx}
                                  onClick={() => setSelectedPalace(isSelected ? null : p.idx)}
                                  className={cn(
                                    "border rounded-lg p-1 flex flex-col justify-between transition-all cursor-pointer group relative overflow-hidden",
                                    isSelected ? "border-gold-400 bg-gold-50/80 shadow-md shadow-gold-100 z-10 ring-1 ring-gold-300" :
                                    isSanFang ? "border-emerald-200 bg-emerald-50/50 ring-1 ring-emerald-100" :
                                    isSiZheng ? "border-blue-200 bg-blue-50/50 ring-1 ring-blue-100" :
                                    isDecadal ? "border-blue-400 bg-blue-50/60 ring-1 ring-blue-200" :
                                    isYearly ? "border-amber-400 bg-amber-50/60 ring-1 ring-amber-200" :
                                    "border-paper-100 bg-white/60 hover:border-gold-200 hover:bg-gold-50/20",
                                    p.pos
                                  )}
                                >
                                  {/* Palace Header */}
                                  <div className="flex justify-between items-start z-10">
                                    <div className="flex items-center gap-0.5 leading-none">
                                      <span className="text-[9px] font-bold text-ink-900">{palace.gan}</span>
                                      <span className="text-[9px] font-bold text-ink-900">{palace.zhi}</span>
                                    </div>
                                    <div className="flex items-center gap-0.5">
                                      {isDecadal && <span className="text-[7px] bg-blue-500 text-white px-0.5 rounded leading-none font-bold">限</span>}
                                      {isYearly && <span className="text-[7px] bg-amber-500 text-white px-0.5 rounded leading-none font-bold">流</span>}
                                      <span className={cn(
                                        "text-[9px] font-bold transition-colors px-0.5 rounded leading-none",
                                        isSelected ? "bg-gold-600 text-white" : "text-gold-600 group-hover:text-gold-700"
                                      )}>{palace.name}</span>
                                    </div>
                                  </div>

                                <div className="flex-1 flex justify-between gap-0.5 py-0.5 min-h-0 relative z-10">
                                  {/* Left: Minor Stars */}
                                  <div className="flex flex-row-reverse items-start gap-0.5 overflow-hidden">
                                    {palace.minorStars.map((star, sIdx) => {
                                      const t = star.transformation ? getTransformationStyle(star.transformation) : null;
                                      return (
                                        <div key={sIdx} className="flex flex-col items-center">
                                          {t && <span className={cn("text-[7px] font-bold leading-none", t.cls)}>{t.char}</span>}
                                          <span
                                            className={cn("text-[9px] font-medium leading-tight text-center", getBrightnessColor(star.brightness))}
                                            style={{ writingMode: 'vertical-rl' }}
                                          >
                                            {star.name}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* Right: Major Stars */}
                                  <div className="flex flex-row-reverse items-start gap-0.5 overflow-hidden">
                                    {palace.majorStars.map((star, sIdx) => {
                                      const t = star.transformation ? getTransformationStyle(star.transformation) : null;
                                      return (
                                        <div key={sIdx} className="flex flex-col items-center">
                                          {t && <span className={cn("text-[8px] font-bold leading-none", t.cls)}>{t.char}</span>}
                                          <span
                                            className={cn(
                                              "text-xs font-serif font-bold leading-tight text-center tracking-tighter",
                                              getBrightnessColor(star.brightness)
                                            )}
                                            style={{ writingMode: 'vertical-rl' }}
                                          >
                                            {star.name}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                  {/* Palace Footer */}
                                  <div className="flex justify-between items-end z-10">
                                    <div className="flex gap-0.5">
                                      {palace.yearlyStars.length > 0 && <span className="text-[7px] text-emerald-700 font-bold bg-emerald-50 px-0.5 rounded leading-none">流</span>}
                                      {palace.decadalStars.length > 0 && <span className="text-[7px] text-blue-700 font-bold bg-blue-50 px-0.5 rounded leading-none">大</span>}
                                    </div>
                                    {(palace as any).decadal?.range?.length > 0 && (
                                      <span className="text-[7px] text-ink-400 leading-none">
                                        {(palace as any).decadal.range[0]}~{(palace as any).decadal.range[1]}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          {/* Center cell */}
                          <div className="col-span-2 row-span-2 col-start-2 row-start-2 bg-paper-50/80 rounded-xl flex flex-col items-center justify-center text-center gap-2 p-2">
                            <div className="w-8 h-px bg-paper-200" />
                            <p className="text-[9px] text-ink-400 uppercase tracking-[0.15em] font-bold">命 · 身</p>
                            <div className="space-y-0.5">
                              <p className="text-xs font-serif text-ink-700 font-bold">{fateData.ziwei.lifeMaster}</p>
                              <p className="text-xs text-ink-400">·</p>
                              <p className="text-xs font-serif text-ink-700 font-bold">{fateData.ziwei.bodyMaster}</p>
                            </div>
                            <div className="w-8 h-px bg-paper-200" />
                            {selectedPalace !== null && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mt-1 space-y-1"
                              >
                                <p className="text-[8px] uppercase tracking-widest text-emerald-500 font-bold">三合</p>
                                {fateData.ziwei.palaces[selectedPalace].sanFang.map((n, i) => (
                                  <p key={i} className="text-[9px] text-emerald-700 font-serif">{n}</p>
                                ))}
                                <p className="text-[8px] uppercase tracking-widest text-blue-400 font-bold mt-1">对冲</p>
                                <p className="text-[9px] text-blue-700 font-serif">{fateData.ziwei.palaces[selectedPalace].siZheng}</p>
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Palace Detail Section */}
                      {/* Ziwei 大运/流年 Section */}
                      {/* 大限流年 全览 — 文墨天机风格 */}
                      <div className="space-y-6">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                          <h3 className="text-[9px] font-bold text-ink-400 uppercase tracking-[0.2em]">大限一览 / DECADAL PERIODS</h3>
                          {fateData.ziwei.decadal && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold">
                              当前大限：{fateData.ziwei.decadal.gan}{fateData.ziwei.decadal.zhi} {fateData.ziwei.decadal.name}宫 {fateData.ziwei.decadal.range[0]}～{fateData.ziwei.decadal.range[1]}岁
                            </span>
                          )}
                        </div>

                        {/* 大限表格 */}
                        <div className="overflow-x-auto rounded-xl border border-paper-200">
                          <table className="w-full border-collapse text-xs">
                            <thead>
                              <tr className="bg-paper-50 border-b border-paper-200">
                                <th className="p-3 text-[9px] font-bold text-ink-400 uppercase tracking-widest text-left">宫位</th>
                                <th className="p-3 text-[9px] font-bold text-ink-400 uppercase tracking-widest">大限干支</th>
                                <th className="p-3 text-[9px] font-bold text-ink-400 uppercase tracking-widest">年龄段</th>
                                <th className="p-3 text-[9px] font-bold text-ink-400 uppercase tracking-widest text-left hidden md:table-cell">主星</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[...fateData.ziwei.palaces]
                                .filter((p: any) => Array.isArray(p.decadal?.range) && p.decadal.range.length > 0)
                                .sort((a: any, b: any) => (a.decadal.range[0] ?? 99) - (b.decadal.range[0] ?? 99))
                                .map((palace: any, i: number) => {
                                  const isCurrent = fateData.ziwei.decadal?.name === palace.name;
                                  return (
                                    <tr key={i} className={cn(
                                      "border-b border-paper-100 last:border-0 transition-colors",
                                      isCurrent ? "bg-blue-50" : "hover:bg-paper-50"
                                    )}>
                                      <td className="p-3">
                                        <div className="flex items-center gap-2">
                                          {isCurrent && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />}
                                          <span className={cn("font-serif font-bold", isCurrent ? "text-blue-800" : "text-ink-800")}>
                                            {palace.name}宫
                                          </span>
                                        </div>
                                      </td>
                                      <td className="p-3 text-center">
                                        <span className={cn("font-serif font-bold text-sm", isCurrent ? "text-blue-700" : "text-ink-700")}>
                                          {palace.decadal?.heavenlyStem}{palace.decadal?.earthlyBranch}
                                        </span>
                                      </td>
                                      <td className="p-3 text-center">
                                        <span className={cn("text-[10px]", isCurrent ? "text-blue-600 font-bold" : "text-ink-500")}>
                                          {palace.decadal?.range?.[0]}～{palace.decadal?.range?.[1]}岁
                                        </span>
                                      </td>
                                      <td className="p-3 hidden md:table-cell">
                                        <div className="flex flex-wrap gap-1">
                                          {palace.majorStars.slice(0, 3).map((s: any, si: number) => (
                                            <span key={si} className={cn(
                                              "text-[9px] px-1.5 py-0.5 rounded font-medium",
                                              isCurrent ? "bg-blue-100 text-blue-700" : "bg-paper-100 text-ink-600"
                                            )}>{s.name}</span>
                                          ))}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </table>
                        </div>

                        {/* 当前大限详情 + 流年 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {fateData.ziwei.decadal && (
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5 space-y-3">
                              <p className="text-[9px] uppercase tracking-widest text-blue-500 font-bold">当前大限 / CURRENT DECADAL</p>
                              <div className="flex items-baseline gap-3">
                                <span className="text-2xl font-serif font-bold text-blue-800">{fateData.ziwei.decadal.gan}{fateData.ziwei.decadal.zhi}</span>
                                <span className="text-lg font-serif text-blue-700">{fateData.ziwei.decadal.name}宫</span>
                                <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold">
                                  {fateData.ziwei.decadal.range[0]}～{fateData.ziwei.decadal.range[1]}岁
                                </span>
                              </div>
                              {fateData.ziwei.decadal.stars && fateData.ziwei.decadal.stars.length >= 4 && (
                                <div className="space-y-1">
                                  <p className="text-[8px] uppercase tracking-widest text-blue-400 font-bold">大限四化</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {[
                                      { type: '化禄', cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
                                      { type: '化权', cls: 'bg-red-50 text-red-700 border-red-200' },
                                      { type: '化科', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
                                      { type: '化忌', cls: 'bg-gray-100 text-gray-700 border-gray-300' },
                                    ].map(({ type, cls }, si) => (
                                      <span key={si} className={cn("text-[10px] px-2 py-0.5 rounded border font-bold", cls)}>
                                        {fateData.ziwei.decadal!.stars[si]}{type}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          {fateData.ziwei.yearly && (
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-5 space-y-3">
                              <div className="flex items-center justify-between">
                                <p className="text-[9px] uppercase tracking-widest text-amber-500 font-bold">流年 / YEARLY FORTUNE</p>
                                <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  {fateData.ziwei.yearly.year}年 · {new Date().getFullYear() - birthInfo.year + 1}岁
                                </span>
                              </div>
                              <div className="flex items-baseline gap-3">
                                <span className="text-2xl font-serif font-bold text-amber-800">{fateData.ziwei.yearly.gan}{fateData.ziwei.yearly.zhi}</span>
                                <span className="text-lg font-serif text-amber-700">{fateData.ziwei.yearly.name}宫</span>
                              </div>
                              {fateData.ziwei.yearly.stars && fateData.ziwei.yearly.stars.length >= 4 && (
                                <div className="space-y-1">
                                  <p className="text-[8px] uppercase tracking-widest text-amber-400 font-bold">流年四化</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {[
                                      { type: '化禄', cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
                                      { type: '化权', cls: 'bg-red-50 text-red-700 border-red-200' },
                                      { type: '化科', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
                                      { type: '化忌', cls: 'bg-gray-100 text-gray-700 border-gray-300' },
                                    ].map(({ type, cls }, si) => (
                                      <span key={si} className={cn("text-[10px] px-2 py-0.5 rounded border font-bold", cls)}>
                                        {fateData.ziwei.yearly!.stars[si]}{type}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

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
                                {fateData.ziwei.palaces[selectedPalace].majorStars.map((s, i) => {
                                  const t = s.transformation ? getTransformationStyle(s.transformation) : null;
                                  return (
                                    <div key={i} className="flex items-center justify-between p-3 bg-red-50/30 rounded-xl border border-red-100/50">
                                      <div className="flex items-center gap-2">
                                        <span className={cn("text-sm font-bold", getBrightnessColor(s.brightness))}>{s.name}</span>
                                        {t && <span className={cn("px-1.5 py-0.5 text-[8px] font-bold rounded border", t.cls, 'border-current bg-white/80')}>{s.transformation}</span>}
                                      </div>
                                      <span className={cn("text-[10px] font-bold", getBrightnessColor(s.brightness))}>{s.brightness || '—'}</span>
                                    </div>
                                  );
                                })}
                                {fateData.ziwei.palaces[selectedPalace].minorStars.map((s, i) => {
                                  const t = s.transformation ? getTransformationStyle(s.transformation) : null;
                                  return (
                                    <div key={i} className="flex items-center justify-between p-3 bg-paper-50 rounded-xl border border-paper-100">
                                      <div className="flex items-center gap-2">
                                        <span className={cn("text-sm font-medium", getBrightnessColor(s.brightness))}>{s.name}</span>
                                        {t && <span className={cn("px-1.5 py-0.5 text-[8px] font-bold rounded border", t.cls, 'border-current bg-white/80')}>{s.transformation}</span>}
                                      </div>
                                      <span className={cn("text-[10px] font-bold", getBrightnessColor(s.brightness))}>{s.brightness || '—'}</span>
                                    </div>
                                  );
                                })}
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

                  {activeTab === 'western' && fateData.western && (() => {
                    const SIGNS_ZH = ['白羊', '金牛', '双子', '巨蟹', '狮子', '处女', '天秤', '天蝎', '射手', '摩羯', '水瓶', '双鱼'];
                    const PLANET_ICONS: Record<string, string> = {
                      '太阳': '☉', '月亮': '☽', '水星': '☿', '金星': '♀', '火星': '♂',
                      '木星': '♃', '土星': '♄', '天王星': '♅', '海王星': '♆', '冥王星': '♇'
                    };
                    const getPlanetSign = (lon: number) => {
                      const idx = Math.floor(((lon % 360) + 360) % 360 / 30);
                      const deg = ((lon % 360) + 360) % 360 % 30;
                      return { sign: SIGNS_ZH[idx], deg: deg.toFixed(1) };
                    };
                    return (
                      <div className="space-y-8">
                        {/* Sun sign hero */}
                        <div className="flex items-center gap-6 p-6 bg-gradient-to-r from-amber-50 to-gold-50 border border-gold-100 rounded-2xl">
                          <div className="w-16 h-16 rounded-full bg-gold-100 flex items-center justify-center text-3xl">☉</div>
                          <div>
                            <p className="text-[9px] uppercase tracking-widest text-amber-600 font-bold">太阳星座 / SUN SIGN</p>
                            <p className="text-3xl font-serif text-ink-900">{fateData.western.sunSign}座</p>
                            <p className="text-xs text-ink-500 mt-1">代表核心自我与生命意志</p>
                          </div>
                        </div>

                        {/* Planet positions grid */}
                        <div className="space-y-3">
                          <h4 className="text-[9px] font-bold text-ink-400 uppercase tracking-[0.2em]">行星位置 / PLANET POSITIONS</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                            {fateData.western.planetPositions?.map((p: any, i: number) => {
                              const { sign, deg } = getPlanetSign(p.longitude);
                              return (
                                <div key={i} className="bg-white border border-paper-200 rounded-xl p-3 space-y-1 text-center hover:border-gold-300 transition-colors">
                                  <p className="text-2xl">{PLANET_ICONS[p.name] || '★'}</p>
                                  <p className="text-xs font-bold text-ink-700">{p.name}</p>
                                  <p className="text-sm font-serif text-ink-900">{sign}座</p>
                                  <p className="text-[9px] text-ink-400">{deg}°</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Aspects */}
                        <div className="space-y-3">
                          <h4 className="text-[9px] font-bold text-ink-400 uppercase tracking-[0.2em]">核心相位 / MAJOR ASPECTS</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {fateData.western.aspects.map((aspect: any, i: number) => (
                              <div key={i} className="p-4 bg-paper-50 border border-paper-200 rounded-xl space-y-1 hover:border-gold-300 transition-colors">
                                <p className="text-sm font-bold text-ink-900">{aspect.name}</p>
                                <p className="text-xs text-ink-500 leading-relaxed">{aspect.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

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
                                setStructuredAnalysis(record.fateData.bazi ? getStructuredAnalysis(record.fateData.bazi) : null);
                                setAiReport(null);
                                setStep('dashboard');
                                setSelectedPalace(null);
                                setActiveTab(Object.keys(record.fateData).find(k => record.fateData[k] && ['bazi','ziwei','western','mbti'].includes(k)) || 'bazi');
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
                      disabled={isUnlockingAi}
                      className="w-full group relative bg-violet-800 hover:bg-violet-900 text-white px-12 py-4 rounded-full font-semibold tracking-wide transition-all shadow-lg shadow-violet-800/30 flex items-center justify-center gap-3 overflow-hidden"
                    >
                      {isUnlockingAi ? (
                        <div className="relative flex items-center gap-3 z-20">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span className="font-semibold tracking-wide">大师解读中 {Math.round(aiProgress)}%</span>
                        </div>
                      ) : (
                        <div className="relative flex items-center gap-3 z-20">
                          <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
                          <span className="text-white font-semibold tracking-wide">开启深度解读 ({aiDepth === 'deep' ? '100' : '20'}积分)</span>
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
              {aiReport !== null && (
                <motion.section
                  ref={aiReportRef}
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
                          const bazi = fateData.bazi;
                          const sa = structuredAnalysis;
                          const lines = [
                            `✦ ${birthInfo.name} 命理摘要`,
                            `出生：${birthInfo.year}年${birthInfo.month}月${birthInfo.day}日 ${birthInfo.hour}时 | ${birthInfo.gender === 'male' ? '男' : '女'}`,
                            bazi ? `四柱：${bazi.pillars.year.gan}${bazi.pillars.year.zhi} ${bazi.pillars.month.gan}${bazi.pillars.month.zhi} ${bazi.pillars.day.gan}${bazi.pillars.day.zhi} ${bazi.pillars.hour.gan}${bazi.pillars.hour.zhi}` : '',
                            sa ? `格局：${sa.pattern.name} | 日主：${sa.dayMaster.gan}（${sa.strength.level}）` : '',
                            sa ? `用神 ${sa.xiYongShen.yongShen} · 喜神 ${sa.xiYongShen.xiShen} · 忌神 ${sa.xiYongShen.jiShen}` : '',
                            fateData.ziwei ? `紫微命宫：${fateData.ziwei.palaces?.find((p: any) => p.name === '命宫')?.majorStars?.map((s: any) => s.name).join('') || '—'}` : '',
                            aiReport ? `\n— AI大师解读摘要 —\n${aiReport.substring(0, 200)}...` : '',
                            `\n由 悬壶承光 生成`
                          ].filter(Boolean).join('\n');
                          try {
                            await navigator.clipboard.writeText(lines);
                            setShowShareToast(true);
                            setTimeout(() => setShowShareToast(false), 2500);
                          } catch {
                            if (navigator.share) navigator.share({ title: `${birthInfo.name}的命理摘要`, text: lines });
                          }
                        }}
                        className="p-2 rounded-full hover:bg-paper-50 text-ink-400 transition-colors"
                        title="复制命盘摘要"
                      >
                        <Share2 size={20} />
                      </button>
                    </div>
                  </div>
                  <div className="prose prose-stone max-w-none">
                    {aiReport === '' && isUnlockingAi ? (
                      <div className="flex items-center gap-3 py-8 text-ink-400">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-gold-400 rounded-full animate-bounce" />
                          <span className="w-1.5 h-1.5 bg-gold-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                          <span className="w-1.5 h-1.5 bg-gold-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                        <span className="text-xs italic">大师正在观星盘、查典籍...</span>
                      </div>
                    ) : (
                      <div className="text-ink-700 font-light leading-loose markdown-content">
                        <ReactMarkdown>{aiReport ?? ''}</ReactMarkdown>
                        {isUnlockingAi && <span className="inline-block w-0.5 h-4 bg-ink-400 animate-pulse ml-0.5 align-middle" />}
                      </div>
                    )}
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
                <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-left hover:text-ink-900 transition-colors">关于我们 / ABOUT</button>
                <button onClick={() => setStep('input')} className="text-left hover:text-ink-900 transition-colors">开始测算 / START</button>
                <span className="text-ink-300 cursor-default">隐私政策 / PRIVACY</span>
                <span className="text-ink-300 cursor-default">使用条款 / TERMS</span>
              </nav>
            </div>
            <div className="space-y-8">
              <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-ink-900">联系我们 / CONTACT</h4>
              <div className="space-y-4">
                <p className="text-sm text-ink-400 font-light">support@xuanhuchengguang.online</p>
                <div className="flex gap-4 text-ink-300">
                  <Globe size={18} className="hover:text-ink-900 cursor-pointer transition-colors" />
                  <History size={18} className="hover:text-ink-900 cursor-pointer transition-colors" />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-24 pt-8 border-t border-paper-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[10px] text-ink-300 uppercase tracking-[0.2em]">© {new Date().getFullYear()} 悬壶承光. All rights reserved.</p>
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
      <AnimatePresence>
        {showShareToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-emerald-800 text-paper-50 px-8 py-4 rounded-full shadow-2xl z-50 flex items-center gap-3"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            <span className="text-sm font-medium tracking-wide">命盘摘要已复制到剪贴板</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 登录弹窗 */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => {
          setShowLoginModal(false);
          const u = getCurrentUser();
          if (u) { setIsLoggedIn(true); setUser(u); loadHistory(); }
          refreshPoints();
        }}
      />

      {/* 支付弹窗 */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={(amount) => {
          setShowPaymentModal(false);
          refreshPoints();
          setShowSuccessToast(true);
        }}
      />
    </div>
    </ErrorBoundary>
  );
}
