// 积分消耗定价
export const POINT_COSTS = {
  // AI 解读（已开发）
  AI_QUICK: 20,           // AI 快速解读
  AI_DEEP: 100,           // AI 深度解读
  CHAT_MESSAGE: 10,       // 与大师对话（每条）
  
  // 增值服务（预留，待开发）
  YEARLY_FORTUNE: 30,     // 流年运势（单年）- 预留
  MARRIAGE_MATCH: 50,     // 合婚匹配 - 预留
  NAME_SERVICE: 50,       // 起名服务 - 预留
  DATE_SELECTION: 40,     // 择吉日 - 预留
} as const;

// 积分套餐
export const POINT_PACKAGES = [
  { 
    id: 'starter', 
    name: '体验包', 
    points: 100, 
    price: 10, 
    currency: 'CNY',
    bonus: 20,
    description: '适合初次体验'
  },
  { 
    id: 'basic', 
    name: '基础包', 
    points: 300, 
    price: 25, 
    currency: 'CNY',
    discount: '8.3折',
    description: '可深度解读 3 次'
  },
  { 
    id: 'standard', 
    name: '标准包', 
    points: 600, 
    price: 45, 
    currency: 'CNY',
    discount: '7.5折',
    bonus: 100,
    description: '赠送 1 次深度解读'
  },
  { 
    id: 'premium', 
    name: '尊享包', 
    points: 1500, 
    price: 100, 
    currency: 'CNY',
    discount: '6.7折',
    bonus: 300,
    description: '赠送 3 次深度解读'
  },
];

// 会员套餐
export const MEMBERSHIP_PACKAGES = [
  {
    id: 'monthly',
    name: '月度会员',
    duration: 30, // 天
    price: 28,
    currency: 'CNY',
    benefits: ['无限 AI 快速解读', '每日 3 次深度解读', '优先客服'],
  },
  {
    id: 'yearly',
    name: '年度会员',
    duration: 365,
    price: 198,
    currency: 'CNY',
    benefits: ['所有功能无限使用', '专属客服', '新功能优先体验', '8折购买实物商品'],
    popular: true,
  },
];

// 免费获取积分
export const FREE_POINTS = {
  REGISTER: 100,          // 注册奖励
  DAILY_CHECKIN: 5,       // 每日签到
  INVITE_FRIEND: 50,      // 邀请好友（邀请人）
  BE_INVITED: 30,         // 被邀请奖励
  COMPLETE_PROFILE: 50,   // 完善资料
  SHARE_DAILY_LIMIT: 3,   // 每日分享上限
  SHARE_PER_TIME: 10,     // 每次分享奖励
} as const;

// 积分有效期（天）
export const POINTS_EXPIRY_DAYS = 365;
