import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle, Coins, Loader2, AlertCircle } from 'lucide-react';
import { POINT_PACKAGES, MEMBERSHIP_PACKAGES } from '../points';
import { usePoints } from '../points';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (amount: number) => void;
}

type PaymentTab = 'points' | 'membership';
type PayStep = 'select' | 'paying' | 'done' | 'error';

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<PaymentTab>('points');
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [payStep, setPayStep] = useState<PayStep>('select');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { points, refreshPoints } = usePoints();

  useEffect(() => {
    if (!isOpen) {
      setPayStep('select');
      setSelectedPackage(null);
      setErrorMsg('');
      setOrderId(null);
      if (pollRef.current) clearInterval(pollRef.current);
    }
  }, [isOpen]);

  const pollOrderStatus = (oid: string, totalPoints: number) => {
    let tries = 0;
    pollRef.current = setInterval(async () => {
      tries++;
      try {
        const token = localStorage.getItem('jwt_token');
        const r = await fetch(`/api/payment/status/${oid}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await r.json();
        if (data.status === 'paid') {
          clearInterval(pollRef.current!);
          await refreshPoints();
          setPayStep('done');
          onSuccess(totalPoints);
        } else if (tries >= 60) {
          clearInterval(pollRef.current!);
          setErrorMsg('支付超时，如已付款请联系客服核实');
          setPayStep('error');
        }
      } catch {}
    }, 3000);
  };

  const handlePay = async () => {
    if (!selectedPackage) return;
    const pkg = POINT_PACKAGES.find(p => p.id === selectedPackage);
    if (!pkg) return;

    setIsLoading(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('jwt_token');
      const r = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ packageId: selectedPackage }),
      });
      const data = await r.json();
      if (!r.ok || !data.payUrl) {
        setErrorMsg(data.error || '创建订单失败，请稍后重试');
        setPayStep('error');
        return;
      }
      setOrderId(data.orderId);
      window.open(data.payUrl, '_blank');
      setPayStep('paying');
      const totalPoints = pkg.points + (pkg.bonus || 0);
      pollOrderStatus(data.orderId, totalPoints);
    } catch {
      setErrorMsg('网络错误，请稍后重试');
      setPayStep('error');
    } finally {
      setIsLoading(false);
    }
  };

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
          <p className="text-center text-sm text-gray-400 mb-6">
            当前积分：<span className="font-bold text-amber-600">{points}</span>
          </p>

          {/* 支付成功 */}
          {payStep === 'done' && (
            <div className="text-center py-8">
              <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
              <p className="text-lg font-bold text-gray-900 mb-1">支付成功</p>
              <p className="text-sm text-gray-500 mb-6">积分已到账，可立即使用</p>
              <button
                onClick={onClose}
                className="px-8 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                好的
              </button>
            </div>
          )}

          {/* 等待支付 */}
          {payStep === 'paying' && (
            <div className="text-center py-8">
              <Loader2 size={40} className="text-amber-500 mx-auto mb-3 animate-spin" />
              <p className="text-lg font-bold text-gray-900 mb-1">等待支付确认</p>
              <p className="text-sm text-gray-500 mb-2">请在新窗口完成支付，完成后此页面自动更新</p>
              <p className="text-xs text-gray-400 mb-6">如果支付窗口未打开，请检查浏览器是否拦截了弹窗</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => { if (orderId) { const pkg = POINT_PACKAGES.find(p => p.id === selectedPackage); pollOrderStatus(orderId, (pkg?.points || 0) + (pkg?.bonus || 0)); }}}
                  className="px-5 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                >
                  我已完成支付
                </button>
                <button
                  onClick={() => { if (pollRef.current) clearInterval(pollRef.current); setPayStep('select'); }}
                  className="px-5 py-2 text-gray-400 text-sm hover:text-gray-600 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          )}

          {/* 错误 */}
          {payStep === 'error' && (
            <div className="text-center py-8">
              <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
              <p className="text-sm text-red-500 mb-6">{errorMsg}</p>
              <button
                onClick={() => setPayStep('select')}
                className="px-8 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                重新选择
              </button>
            </div>
          )}

          {/* 套餐选择 */}
          {payStep === 'select' && (
            <>
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
                      {(pkg as any).discount && <div className="text-xs text-green-600 mt-1">{(pkg as any).discount}</div>}
                    </button>
                  ))}
                </div>
              )}

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
                  <p className="text-xs text-center text-gray-400">会员套餐即将开放，敬请期待</p>
                </div>
              )}

              <button
                onClick={handlePay}
                disabled={!selectedPkg || isLoading || activeTab === 'membership'}
                className="w-full py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                {isLoading && <Loader2 size={16} className="animate-spin" />}
                {selectedPkg
                  ? activeTab === 'membership' ? '会员功能即将开放' : `支付宝付款 ¥${selectedPkg.price}`
                  : '请先选择套餐'}
              </button>

              <p className="text-xs text-gray-400 text-center mt-3">
                支付即表示同意服务条款与隐私政策 · 由虎皮椒支付提供服务
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
