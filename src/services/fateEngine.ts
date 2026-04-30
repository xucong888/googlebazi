import { Lunar, Solar, LunarUtil } from 'lunar-javascript';
import * as Astronomy from 'astronomy-engine';

export interface BaziPillar {
  gan: string;
  ganYinYang: string;
  zhi: string;
  zhiYinYang: string;
  tenGod: string;
  hiddenStems: { gan: string; tenGod: string }[];
  naYin: string;
  kongWang: string;
  shenSha: string[];
}

export interface BaziRelation {
  type: string;
  description: string;
  elements: string[];
}

export interface BaziData {
  pillars: {
    year: BaziPillar;
    month: BaziPillar;
    day: BaziPillar;
    hour: BaziPillar;
  };
  taiYuan: string;
  mingGong: string;
  shenGong: string;
  daYun: {
    startYear: number;
    startAge: number;
    pillars: { age: number; year: number; pillar: string }[];
  };
  fiveElements: Record<string, { percentage: number; strength: string; count: number }>;
  dayMaster: {
    element: string;
    description: string;
    strength: string;
  };
  relations: BaziRelation[];
}

export interface ZiweiPalace {
  name: string; 
  gan: string;
  zhi: string; 
  index: number;
  majorStars: { name: string; brightness: string; transformation?: string }[];
  minorStars: { name: string; brightness: string; transformation?: string }[];
  adjectiveStars: string[];
  statusStars: string[];
  yearlyStars: string[];
  monthlyStars: string[];
  dailyStars: string[];
  hourlyStars: string[];
  decadalStars: string[];
  decadal?: { range: number[]; heavenlyStem: string; earthlyBranch: string };
  age: number[];
  sanFang: string[];
  siZheng: string;
}

export interface ZiweiData {
  solarDate?: string;
  lunarDate?: string;
  hour?: string;
  lifeMaster?: string;
  bodyMaster?: string;
  zodiac?: string;
  palaces: ZiweiPalace[];
  decadal?: {
    index: number;
    name: string;
    gan: string;
    zhi: string;
    range: number[];
    stars: string[];
  };
  yearly?: {
    index: number;
    name: string;
    gan: string;
    zhi: string;
    year: number;
    stars: string[];
  };
}

function getShenSha(dayGan: string, yearZhi: string, dayZhi: string, zhi: string): string[] {
  const shensha: string[] = [];
  
  // 天乙贵人
  const tianYi: Record<string, string[]> = {
    '甲': ['丑', '未'], '戊': ['丑', '未'], '庚': ['丑', '未'],
    '乙': ['子', '申'], '己': ['子', '申'],
    '丙': ['亥', '酉'], '丁': ['亥', '酉'],
    '壬': ['卯', '巳'], '癸': ['卯', '巳'],
    '辛': ['午', '寅']
  };
  if (tianYi[dayGan]?.includes(zhi)) shensha.push('天乙贵人');

  // 太极贵人
  const taiJi: Record<string, string[]> = {
    '甲': ['子', '午'], '乙': ['子', '午'],
    '丙': ['卯', '酉'], '丁': ['卯', '酉'],
    '戊': ['辰', '戌', '丑', '未'], '己': ['辰', '戌', '丑', '未'],
    '庚': ['寅', '亥'], '辛': ['寅', '亥'],
    '壬': ['巳', '申'], '癸': ['巳', '申']
  };
  if (taiJi[dayGan]?.includes(zhi)) shensha.push('太极贵人');

  // 文昌贵人
  const wenChang: Record<string, string> = {
    '甲': '巳', '乙': '午', '丙': '申', '戊': '申', '丁': '酉', '己': '酉',
    '庚': '亥', '辛': '子', '壬': '寅', '癸': '卯'
  };
  if (wenChang[dayGan] === zhi) shensha.push('文昌贵人');

  // 禄神
  const luShen: Record<string, string> = {
    '甲': '寅', '乙': '卯', '丙': '巳', '戊': '巳', '丁': '午', '己': '午',
    '庚': '申', '辛': '酉', '壬': '亥', '癸': '子'
  };
  if (luShen[dayGan] === zhi) shensha.push('禄神');

  // 羊刃
  const yangRen: Record<string, string> = {
    '甲': '卯', '乙': '辰', '丙': '午', '戊': '午', '丁': '未', '己': '未',
    '庚': '酉', '辛': '戌', '壬': '子', '癸': '丑'
  };
  if (yangRen[dayGan] === zhi) shensha.push('羊刃');

  // 驿马
  const yiMa: Record<string, string> = {
    '申': '寅', '子': '寅', '辰': '寅',
    '寅': '申', '午': '申', '戌': '申',
    '巳': '亥', '酉': '亥', '丑': '亥',
    '亥': '巳', '卯': '巳', '未': '巳'
  };
  if (yiMa[yearZhi] === zhi || yiMa[dayZhi] === zhi) shensha.push('驿马');

  // 桃花 (咸池)
  const taoHua: Record<string, string> = {
    '申': '酉', '子': '酉', '辰': '酉',
    '寅': '卯', '午': '卯', '戌': '卯',
    '巳': '午', '酉': '午', '丑': '午',
    '亥': '子', '卯': '子', '未': '子'
  };
  if (taoHua[yearZhi] === zhi || taoHua[dayZhi] === zhi) shensha.push('桃花');

  // 华盖
  const huaGai: Record<string, string> = {
    '申': '辰', '子': '辰', '辰': '辰',
    '寅': '戌', '午': '戌', '戌': '戌',
    '巳': '丑', '酉': '丑', '丑': '丑',
    '亥': '未', '卯': '未', '未': '未'
  };
  if (huaGai[yearZhi] === zhi || huaGai[dayZhi] === zhi) shensha.push('华盖');

  // 将星
  const jiangXing: Record<string, string> = {
    '申': '子', '子': '子', '辰': '子',
    '寅': '午', '午': '午', '戌': '午',
    '巳': '酉', '酉': '酉', '丑': '酉',
    '亥': '卯', '卯': '卯', '未': '卯'
  };
  if (jiangXing[yearZhi] === zhi || jiangXing[dayZhi] === zhi) shensha.push('将星');

  // 劫煞
  const jieSha: Record<string, string> = {
    '申': '巳', '子': '巳', '辰': '巳',
    '寅': '亥', '午': '亥', '戌': '亥',
    '巳': '寅', '酉': '寅', '丑': '寅',
    '亥': '申', '卯': '申', '未': '申'
  };
  if (jieSha[yearZhi] === zhi || jieSha[dayZhi] === zhi) shensha.push('劫煞');

  // 亡神
  const wangShen: Record<string, string> = {
    '申': '亥', '子': '亥', '辰': '亥',
    '寅': '巳', '午': '巳', '戌': '巳',
    '巳': '申', '酉': '申', '丑': '申',
    '亥': '寅', '卯': '寅', '未': '寅'
  };
  if (wangShen[yearZhi] === zhi || wangShen[dayZhi] === zhi) shensha.push('亡神');

  // 金舆
  const jinYu: Record<string, string> = {
    '甲': '辰', '乙': '巳', '丙': '未', '丁': '申', '戊': '未', '己': '申',
    '庚': '戌', '辛': '亥', '壬': '丑', '癸': '寅'
  };
  if (jinYu[dayGan] === zhi) shensha.push('金舆');

  return Array.from(new Set(shensha));
}

function getElement(char: string): string {
  if ('甲乙寅卯'.includes(char)) return '木';
  if ('丙丁巳午'.includes(char)) return '火';
  if ('戊己辰戌丑未'.includes(char)) return '土';
  if ('庚辛申酉'.includes(char)) return '金';
  if ('壬癸亥子'.includes(char)) return '水';
  return '';
}

const ZHI_HIDE_GAN: Record<string, Record<string, number>> = {
  '子': { '癸': 100 },
  '丑': { '己': 60, '癸': 30, '辛': 10 },
  '寅': { '甲': 60, '丙': 30, '戊': 10 },
  '卯': { '乙': 100 },
  '辰': { '戊': 60, '乙': 30, '癸': 10 },
  '巳': { '丙': 60, '庚': 30, '戊': 10 },
  '午': { '丁': 70, '己': 30 },
  '未': { '己': 60, '丁': 30, '乙': 10 },
  '申': { '庚': 60, '壬': 30, '戊': 10 },
  '酉': { '辛': 100 },
  '戌': { '戊': 60, '辛': 30, '丁': 10 },
  '亥': { '壬': 70, '甲': 30 }
};

function calculateRelations(stems: string[], branches: string[]): BaziRelation[] {
  const relations: BaziRelation[] = [];
  
  // 天干五合
  const ganHe: Record<string, string> = { '甲己': '合土', '乙庚': '合金', '丙辛': '合水', '丁壬': '合木', '戊癸': '合火' };
  for (let i = 0; i < stems.length; i++) {
    for (let j = i + 1; j < stems.length; j++) {
      const pair = stems[i] + stems[j];
      const revPair = stems[j] + stems[i];
      if (ganHe[pair]) relations.push({ type: '天干五合', description: `${pair}${ganHe[pair]}`, elements: [stems[i], stems[j]] });
      if (ganHe[revPair]) relations.push({ type: '天干五合', description: `${revPair}${ganHe[revPair]}`, elements: [stems[i], stems[j]] });
    }
  }

  // 天干相冲
  const ganChong = ['甲庚', '乙辛', '壬丙', '癸丁'];
  for (let i = 0; i < stems.length; i++) {
    for (let j = i + 1; j < stems.length; j++) {
      const pair = stems[i] + stems[j];
      const revPair = stems[j] + stems[i];
      if (ganChong.includes(pair) || ganChong.includes(revPair)) {
        relations.push({ type: '天干相冲', description: `${stems[i]}${stems[j]}相冲`, elements: [stems[i], stems[j]] });
      }
    }
  }

  // 地支六合
  const zhiHe: Record<string, string> = { '子丑': '合土', '寅亥': '合木', '卯戌': '合火', '辰酉': '合金', '巳申': '合水', '午未': '合日月' };
  for (let i = 0; i < branches.length; i++) {
    for (let j = i + 1; j < branches.length; j++) {
      const pair = branches[i] + branches[j];
      const revPair = branches[j] + branches[i];
      if (zhiHe[pair]) relations.push({ type: '地支六合', description: `${pair}${zhiHe[pair]}`, elements: [branches[i], branches[j]] });
      if (zhiHe[revPair]) relations.push({ type: '地支六合', description: `${revPair}${zhiHe[revPair]}`, elements: [branches[i], branches[j]] });
    }
  }

  // 地支六冲
  const zhiChong = ['子午', '丑未', '寅申', '卯酉', '辰戌', '巳亥'];
  for (let i = 0; i < branches.length; i++) {
    for (let j = i + 1; j < branches.length; j++) {
      const pair = branches[i] + branches[j];
      const revPair = branches[j] + branches[i];
      if (zhiChong.includes(pair) || zhiChong.includes(revPair)) {
        relations.push({ type: '地支六冲', description: `${branches[i]}${branches[j]}相冲`, elements: [branches[i], branches[j]] });
      }
    }
  }

  // 地支三合
  const sanHe = [{ elements: ['申', '子', '辰'], result: '合水局' }, { elements: ['亥', '卯', '未'], result: '合木局' }, { elements: ['寅', '午', '戌'], result: '合火局' }, { elements: ['巳', '酉', '丑'], result: '合金局' }];
  sanHe.forEach(sh => {
    if (sh.elements.every(e => branches.includes(e))) {
      relations.push({ type: '地支三合', description: `${sh.elements.join('')}${sh.result}`, elements: sh.elements });
    }
  });

  // 地支三会
  const sanHui = [{ elements: ['寅', '卯', '辰'], result: '会木局' }, { elements: ['巳', '午', '未'], result: '会火局' }, { elements: ['申', '酉', '戌'], result: '会金局' }, { elements: ['亥', '子', '丑'], result: '会水局' }];
  sanHui.forEach(sh => {
    if (sh.elements.every(e => branches.includes(e))) {
      relations.push({ type: '地支三会', description: `${sh.elements.join('')}${sh.result}`, elements: sh.elements });
    }
  });

  // 地支相刑
  const xiangXing = [
    { elements: ['寅', '巳', '申'], desc: '无恩之刑' },
    { elements: ['丑', '戌', '未'], desc: '恃势之刑' }
  ];
  xiangXing.forEach(xx => {
    const present = xx.elements.filter(e => branches.includes(e));
    if (present.length >= 2) {
      relations.push({ type: '地支相刑', description: `${present.join('')}${xx.desc}`, elements: present });
    }
  });
  if (branches.includes('子') && branches.includes('卯')) {
    relations.push({ type: '地支相刑', description: '子卯无礼之刑', elements: ['子', '卯'] });
  }
  ['辰', '午', '酉', '亥'].forEach(e => {
    if (branches.filter(b => b === e).length >= 2) {
      relations.push({ type: '地支自刑', description: `${e}${e}自刑`, elements: [e, e] });
    }
  });

  // 地支六害 (穿)
  const zhiHai = ['子未', '丑午', '寅巳', '卯辰', '申亥', '酉戌'];
  for (let i = 0; i < branches.length; i++) {
    for (let j = i + 1; j < branches.length; j++) {
      const pair = branches[i] + branches[j];
      const revPair = branches[j] + branches[i];
      if (zhiHai.includes(pair) || zhiHai.includes(revPair)) {
        relations.push({ type: '地支相害', description: `${branches[i]}${branches[j]}相害(穿)`, elements: [branches[i], branches[j]] });
      }
    }
  }

  // 地支六破
  const zhiPo = ['子酉', '丑辰', '寅亥', '卯午', '巳申', '未戌'];
  for (let i = 0; i < branches.length; i++) {
    for (let j = i + 1; j < branches.length; j++) {
      const pair = branches[i] + branches[j];
      const revPair = branches[j] + branches[i];
      if (zhiPo.includes(pair) || zhiPo.includes(revPair)) {
        relations.push({ type: '地支相破', description: `${branches[i]}${branches[j]}相破`, elements: [branches[i], branches[j]] });
      }
    }
  }

  // Remove duplicates based on description
  const uniqueRelations = Array.from(new Map(relations.map(r => [r.description, r])).values());
  return uniqueRelations;
}

// ─── 排盘引擎：数据层 ────────────────────────────────────────────────────────

// 天干五行映射
const GAN_ELEMENT: Record<string, string> = {
  '甲': '木', '乙': '木',
  '丙': '火', '丁': '火',
  '戊': '土', '己': '土',
  '庚': '金', '辛': '金',
  '壬': '水', '癸': '水',
};

// 地支藏干权重表：本气0.6、中气0.3、余气0.1（子平传统标准，与问真八字一致）
const ZHI_HIDE_GAN_WEIGHT: Record<string, { gan: string; weight: number }[]> = {
  '子': [{ gan: '癸', weight: 1.0 }],
  '丑': [{ gan: '己', weight: 0.6 }, { gan: '癸', weight: 0.3 }, { gan: '辛', weight: 0.1 }],
  '寅': [{ gan: '甲', weight: 0.6 }, { gan: '丙', weight: 0.3 }, { gan: '戊', weight: 0.1 }],
  '卯': [{ gan: '乙', weight: 1.0 }],
  '辰': [{ gan: '戊', weight: 0.6 }, { gan: '癸', weight: 0.3 }, { gan: '乙', weight: 0.1 }],
  '巳': [{ gan: '丙', weight: 0.6 }, { gan: '戊', weight: 0.3 }, { gan: '庚', weight: 0.1 }],
  '午': [{ gan: '丁', weight: 0.7 }, { gan: '己', weight: 0.3 }],
  '未': [{ gan: '己', weight: 0.6 }, { gan: '丁', weight: 0.3 }, { gan: '乙', weight: 0.1 }],
  '申': [{ gan: '庚', weight: 0.6 }, { gan: '壬', weight: 0.3 }, { gan: '戊', weight: 0.1 }],
  '酉': [{ gan: '辛', weight: 1.0 }],
  '戌': [{ gan: '戊', weight: 0.6 }, { gan: '辛', weight: 0.3 }, { gan: '丁', weight: 0.1 }],
  '亥': [{ gan: '壬', weight: 0.7 }, { gan: '甲', weight: 0.3 }],
};

// 月令旺相休囚死状态表（来源：子平传统，china-testing/bazi datas.py 验证）
const YUELING_STATE: Record<string, Record<string, string>> = {
  '子': { '木': '相', '火': '死', '土': '囚', '金': '休', '水': '旺' },
  '丑': { '木': '囚', '火': '休', '土': '旺', '金': '相', '水': '死' },
  '寅': { '木': '旺', '火': '相', '土': '死', '金': '囚', '水': '休' },
  '卯': { '木': '旺', '火': '相', '土': '死', '金': '囚', '水': '休' },
  '辰': { '木': '囚', '火': '休', '土': '旺', '金': '相', '水': '死' },
  '巳': { '木': '休', '火': '旺', '土': '相', '金': '死', '水': '囚' },
  '午': { '木': '休', '火': '旺', '土': '相', '金': '死', '水': '囚' },
  '未': { '木': '囚', '火': '休', '土': '旺', '金': '相', '水': '死' },
  '申': { '木': '死', '火': '囚', '土': '休', '金': '旺', '水': '相' },
  '酉': { '木': '死', '火': '囚', '土': '休', '金': '旺', '水': '相' },
  '戌': { '木': '囚', '火': '休', '土': '旺', '金': '相', '水': '死' },
  '亥': { '木': '相', '火': '死', '土': '囚', '金': '休', '水': '旺' },
};

// 旺相休囚死 → 强度乘数（子平：旺100% 相80% 休60% 囚40% 死20%）
const YUELING_MULTIPLIER: Record<string, number> = {
  '旺': 1.00, '相': 0.80, '休': 0.60, '囚': 0.40, '死': 0.20,
};

// ─── 排盘引擎：计算层 ────────────────────────────────────────────────────────

function getYuelingMultiplier(element: string, monthZhi: string): number {
  const state = YUELING_STATE[monthZhi]?.[element] ?? '囚';
  return YUELING_MULTIPLIER[state] ?? 0.40;
}

function calculateFiveElements(eightChar: any): BaziData['fiveElements'] {
  const monthZhi = eightChar.getMonthZhi();
  const elements: Record<string, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 };

  // 1. 四天干：旺月+15%，相月-10%，其余不变（月令对天干影响较弱）
  const stemMult = (el: string): number => {
    const state = YUELING_STATE[monthZhi]?.[el];
    if (state === '旺') return 1.15;
    if (state === '相') return 0.90;
    return 1.0;
  };
  [
    eightChar.getYearGan(),
    eightChar.getMonthGan(),
    eightChar.getDayGan(),
    eightChar.getTimeGan(),
  ].forEach(gan => {
    const el = GAN_ELEMENT[gan];
    if (el) elements[el] += 1.0 * stemMult(el);
  });

  // 2. 月支藏干：月令司令，权重 × 2.5（传统「月令当令」最重）
  (ZHI_HIDE_GAN_WEIGHT[monthZhi] ?? []).forEach(({ gan, weight }) => {
    const el = GAN_ELEMENT[gan];
    if (el) elements[el] += weight * 2.5;
  });

  // 3. 年支、日支、时支藏干：原始权重，不叠加月令乘数
  [
    eightChar.getYearZhi(),
    eightChar.getDayZhi(),
    eightChar.getTimeZhi(),
  ].forEach(zhi => {
    (ZHI_HIDE_GAN_WEIGHT[zhi] ?? []).forEach(({ gan, weight }) => {
      const el = GAN_ELEMENT[gan];
      if (el) elements[el] += weight;
    });
  });

  // 4. 归一化为百分比
  const total = Object.values(elements).reduce((s, v) => s + v, 0);
  const result: any = {};
  Object.entries(elements).forEach(([el, score]) => {
    const pct = total > 0 ? (score / total) * 100 : 0;
    let strength = '中庸';
    if (pct === 0)       strength = '极弱';
    else if (pct < 10)  strength = '偏弱';
    else if (pct < 20)  strength = '略弱';
    else if (pct < 30)  strength = '中庸';
    else if (pct < 40)  strength = '略强';
    else                strength = '极强';
    result[el] = {
      percentage: Math.round(pct * 10) / 10,
      strength,
      count: Math.round(score * 10) / 10,
    };
  });
  return result;
}

export function calculateBazi(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  calendarType: 'solar' | 'lunar',
  isLeap: boolean,
  gender: 'male' | 'female'
): BaziData {
  let lunar: Lunar;
  if (calendarType === 'lunar') {
    lunar = Lunar.fromYmd(year, isLeap ? -month : month, day);
  } else {
    const solar = Solar.fromYmd(year, month, day);
    lunar = solar.getLunar();
  }
  
  // Create EightChar with hour
  // Note: lunar-javascript's getEightChar uses the hour from the lunar object if available
  // But we need to ensure the hour is set correctly.
  // We'll create a new Lunar object with time for precise Bazi
  const solarDate = lunar.getSolar();
  const preciseSolar = Solar.fromYmdHms(
    solarDate.getYear(),
    solarDate.getMonth(),
    solarDate.getDay(),
    hour,
    minute,
    0
  );
  const preciseLunar = preciseSolar.getLunar();
  const eightChar = preciseLunar.getEightChar();
  
  // Professional standard: Use Sect 2 for Early/Late Zi handling (Day changes at 00:00)
  eightChar.setSect(2); 
  
  const dayGan = eightChar.getDayGan();
  const yearZhi = eightChar.getYearZhi();
  const dayZhi = eightChar.getDayZhi();

  const branches = [
    eightChar.getYearZhi(),
    eightChar.getMonthZhi(),
    eightChar.getDayZhi(),
    eightChar.getTimeZhi()
  ];

  const createPillar = (
    gan: string, 
    zhi: string, 
    tenGod: string, 
    hideGan: string[], 
    hideTenGod: string[], 
    naYin: string, 
    kongWang: string
  ): BaziPillar => {
    const hiddenStems = hideGan.map((g, i) => ({
      gan: g,
      tenGod: hideTenGod[i] || ''
    }));

    const ganYinYang: Record<string, string> = {
      '甲': '阳', '乙': '阴', '丙': '阳', '丁': '阴', '戊': '阳',
      '己': '阴', '庚': '阳', '辛': '阴', '壬': '阳', '癸': '阴'
    };
    const zhiYinYang: Record<string, string> = {
      '子': '阳', '丑': '阴', '寅': '阳', '卯': '阴', '辰': '阳', '巳': '阴',
      '午': '阳', '未': '阴', '申': '阳', '酉': '阴', '戌': '阳', '亥': '阴'
    };

    return {
      gan,
      ganYinYang: ganYinYang[gan] || '',
      zhi,
      zhiYinYang: zhiYinYang[zhi] || '',
      tenGod,
      hiddenStems,
      naYin,
      kongWang,
      shenSha: getShenSha(dayGan, yearZhi, dayZhi, zhi)
    };
  };

  const pillars = {
    year: createPillar(
      eightChar.getYearGan(), 
      eightChar.getYearZhi(), 
      eightChar.getYearShiShenGan(),
      eightChar.getYearHideGan(),
      eightChar.getYearShiShenZhi(),
      eightChar.getYearNaYin(),
      eightChar.getYearXunKong()
    ),
    month: createPillar(
      eightChar.getMonthGan(), 
      eightChar.getMonthZhi(), 
      eightChar.getMonthShiShenGan(),
      eightChar.getMonthHideGan(),
      eightChar.getMonthShiShenZhi(),
      eightChar.getMonthNaYin(),
      eightChar.getMonthXunKong()
    ),
    day: createPillar(
      eightChar.getDayGan(), 
      eightChar.getDayZhi(), 
      '日主',
      eightChar.getDayHideGan(),
      eightChar.getDayShiShenZhi(),
      eightChar.getDayNaYin(),
      eightChar.getDayXunKong()
    ),
    hour: createPillar(
      eightChar.getTimeGan(), 
      eightChar.getTimeZhi(), 
      eightChar.getTimeShiShenGan(),
      eightChar.getTimeHideGan(),
      eightChar.getTimeShiShenZhi(),
      eightChar.getTimeNaYin(),
      eightChar.getTimeXunKong()
    ),
  };

  const dayMasterMap: Record<string, { element: string, description: string }> = {
    '甲': { element: '阳木', description: '如参天大树 - 刚直不阿、志向高远、仁慈正直' },
    '乙': { element: '阴木', description: '如柔韧花草 - 灵活变通、温柔委婉、适应力强' },
    '丙': { element: '阳火', description: '如炽热太阳 - 热情开朗、光明磊落、急躁好胜' },
    '丁': { element: '阴火', description: '如烛火灯光 - 内敛细腻、温文尔雅、富有同情心' },
    '戊': { element: '阳土', description: '如厚重高山 - 稳重诚信、包容力强、固执保守' },
    '己': { element: '阴土', description: '如田园沃土 - 柔顺和谐、多才多艺、疑心较重' },
    '庚': { element: '阳金', description: '如刚硬刀剑 - 刚毅果断、讲究义气、好胜心强' },
    '辛': { element: '阴金', description: '如名贵珠宝 - 秀气灵动、自尊心强、追求完美' },
    '壬': { element: '阳水', description: '如奔腾江河 - 聪明机智、大气磅礴、随性而为' },
    '癸': { element: '阴水', description: '如绵绵细雨 - 阴柔灵动、富有幻想、耐力十足' }
  };

  const fiveElements = calculateFiveElements(eightChar);
  const dmElement = getElement(dayGan);
  
  // Calculate Day Master Strength
  // Support elements: Same element and Producing element
  const supportMap: Record<string, string[]> = {
    '木': ['木', '水'],
    '火': ['火', '木'],
    '土': ['土', '火'],
    '金': ['金', '土'],
    '水': ['水', '金']
  };
  
  const supports = supportMap[dmElement] || [];
  const supportScore = supports.reduce((acc, el) => acc + (fiveElements[el]?.percentage || 0), 0);
  
  // Professional Strength Evaluation:
  // 1. De Ling (得令): Day Master element matches or is supported by Month Branch element
  const monthZhiElement = getElement(eightChar.getMonthZhi());
  const isDeLing = supports.includes(monthZhiElement);

  // 2. De Di (得地): Day Master has roots in branches
  const hasRoots = branches.some(b => {
    const hides = ZHI_HIDE_GAN[b] || {};
    return Object.keys(hides).some(g => getElement(g) === dmElement);
  });
  
  let dmStrength = '中庸';
  if (supportScore > 55) {
    dmStrength = (isDeLing || hasRoots) ? '极强' : '偏强';
  } else if (supportScore > 40) {
    dmStrength = (isDeLing && hasRoots) ? '偏强' : '中庸';
  } else if (supportScore > 20) {
    dmStrength = (isDeLing || hasRoots) ? '中庸' : '偏弱';
  } else {
    dmStrength = '极弱';
  }

  const yun = eightChar.getYun(gender === 'male' ? 1 : 0);
  const daYunList = yun.getDaYun();
  const daYun = {
    startYear: yun.getStartSolar().getYear(),
    startAge: yun.getStartYear(), // getStartYear() returns the number of years from birth
    pillars: daYunList.map(d => ({
      age: d.getStartAge(),
      year: d.getStartYear(),
      pillar: d.getGanZhi()
    })).filter(d => d.pillar !== '')
  };

  const stems = [
    eightChar.getYearGan(),
    eightChar.getMonthGan(),
    eightChar.getDayGan(),
    eightChar.getTimeGan()
  ];
  const relations = calculateRelations(stems, branches);

  return {
    pillars,
    taiYuan: eightChar.getTaiYuan(),
    mingGong: eightChar.getMingGong(),
    shenGong: eightChar.getShenGong(),
    daYun,
    fiveElements,
    dayMaster: {
      ...(dayMasterMap[dayGan] || { element: '未知', description: '暂无描述' }),
      strength: dmStrength
    },
    relations
  };
}

export function getZodiac(date: Date) {
  const solar = Solar.fromDate(date);
  const lunar = solar.getLunar();
  return lunar.getYearShengXiao();
}

export function getWesternZodiac(date: Date) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const signs = ["摩羯", "水瓶", "双鱼", "白羊", "金牛", "双子", "巨蟹", "狮子", "处女", "天秤", "天蝎", "射手"];
  const lastDays = [19, 18, 20, 19, 20, 20, 22, 22, 22, 22, 21, 21];
  return signs[day > lastDays[month - 1] ? month % 12 : month - 1];
}

export interface LifeNumerologyData {
  lifePathNumber: number;
  meaning: string;
}

export function calculateLifeNumerology(year: number, month: number, day: number): LifeNumerologyData {
  const dateStr = `${year}${month}${day}`;
  let sum = 0;
  for (let i = 0; i < dateStr.length; i++) {
    sum += parseInt(dateStr[i]);
  }

  const reduce = (n: number): number => {
    if (n === 11 || n === 22 || n === 33) return n;
    if (n < 10) return n;
    let s = 0;
    const ns = n.toString();
    for (let i = 0; i < ns.length; i++) {
      s += parseInt(ns[i]);
    }
    return reduce(s);
  };

  const lifeNumber = reduce(sum);
  
  const descriptions: Record<number, string> = {
    1: '开创、独立、领导力',
    2: '合作、敏感、和谐',
    3: '表达、社交、创意',
    4: '稳定、秩序、务实',
    5: '自由、变化、冒险',
    6: '责任、关怀、平衡',
    7: '分析、内省、智慧',
    8: '成就、权力、物质',
    9: '博爱、理想、圆满',
    11: '直觉、启迪、灵性 (大师数)',
    22: '建筑、宏图、大师 (大师数)',
    33: '慈悲、疗愈、导师 (大师数)'
  };

  return {
    lifePathNumber: lifeNumber,
    meaning: descriptions[lifeNumber] || '未知'
  };
}

export function calculateWesternAstrology(date: Date) {
  const time = Astronomy.MakeTime(date);
  
  const bodies = [
    Astronomy.Body.Sun,
    Astronomy.Body.Moon,
    Astronomy.Body.Mercury,
    Astronomy.Body.Venus,
    Astronomy.Body.Mars,
    Astronomy.Body.Jupiter,
    Astronomy.Body.Saturn,
    Astronomy.Body.Uranus,
    Astronomy.Body.Neptune,
    Astronomy.Body.Pluto
  ];

  const bodyNames: Record<string, string> = {
    'Sun': '太阳',
    'Moon': '月亮',
    'Mercury': '水星',
    'Venus': '金星',
    'Mars': '火星',
    'Jupiter': '木星',
    'Saturn': '土星',
    'Uranus': '天王星',
    'Neptune': '海王星',
    'Pluto': '冥王星'
  };

  const planetPositions = bodies.map(body => {
    const geoVector = Astronomy.GeoVector(body, time, true);
    const ecliptic = Astronomy.Ecliptic(geoVector);
    
    return {
      name: bodyNames[body.toString()] || body.toString(),
      longitude: ecliptic.elon,
      latitude: ecliptic.elat,
      distance: ecliptic.vec.Length()
    };
  });

  // Calculate aspects
  const aspects: { name: string; description: string }[] = [];
  const aspectTypes = [
    { name: '合相', angle: 0, orb: 8 },
    { name: '对分相', angle: 180, orb: 8 },
    { name: '三分相', angle: 120, orb: 8 },
    { name: '四分相', angle: 90, orb: 8 },
    { name: '六分相', angle: 60, orb: 6 }
  ];

  const getAspectMeaning = (p1: string, p2: string, aspect: string) => {
    const meanings: Record<string, string> = {
      '太阳': '自我、生命力、外在表现',
      '月亮': '情感、潜意识、内在需求',
      '水星': '思维、沟通、学习能力',
      '金星': '爱情、审美、价值观',
      '火星': '行动力、欲望、勇气',
      '木星': '扩张、幸运、哲学',
      '土星': '压力、责任、限制',
      '天王星': '变革、独立、突发',
      '海王星': '梦幻、直觉、牺牲',
      '冥王星': '转化、权力、深度'
    };
    
    const aspectMeanings: Record<string, string> = {
      '合相': '力量融合与强化',
      '对分相': '张力、对立与平衡',
      '三分相': '顺畅、天赋与和谐',
      '四分相': '挑战、磨砺与动力',
      '六分相': '机会、表达与协作'
    };

    return `${meanings[p1] || p1}与${meanings[p2] || p2}产生${aspect}，代表${aspectMeanings[aspect] || '能量互动'}。`;
  };

  for (let i = 0; i < planetPositions.length; i++) {
    for (let j = i + 1; j < planetPositions.length; j++) {
      const p1 = planetPositions[i];
      const p2 = planetPositions[j];
      
      let diff = Math.abs(p1.longitude - p2.longitude);
      if (diff > 180) diff = 360 - diff;

      for (const aspect of aspectTypes) {
        if (Math.abs(diff - aspect.angle) <= aspect.orb) {
          aspects.push({
            name: `${p1.name}${aspect.name}${p2.name}`,
            description: getAspectMeaning(p1.name, p2.name, aspect.name)
          });
        }
      }
    }
  }

  return {
    sunSign: getWesternZodiac(date),
    planetPositions,
    aspects: aspects.slice(0, 8) // Limit to top 8 aspects for UI
  };
}

import { astro } from 'iztro';

export function calculateZiwei(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  calendarType: 'solar' | 'lunar',
  isLeap: boolean,
  gender: 'male' | 'female',
  longitude?: number
): ZiweiData {
  let solarObj: Solar;
  let lunarObj: Lunar;

  if (calendarType === 'lunar') {
    const baseLunar = Lunar.fromYmd(year, isLeap ? -month : month, day);
    const baseSolar = baseLunar.getSolar();
    solarObj = Solar.fromYmdHms(baseSolar.getYear(), baseSolar.getMonth(), baseSolar.getDay(), hour, minute, 0);
    lunarObj = solarObj.getLunar();
  } else {
    solarObj = Solar.fromYmdHms(year, month, day, hour, minute, 0);
    lunarObj = solarObj.getLunar();
  }

  const dateStr = `${solarObj.getYear()}-${solarObj.getMonth().toString().padStart(2, '0')}-${solarObj.getDay().toString().padStart(2, '0')}`;
  
  // timeIndex in iztro: 0=Early Zi, 1=Chou, ..., 12=Late Zi
  // We can calculate it based on hour.
  // 23:00 - 00:59 -> Zi (0 or 12)
  // 01:00 - 02:59 -> Chou (1)
  let timeIndex = Math.floor((hour + 1) / 2) % 12;
  if (hour === 23) timeIndex = 12; // Late Zi

  const astrolabe = astro.bySolar(dateStr, timeIndex, gender === 'male' ? '男' : '女', true, 'zh-CN');
  
  // Get current luck cycles using the modern horoscope API if available
  const now = new Date();
  let decadalLuck: any = null;
  let yearlyLuck: any = null;
  let monthlyLuck: any = null;
  let dailyLuck: any = null;

  try {
    // Try the modern horoscope API first
    const horoscope = (astrolabe as any).horoscope(now);
    decadalLuck = horoscope.decadal;
    yearlyLuck = horoscope.yearly;
    monthlyLuck = horoscope.monthly;
    dailyLuck = horoscope.daily;
  } catch (e) {
    console.warn("iztro horoscope API failed, falling back to manual or empty luck data", e);
    // Fallback: try the older direct methods if they exist
    try {
      decadalLuck = (astrolabe as any).decadal?.(now.getFullYear());
      yearlyLuck = (astrolabe as any).yearly?.(now.getFullYear());
      monthlyLuck = (astrolabe as any).monthly?.(now.getFullYear(), now.getMonth() + 1);
      dailyLuck = (astrolabe as any).daily?.(now.getFullYear(), now.getMonth() + 1, now.getDate());
    } catch (e2) {
      console.error("All luck cycle methods failed", e2);
    }
  }

  const branchToIndex: Record<string, number> = {
    '寅': 0, '卯': 1, '辰': 2, '巳': 3, '午': 4, '未': 5,
    '申': 6, '酉': 7, '戌': 8, '亥': 9, '子': 10, '丑': 11
  };

  // Normalize iztro's short mutagen values ('禄'/'权'/'科'/'忌') to full form ('化禄' etc.)
  const normMutagen = (m: string): string => {
    if (m === '禄') return '化禄';
    if (m === '权') return '化权';
    if (m === '科') return '化科';
    if (m === '忌') return '化忌';
    return m;
  };

  const palaces: ZiweiPalace[] = astrolabe.palaces.map((p, i, all) => {
    const getPalaceName = (branch: string) => all.find(pl => pl.earthlyBranch === branch)?.name || '';
    const index = branchToIndex[p.earthlyBranch];

    // decadal/yearly/monthly/daily stars: iztro stores them in luck.stars[palaceNames.indexOf(palace.name)]
    const dIdx = decadalLuck?.palaceNames?.indexOf(p.name) ?? -1;
    const yIdx = yearlyLuck?.palaceNames?.indexOf(p.name) ?? -1;
    const mIdx = monthlyLuck?.palaceNames?.indexOf(p.name) ?? -1;
    const dayIdx = dailyLuck?.palaceNames?.indexOf(p.name) ?? -1;

    return {
      name: p.name,
      gan: p.heavenlyStem || '',
      zhi: p.earthlyBranch,
      index: index,
      majorStars: p.majorStars.map(s => ({
        name: s.name,
        brightness: s.brightness || '',
        transformation: normMutagen(s.mutagen || '')
      })),
      minorStars: p.minorStars.map(s => ({
        name: s.name,
        brightness: s.brightness || '',
        transformation: normMutagen(s.mutagen || '')
      })),
      adjectiveStars: p.adjectiveStars?.map(s => s.name) || [],
      statusStars: [p.changsheng12, p.boshi12, p.jiangqian12, p.suiqian12].filter(Boolean),
      yearlyStars: yIdx >= 0 ? (yearlyLuck.stars?.[yIdx] || []).map((s: any) => s.name) : [],
      monthlyStars: mIdx >= 0 ? (monthlyLuck.stars?.[mIdx] || []).map((s: any) => s.name) : [],
      dailyStars: dayIdx >= 0 ? (dailyLuck.stars?.[dayIdx] || []).map((s: any) => s.name) : [],
      hourlyStars: [],
      decadalStars: dIdx >= 0 ? (decadalLuck.stars?.[dIdx] || []).map((s: any) => s.name) : [],
      decadal: p.decadal,
      age: p.ages || [],
      sanFang: [
        getPalaceName(Object.keys(branchToIndex).find(k => branchToIndex[k] === (index + 4) % 12) || ''),
        getPalaceName(Object.keys(branchToIndex).find(k => branchToIndex[k] === (index + 8) % 12) || '')
      ],
      siZheng: getPalaceName(Object.keys(branchToIndex).find(k => branchToIndex[k] === (index + 6) % 12) || '')
    };
  }).sort((a, b) => a.index - b.index);

  const currentYear = now.getFullYear();
  return { 
    solarDate: `${solarObj.getYear()}年${solarObj.getMonth()}月${solarObj.getDay()}日`,
    lunarDate: `${lunarObj.getYearInGanZhi()}年 ${lunarObj.getMonthInChinese()}月 ${lunarObj.getDayInChinese()}`,
    hour: astrolabe.time,
    lifeMaster: astrolabe.soul,
    bodyMaster: astrolabe.body,
    zodiac: astrolabe.zodiac,
    palaces,
    decadal: (() => {
      if (!decadalLuck?.earthlyBranch) return undefined;
      const mp = astrolabe.palaces.find((p: any) => p.earthlyBranch === decadalLuck.earthlyBranch);
      return {
        index: decadalLuck.index ?? 0,
        name: mp?.name || '',
        gan: decadalLuck.heavenlyStem || '',
        zhi: decadalLuck.earthlyBranch,
        range: mp?.decadal?.range || [],
        stars: Array.isArray(decadalLuck.mutagen) ? decadalLuck.mutagen : []
      };
    })(),
    yearly: (() => {
      if (!yearlyLuck?.earthlyBranch) return undefined;
      const mp = astrolabe.palaces.find((p: any) => p.earthlyBranch === yearlyLuck.earthlyBranch);
      return {
        index: yearlyLuck.index ?? 0,
        name: mp?.name || '',
        gan: yearlyLuck.heavenlyStem || '',
        zhi: yearlyLuck.earthlyBranch,
        year: currentYear,
        stars: Array.isArray(yearlyLuck.mutagen) ? yearlyLuck.mutagen : []
      };
    })()
  };
}

// ==================== 增强版结构化分析数据 ====================

export interface StructuredBaziAnalysis {
  // 基本信息
  dayMaster: {
    gan: string;
    element: string;
    yinYang: string;
    description: string;
  };
  
  // 五行分析
  fiveElements: {
    scores: Record<string, number>;
    percentages: Record<string, number>;
    dominant: string;
    weakest: string;
  };
  
  // 日主强弱
  strength: {
    level: '极强' | '偏强' | '中和' | '偏弱' | '极弱';
    score: number;
    reason: string;
  };
  
  // 喜用神
  xiYongShen: {
    xiShen: string;  // 喜神
    yongShen: string; // 用神
    jiShen: string;  // 忌神
    reason: string;
  };
  
  // 十神配置
  tenGods: {
    year: string;
    month: string;
    day: string;
    hour: string;
  };
  
  // 格局
  pattern: {
    name: string;
    description: string;
  };
  
  // 关键关系
  relations: {
    type: string;
    description: string;
  }[];
}

// 计算喜用神
function calculateXiYongShen(
  dayMasterElement: string,
  fiveElements: Record<string, number>,
  strength: string
): { xiShen: string; yongShen: string; jiShen: string; reason: string } {
  // 五行生克关系
  const shengWo: Record<string, string> = {  // 生我者
    '木': '水', '火': '木', '土': '火', '金': '土', '水': '金'
  };
  const woSheng: Record<string, string> = {  // 我生者
    '木': '火', '火': '土', '土': '金', '金': '水', '水': '木'
  };
  const keWo: Record<string, string> = {     // 克我者
    '木': '金', '火': '水', '土': '木', '金': '火', '水': '土'
  };
  const woKe: Record<string, string> = {     // 我克者
    '木': '土', '火': '金', '土': '水', '金': '木', '水': '火'
  };
  
  let xiShen, yongShen, jiShen, reason;
  
  if (strength === '极强' || strength === '偏强') {
    // 身强：需要克泄耗
    yongShen = keWo[dayMasterElement];  // 克我者为官杀
    xiShen = woKe[dayMasterElement];    // 我克者为财星
    jiShen = shengWo[dayMasterElement]; // 生我者为印星（忌神）
    reason = `日主${dayMasterElement}身强，喜克泄耗，以${yongShen}（官杀）为用神，${xiShen}（财星）为喜神，忌${jiShen}（印星）生扶`;
  } else if (strength === '极弱' || strength === '偏弱') {
    // 身弱：需要生扶
    yongShen = shengWo[dayMasterElement]; // 生我者为印星
    xiShen = dayMasterElement;            // 同我者为比劫
    jiShen = keWo[dayMasterElement];      // 克我者为官杀（忌神）
    reason = `日主${dayMasterElement}身弱，喜生扶，以${yongShen}（印星）为用神，${xiShen}（比劫）为喜神，忌${jiShen}（官杀）克制`;
  } else {
    // 中和：根据五行分布调整
    const sorted = Object.entries(fiveElements).sort((a, b) => b[1] - a[1]);
    const strongest = sorted[0][0];
    const weakest = sorted[sorted.length - 1][0];
    
    if (strongest === dayMasterElement) {
      yongShen = woSheng[dayMasterElement];
      xiShen = woKe[dayMasterElement];
      jiShen = shengWo[dayMasterElement];
      reason = `日主中和偏旺，以${yongShen}（食伤）泄秀为用神`;
    } else {
      yongShen = shengWo[dayMasterElement];
      xiShen = dayMasterElement;
      jiShen = keWo[dayMasterElement];
      reason = `日主中和偏弱，以${yongShen}（印星）生扶为用神`;
    }
  }
  
  return { xiShen, yongShen, jiShen, reason };
}

// 根据月支本气藏干计算月令十神（子平格局取月令，不取月干）
function getMonthLingTenGod(monthZhi: string, dayGan: string): string {
  // 取月支本气（权重最高的藏干）
  const primaryGan = (ZHI_HIDE_GAN_WEIGHT[monthZhi] ?? [])[0]?.gan;
  if (!primaryGan) return '';

  const dmEl = getElement(dayGan);
  const prEl = getElement(primaryGan);
  const dmYang = '甲丙戊庚壬'.includes(dayGan);
  const prYang = '甲丙戊庚壬'.includes(primaryGan);
  const same = dmYang === prYang;

  const shengMe: Record<string,string> = {'木':'水','火':'木','土':'火','金':'土','水':'金'};
  const keMe:    Record<string,string> = {'木':'金','火':'水','土':'木','金':'火','水':'土'};
  const iSheng:  Record<string,string> = {'木':'火','火':'土','土':'金','金':'水','水':'木'};
  const iKe:     Record<string,string> = {'木':'土','火':'金','土':'水','金':'木','水':'火'};

  if (prEl === dmEl)          return same ? '比肩' : '劫财';
  if (prEl === shengMe[dmEl]) return same ? '偏印' : '正印';
  if (prEl === keMe[dmEl])    return same ? '七杀' : '正官';
  if (prEl === iSheng[dmEl])  return same ? '食神' : '伤官';
  if (prEl === iKe[dmEl])     return same ? '偏财' : '正财';
  return '';
}

// 计算格局（依月令本气，子平传统）
function calculatePattern(
  monthZhi: string,
  dayGan: string,
  _tenGods: Record<string, string>
): { name: string; description: string } {
  const monthTenGod = getMonthLingTenGod(monthZhi, dayGan);

  // 常见格局判断
  if (monthTenGod === '比肩' || monthTenGod === '劫财') {
    return {
      name: '建禄格',
      description: '月令为日主禄地，身强有力，宜财官食伤'
    };
  } else if (monthTenGod === '食神' || monthTenGod === '伤官') {
    return {
      name: '食伤格',
      description: '月令为食伤，聪明灵巧，宜财星配合'
    };
  } else if (monthTenGod === '正财' || monthTenGod === '偏财') {
    return {
      name: '财格',
      description: '月令为财星，重视物质，宜官星护财'
    };
  } else if (monthTenGod === '正官' || monthTenGod === '七杀') {
    return {
      name: '官杀格',
      description: '月令为官杀，有领导才能，宜印星化解'
    };
  } else if (monthTenGod === '正印' || monthTenGod === '偏印') {
    return {
      name: '印格',
      description: '月令为印星，学识渊博，宜财星破印'
    };
  }
  
  return {
    name: '普通格',
    description: '无明显格局，以五行平衡为主'
  };
}

// ─── 排盘引擎：分析层 ────────────────────────────────────────────────────────

// 计算日主强弱
// 传统标准：同党（日主同行 + 生我者）占总能量比例
// 阈值来源：子平算法 >90%从强 >52%偏强 48~52%中和 >10%偏弱 ≤10%从弱
// monthZhiElement 已通过 YUELING 乘数内嵌于百分比中，无需额外加成
function calculateStrengthScore(
  dayMasterElement: string,
  percentages: Record<string, number>,
  _monthZhiElement: string
): { level: '极强' | '偏强' | '中和' | '偏弱' | '极弱'; score: number; reason: string } {
  const shengWo: Record<string, string> = { '木': '水', '火': '木', '土': '火', '金': '土', '水': '金' };
  const selfPct    = percentages[dayMasterElement] ?? 0;
  const supportPct = percentages[shengWo[dayMasterElement]] ?? 0;
  const total      = selfPct + supportPct;

  let level: '极强' | '偏强' | '中和' | '偏弱' | '极弱';
  let reason: string;

  if (total >= 90) {
    level  = '极强';
    reason = `日主${dayMasterElement}同党占${total.toFixed(1)}%，势力极强，或为从强格，宜泄耗制`;
  } else if (total >= 52) {
    level  = '偏强';
    reason = `日主${dayMasterElement}同党占${total.toFixed(1)}%，身强，以官杀财星为用`;
  } else if (total >= 48) {
    level  = '中和';
    reason = `日主${dayMasterElement}同党占${total.toFixed(1)}%，中和平衡，宜顺势而行`;
  } else if (total >= 10) {
    level  = '偏弱';
    reason = `日主${dayMasterElement}同党占${total.toFixed(1)}%，身弱，以印星比劫为用`;
  } else {
    level  = '极弱';
    reason = `日主${dayMasterElement}同党占${total.toFixed(1)}%，势力极弱，或为从弱格`;
  }

  return { level, score: total, reason };
}

// 导出结构化分析数据
export function getStructuredAnalysis(baziData: BaziData): StructuredBaziAnalysis {
  const dayMasterGan = baziData.pillars.day.gan;
  const dayMasterElement = getElement(dayMasterGan);
  const monthZhi = baziData.pillars.month.zhi;
  const monthZhiElement = getElement(monthZhi);
  
  // 五行分数
  const scores: Record<string, number> = {};
  const percentages: Record<string, number> = {};
  Object.entries(baziData.fiveElements).forEach(([el, data]) => {
    scores[el] = data.count;
    percentages[el] = data.percentage;
  });
  
  // 找出最强和最弱
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const dominant = sorted[0][0];
  const weakest = sorted[sorted.length - 1][0];
  
  // 计算强弱（传百分比，与 20/40/60/80 阈值匹配）
  const strength = calculateStrengthScore(dayMasterElement, percentages, monthZhiElement);
  
  // 计算喜用神
  const xiYongShen = calculateXiYongShen(dayMasterElement, scores, strength.level);
  
  // 十神配置
  const tenGods = {
    year: baziData.pillars.year.tenGod,
    month: baziData.pillars.month.tenGod,
    day: '日主',
    hour: baziData.pillars.hour.tenGod
  };
  
  // 格局
  const pattern = calculatePattern(monthZhi, dayMasterGan, {
    year: tenGods.year,
    month: tenGods.month,
    day: tenGods.day,
    hour: tenGods.hour
  });
  
  // 关键关系
  const relations = baziData.relations.slice(0, 5).map(r => ({
    type: r.type,
    description: r.description
  }));
  
  return {
    dayMaster: {
      gan: dayMasterGan,
      element: dayMasterElement,
      yinYang: baziData.pillars.day.ganYinYang,
      description: baziData.dayMaster.description
    },
    fiveElements: {
      scores,
      percentages,
      dominant,
      weakest
    },
    strength,
    xiYongShen,
    tenGods,
    pattern,
    relations
  };
}
