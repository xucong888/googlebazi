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

function calculateFiveElements(eightChar: any): BaziData['fiveElements'] {
  const elements = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 };
  
  const chars = [
    eightChar.getYearGan(),
    eightChar.getYearZhi(),
    eightChar.getMonthGan(),
    eightChar.getMonthZhi(),
    eightChar.getDayGan(),
    eightChar.getDayZhi(),
    eightChar.getTimeGan(),
    eightChar.getTimeZhi()
  ];
  
  chars.forEach(c => {
    const el = getElement(c);
    if (el) elements[el as keyof typeof elements] += 1;
  });

  const result: any = {};
  Object.entries(elements).forEach(([el, count]) => {
    const percentage = (count / 8) * 100;
    let strength = '中庸';
    if (count === 0) strength = '极弱';
    else if (count === 1) strength = '偏弱';
    else if (count === 2) strength = '中庸';
    else if (count === 3) strength = '偏强';
    else strength = '极强';
    
    result[el] = { percentage, strength, count };
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

  const palaces: ZiweiPalace[] = astrolabe.palaces.map((p, i, all) => {
    const getPalaceName = (branch: string) => all.find(pl => pl.earthlyBranch === branch)?.name || '';
    const index = branchToIndex[p.earthlyBranch];
    
    // Find stars in luck cycles for this palace
    const dPalace = decadalLuck?.palaces?.find((dp: any) => dp.earthlyBranch === p.earthlyBranch);
    const yPalace = yearlyLuck?.palaces?.find((yp: any) => yp.earthlyBranch === p.earthlyBranch);
    const mPalace = monthlyLuck?.palaces?.find((mp: any) => mp.earthlyBranch === p.earthlyBranch);
    const dayPalace = dailyLuck?.palaces?.find((dp: any) => dp.earthlyBranch === p.earthlyBranch);

    return {
      name: p.name,
      gan: p.heavenlyStem || '',
      zhi: p.earthlyBranch,
      index: index,
      majorStars: p.majorStars.map(s => ({
        name: s.name,
        brightness: s.brightness || '',
        transformation: s.mutagen || ''
      })),
      minorStars: p.minorStars.map(s => ({
        name: s.name,
        brightness: s.brightness || '',
        transformation: s.mutagen || ''
      })),
      adjectiveStars: p.adjectiveStars?.map(s => s.name) || [],
      statusStars: [p.changsheng12, p.boshi12, p.jiangqian12, p.suiqian12].filter(Boolean),
      yearlyStars: yPalace?.yearlyStars?.map((s: any) => s.name) || [],
      monthlyStars: mPalace?.monthlyStars?.map((s: any) => s.name) || [],
      dailyStars: dayPalace?.dailyStars?.map((s: any) => s.name) || [],
      hourlyStars: [],
      decadalStars: dPalace?.decadalStars?.map((s: any) => s.name) || [],
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
    decadal: (decadalLuck && decadalLuck.focusedIndex !== undefined && decadalLuck.palaces[decadalLuck.focusedIndex]) ? {
      index: decadalLuck.focusedIndex,
      name: decadalLuck.palaces[decadalLuck.focusedIndex].name,
      gan: decadalLuck.palaces[decadalLuck.focusedIndex].heavenlyStem,
      zhi: decadalLuck.palaces[decadalLuck.focusedIndex].earthlyBranch,
      range: decadalLuck.palaces[decadalLuck.focusedIndex].decadal.range,
      stars: []
    } : undefined,
    yearly: (yearlyLuck && yearlyLuck.focusedIndex !== undefined && yearlyLuck.palaces[yearlyLuck.focusedIndex]) ? {
      index: yearlyLuck.focusedIndex,
      name: yearlyLuck.palaces[yearlyLuck.focusedIndex].name,
      gan: yearlyLuck.palaces[yearlyLuck.focusedIndex].heavenlyStem,
      zhi: yearlyLuck.palaces[yearlyLuck.focusedIndex].earthlyBranch,
      year: currentYear,
      stars: []
    } : undefined
  };
}
