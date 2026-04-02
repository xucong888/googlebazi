import React, { useState } from 'react';
import { X, Coins, CreditCard, Gift, CheckCircle2, Star } from 'lucide-react';
import { POINT_PACKAGES, MEMBERSHIP_PACKAGES } from './pointConfig';
import { usePoints } from './PointsContext';

interface PointsStoreProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PointsStore: React.FC<PointsStoreProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'points' | 'membership'>('points');
  const [isProcessing, setIsProcessing] = useState(false);
  const { points, dailyCheckIn, addPoints } = usePoints();

  if (!isOpen) return null;

  const handlePurchase = async (packageId: string) => {
    setIsProcessing(true);
    // TODO: 调用支付接口
    // 模拟支付成功
    setTimeout(() => {
      setIsProcessing(false);
      alert('支付功能需要接入微信支付/支付宝');
    }, 1000);
  };

  const handleCheckIn = async () => {
    const result = await dailyCheckIn();
    alert(result.message);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <X size={20} />
        </button>

        <div className="overflow-y-auto max-h-[90vh]">
          {/* 头部 - 当前积分 */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm mb-1">我的积分</p>
                <div className="flex items-center gap-2">
                  <Coins size={32} className="text-amber-200" />
                  <span className="text-4xl font-bold">{points}</span>
                </div>
              </div>
              <button
                onClick={handleCheckIn}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
              >
                <Gift size={16} className="inline mr-1" />
                每日签到
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* 标签切换 */}
            <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => setActiveTab('points')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  activeTab === 'points'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Coins size={16} className="inline mr-1" />
                购买积分
              </button>
              <button
                onClick={() => setActiveTab('membership')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  activeTab === 'membership'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Star size={16} className="inline mr-1" />
                会员套餐
              </button>
            </div>

            {/* 积分套餐 */}
            {activeTab === 'points' && (
              <div className="grid grid-cols-2 gap-4">
                {POINT_PACKAGES.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="border border-gray-200 rounded-xl p-4 hover:border-amber-400 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{pkg.name}</h3>
                      {pkg.discount && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">
                          {pkg.discount}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-2xl font-bold text-amber-600">{pkg.points}</span>
                      <span className="text-sm text-gray-500">积分</span>
                      {pkg.bonus && (
                        <span className="text-xs text-green-600">+{pkg.bonus}赠送</span>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-500 mb-3">{pkg.description}</p>
                    
                    <button
                      onClick={() => handlePurchase(pkg.id)}
                      disabled={isProcessing}
                      className="w-full py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                      ¥{pkg.price}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 会员套餐 */}
            {activeTab === 'membership' && (
              <div className="space-y-4">
                {MEMBERSHIP_PACKAGES.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`border-2 rounded-xl p-5 relative ${
                      pkg.popular 
                        ? 'border-amber-400 bg-amber-50' 
                        : 'border-gray-200'
                    }`}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-3 left-4 px-3 py-1 bg-amber-500 text-white text-xs font-medium rounded-full">
                        最受欢迎
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-medium">{pkg.name}</h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-amber-600">¥{pkg.price}</span>
                        <span className="text-sm text-gray-500">/{pkg.duration === 30 ? '月' : '年'}</span>
                      </div>
                    </div>
                    
                    <ul className="space-y-2 mb-4">
                      {pkg.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle2 size={16} className="text-green-500" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                    
                    <button
                      onClick={() => handlePurchase(pkg.id)}
                      disabled={isProcessing}
                      className={`w-full py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                        pkg.popular
                          ? 'bg-amber-500 text-white hover:bg-amber-600'
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                      }`}
                    >
                      立即开通
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 积分说明 */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium mb-2">积分使用说明</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• 八字排盘、紫微斗数：免费</li>
                <li>• AI 快速解读：20 积分/次</li>
                <li>• AI 深度解读：100 积分/次</li>
                <li>• 与大师对话：10 积分/条</li>
                <li>• 积分有效期：365 天</li>
              </ul>
              <p className="text-xs text-gray-500 mt-2 italic">
                更多功能（流年运势、合婚匹配等）即将上线
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
