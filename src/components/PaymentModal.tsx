import React, { useState } from 'react';
import { X, CheckCircle, Coins, Sparkles, Clock } from 'lucide-react';
import { POINT_PACKAGES, MEMBERSHIP_PACKAGES } from '../points';
import { usePoints } from '../points';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (amount: number) => void;
}

type PaymentTab = 'points' | 'membership';

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<PaymentTab>('points');
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const { points, addPoints } = usePoints();

  if (!isOpen) return null;

  const selectedPkg = activeTab === 'points'
    ? POINT_PACKAGES.find(p => p.id === selectedPackage)
    : MEMBERSHIP_PACKAGES.find(p => p.id === selectedPackage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <X size={20} />
        </button>

        <div className="p-6">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Coins size={20} className="text-amber-500" />
            <h2 className="text-2xl font-serif text-center">充值中心</h2>
          </div>
          <p className="text-center text-sm text-gray-400 mb-6">当前积分：<span className="font-bold text-amber-600">{points}</span></p>

          {/* 标签切换 */}
          <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => { setActiveTab('points'); setSelectedPackage(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'points' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              积分充值
            </button>
            <button
              onClick={() => { setActiveTab('membership'); setSelectedPackage(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'membership' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              会员套餐
            </button>
          </div>

          {/* 积分套餐 */}
          {activeTab === 'points' && (
            <div className="grid grid-cols-2 gap-3 mb-6">
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
                  <div className="text-2xl font-bold text-gray-900">{pkg.points + (pkg.bonus || 0)}</div>
                  <div className="text-xs text-gray-400">积分{pkg.bonus > 0 ? `（含赠 ${pkg.bonus}）` : ''}</div>
                  <div className="mt-2 text-lg font-medium text-amber-600">¥{pkg.price}</div>
                  {pkg.discount && <div className="text-xs text-green-600 mt-1">{pkg.discount}</div>}
                </button>
              ))}
            </div>
          )}

          {/* 会员套餐 */}
          {activeTab === 'membership' && (
            <div className="space-y-3 mb-6">
              {MEMBERSHIP_PACKAGES.map((pkg) => (
                <button
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg.id)}
                  className={`w-full p-4 border-2 rounded-xl text-left transition-all relative ${
                    selectedPackage === pkg.id
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-gray-200 hover:border-amber-300'
                  }`}
                >
                  {(pkg as any).popular && (
                    <span className="absolute top-3 right-3 text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full">推荐</span>
                  )}
                  <div className="flex justify-between items-start pr-12">
                    <div>
                      <div className="text-lg font-bold text-gray-900">{pkg.name}</div>
                      <div className="text-sm text-gray-500 mt-0.5">{pkg.duration}个月</div>
                    </div>
                    <div className="text-xl font-medium text-amber-600">¥{pkg.price}</div>
                  </div>
                  <ul className="mt-2 space-y-0.5">
                    {pkg.benefits.map((b, i) => (
                      <li key={i} className="text-xs text-gray-500 flex items-center gap-1">
                        <CheckCircle size={10} className="text-green-500 flex-shrink-0" />{b}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
          )}

          {/* 支付方式 - 即将开放 */}
          <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/50 p-4 flex items-center gap-3 mb-4">
            <Clock size={18} className="text-amber-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">支付宝 / 微信支付 接入中</p>
              <p className="text-xs text-amber-600 mt-0.5">在线支付即将开放，敬请期待。目前新用户注册赠 100 积分。</p>
            </div>
          </div>

          <button
            disabled
            className="w-full py-3 bg-gray-200 text-gray-400 rounded-lg font-medium cursor-not-allowed flex items-center justify-center gap-2 text-sm"
          >
            <Sparkles size={16} />
            {selectedPkg ? `¥${selectedPkg.price} · 即将开放` : '选择套餐后支付'}
          </button>

          <p className="text-xs text-gray-400 text-center mt-3">
            支付即表示同意服务条款与隐私政策
          </p>
        </div>
      </div>
    </div>
  );
};
