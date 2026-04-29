// 支付服务 - 集成支付宝/微信支付（待开发）
import { getCurrentUser } from '../api';

export const createPaymentOrder = async (
  packageId: string,
  packageType: 'points' | 'membership',
  amount: number,
  description: string
) => {
  const user = getCurrentUser();
  if (!user) throw new Error('请先登录');

  const orderId = `ORDER${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
  return {
    success: true,
    orderId,
    paymentUrl: `/payment/${orderId}`,
    qrCode: null,
  };
};

export const checkOrderStatus = async (_orderId: string) => {
  return { status: 'success' };
};

export const handlePaymentCallback = async (orderId: string, paymentData: any) => {
  console.log('Payment callback:', orderId, paymentData);
};
