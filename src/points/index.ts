// 积分消费 Hook
import { usePoints } from './PointsContext';
import { POINT_COSTS } from './pointConfig';

export const usePointConsumption = () => {
  const { usePoints: consumePoints, checkPoints } = usePoints();

  // AI 快速解读
  const consumeAIQuick = async () => {
    return await consumePoints(POINT_COSTS.AI_QUICK, 'AI 快速解读');
  };

  // AI 深度解读
  const consumeAIDeep = async () => {
    return await consumePoints(POINT_COSTS.AI_DEEP, 'AI 深度解读');
  };

  // 与大师对话
  const consumeChatMessage = async () => {
    return await consumePoints(POINT_COSTS.CHAT_MESSAGE, '与大师对话');
  };

  // 流年运势
  const consumeYearlyFortune = async () => {
    return await consumePoints(POINT_COSTS.YEARLY_FORTUNE, '流年运势');
  };

  // 合婚匹配
  const consumeMarriageMatch = async () => {
    return await consumePoints(POINT_COSTS.MARRIAGE_MATCH, '合婚匹配');
  };

  // 检查是否有足够积分
  const hasEnoughPoints = (type: keyof typeof POINT_COSTS) => {
    return checkPoints(POINT_COSTS[type]);
  };

  return {
    consumeAIQuick,
    consumeAIDeep,
    consumeChatMessage,
    consumeYearlyFortune,
    consumeMarriageMatch,
    hasEnoughPoints,
    POINT_COSTS,
  };
};

export { POINT_COSTS, POINT_PACKAGES, MEMBERSHIP_PACKAGES, FREE_POINTS } from './pointConfig';
export { PointsProvider, usePoints } from './PointsContext';
export { PointsStore } from './PointsStore';
