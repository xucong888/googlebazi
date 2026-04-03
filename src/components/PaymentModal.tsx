import React, { useState } from 'react';
import { X, Loader2, CheckCircle } from 'lucide-react';
import { POINT_PACKAGES, MEMBERSHIP_PACKAGES } from '../points';
import { auth, db } from '../firebase';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (amount: number) => void;
}

type PaymentTab = 'points' | 'membership';

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<PaymentTab>('points');
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handlePayment = async () => {
    if (!selectedPackage) {
      setError('请选择套餐');
      return;
    }

    if (!auth.currentUser) {
      setError('请先登录');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // 获取选中套餐的信息
      const pkg = activeTab === 'points' 
        ? POINT_PACKAGES.find(p => p.id === selectedPackage)
        : MEMBERSHIP_PACKAGES.find(p => p.id === selectedPackage);

      if (!pkg) {
        throw new Error('套餐不存在');
      }

      // 调用支付 API
      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: selectedPackage,
          packageType: activeTab,
          userId: auth.currentUser.uid,
          amount: pkg.price,
          description: pkg.name
        })
      });

      const data = await response.json();

      if (data.success) {
        // 模拟支付成功（实际应该跳转到支付页面或调起支付 SDK）
        setSuccess(true);
        onSuccess(pkg.points || 0);
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 2000);
      } else {
        throw new Error(data.message || '支付创建失败');
      }
    } catch (err: any) {
      setError(err.message || '支付失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900">支付成功！</h3>
          <p className="text-gray-600 mt-2">积分已到账</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-6">
          <h2 className="text-2xl font-serif text-center mb-6">充值中心</h2>

          {/* 标签切换 */}
          <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => { setActiveTab('points'); setSelectedPackage(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'points'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              积分充值
            </button>
            <button
              onClick={() => { setActiveTab('membership'); setSelectedPackage(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'membership'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              会员套餐
            </button>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* 积分套餐 */}
          {activeTab === 'points' && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              {POINT_PACKAGES.map((pkg) => (
                <button
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg.id)}
                  className={`p-4 border-2 rounded-xl text-left transition-all ${
                    selectedPackage === pkg.id
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-gray-200 hover:border-amber-300'
                  }`}
                >
                  <div className="text-2xl font-bold text-gray-900">{pkg.points}</div>
                  <div className="text-sm text-gray-500">积分</div>
                  <div className="mt-2 text-lg font-medium text-amber-600">¥{pkg.price}</div>
                  {pkg.bonus > 0 && (
                    <div className="text-xs text-green-600 mt-1">赠 {pkg.bonus} 积分</div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* 会员套餐 */}
          {activeTab === 'membership' && (
            <div className="space-y-4 mb-6">
              {MEMBERSHIP_PACKAGES.map((pkg) => (
                <button
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg.id)}
                  className={`w-full p-4 border-2 rounded-xl text-left transition-all ${
                    selectedPackage === pkg.id
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-gray-200 hover:border-amber-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-lg font-bold text-gray-900">{pkg.name}</div>
                      <div className="text-sm text-gray-500 mt-1">{pkg.duration}个月</div>
                    </div>
                    <div className="text-xl font-medium text-amber-600">¥{pkg.price}</div>
                  </div>
                  <div className="text-xs text-green-600 mt-2">包含 {pkg.points} 积分</div>
                </button>
              ))}
            </div>
          )}

          {/* 支付按钮 */}
          <button
            onClick={handlePayment}
            disabled={isLoading || !selectedPackage}
            className="w-full py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 size={18} className="animate-spin" />}
            {selectedPackage ? '立即支付' : '请选择套餐'}
          </button>

          <p className="text-xs text-gray-400 text-center mt-4">
            支付即表示同意服务条款
          </p>
        </div>
      </div>
    </div>
  );
};