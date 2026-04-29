import React, { useState } from 'react';
import { X, Mail, Eye, EyeOff, Loader2 } from 'lucide-react';
import { loginWithEmail, registerWithEmail } from '../api';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type AuthMode = 'login' | 'register';

const friendlyError = (err: any): string => {
  const code: string = err?.code || '';
  const map: Record<string, string> = {
    'api/401': err?.message || '邮箱或密码错误',
    'api/409': err?.message || '该邮箱已注册，请直接登录',
    'api/400': err?.message || '输入信息有误，请检查后重试',
  };
  return map[code] || err?.message || '操作失败，请重试';
};

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
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
      setError(friendlyError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
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

          <div className="flex items-center justify-center gap-2 mb-6 text-sm text-gray-500">
            <Mail size={16} />
            <span>邮箱登录</span>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="请输入密码（至少6位）"
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

          <div className="mt-6 text-center text-sm">
            {authMode === 'login' ? (
              <p className="text-gray-600">
                还没有账户？
                <button
                  onClick={() => { setAuthMode('register'); setError(''); }}
                  className="text-amber-600 hover:text-amber-700 font-medium ml-1"
                >
                  立即注册
                </button>
              </p>
            ) : (
              <p className="text-gray-600">
                已有账户？
                <button
                  onClick={() => { setAuthMode('login'); setError(''); }}
                  className="text-amber-600 hover:text-amber-700 font-medium ml-1"
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
