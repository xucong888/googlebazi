import React, { useState, useRef } from 'react';
import { X, Mail, Phone, Chrome, Eye, EyeOff, Loader2 } from 'lucide-react';
import { 
  loginWithEmail, 
  registerWithEmail, 
  loginWithGoogle,
  sendPhoneCode,
  verifyPhoneCode,
  createRecaptchaVerifier
} from './authService';
import { ConfirmationResult } from 'firebase/auth';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type LoginTab = 'email' | 'phone';
type AuthMode = 'login' | 'register';

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<LoginTab>('email');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // 邮箱表单
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // 手机号表单
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      if (authMode === 'login') {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password, name);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || '登录失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendCode = async () => {
    if (!phone) {
      setError('请输入手机号');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // 格式化手机号（添加 +86 前缀）
      const formattedPhone = phone.startsWith('+') ? phone : `+86${phone}`;
      const verifier = createRecaptchaVerifier('recaptcha-container');
      const confirmation = await sendPhoneCode(formattedPhone, verifier);
      setConfirmationResult(confirmation);
      setCodeSent(true);
    } catch (err: any) {
      setError(err.message || '发送验证码失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      await verifyPhoneCode(confirmationResult, verificationCode);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || '验证码错误');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      await loginWithGoogle();
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google 登录失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-8">
          <h2 className="text-2xl font-serif text-center mb-6">
            {authMode === 'login' ? '欢迎回来' : '创建账户'}
          </h2>

          {/* 标签切换 */}
          <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setActiveTab('email')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'email'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Mail size={16} className="inline mr-2" />
              邮箱
            </button>
            <button
              onClick={() => setActiveTab('phone')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'phone'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Phone size={16} className="inline mr-2" />
              手机号
            </button>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* 邮箱登录/注册表单 */}
          {activeTab === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              {authMode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="请输入姓名"
                    required
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="your@email.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="请输入密码"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading && <Loader2 size={18} className="animate-spin" />}
                {authMode === 'login' ? '登录' : '注册'}
              </button>
            </form>
          )}

          {/* 手机号登录表单 */}
          {activeTab === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="13800138000"
                    required
                    disabled={codeSent}
                  />
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={isLoading || codeSent}
                    className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {codeSent ? '已发送' : '获取验证码'}
                  </button>
                </div>
              </div>

              {codeSent && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">验证码</label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="请输入6位验证码"
                    required
                    maxLength={6}
                  />
                </div>
              )}

              <div id="recaptcha-container" ref={recaptchaContainerRef}></div>

              <button
                type="submit"
                disabled={isLoading || !codeSent}
                className="w-full py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading && <Loader2 size={18} className="animate-spin" />}
                登录
              </button>
            </form>
          )}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">或使用以下方式</span>
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="mt-4 w-full py-3 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <Chrome size={18} className="text-blue-500" />
              Google 登录
            </button>
          </div>

          <div className="mt-6 text-center text-sm">
            {authMode === 'login' ? (
              <p className="text-gray-600">
                还没有账户？
                <button
                  onClick={() => setAuthMode('register')}
                  className="text-amber-600 hover:text-amber-700 font-medium"
                >
                  立即注册
                </button>
              </p>
            ) : (
              <p className="text-gray-600">
                已有账户？
                <button
                  onClick={() => setAuthMode('login')}
                  className="text-amber-600 hover:text-amber-700 font-medium"
                >
                  立即登录
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
