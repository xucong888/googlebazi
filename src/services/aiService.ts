const ARK_API_KEY = ''; // Key lives in server.js — never expose in frontend bundle
const ARK_BASE_URL = '/deepseek-api/v1';
const MODEL_ID = 'deepseek-chat';

function getCurrentDaYun(daYun: any, virtualAge: number): string {
  if (!daYun?.pillars?.length) return '未知';
  const matched = daYun.pillars.find((d: any, i: number, arr: any[]) => {
    const nextAge = arr[i + 1]?.age ?? 999;
    return virtualAge >= d.age && virtualAge < nextAge;
  });
  return matched ? `${matched.pillar}（${matched.age}岁起，${matched.year}年）` : '未知';
}

function buildFusionPrompt(birthInfo: any, fateData: any, structuredAnalysis: any): string {
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthInfo.year;
  const virtualAge = age + 1;

  const bazi = fateData.bazi;
  const ziwei = fateData.ziwei;
  const western = fateData.western;
  const numerology = fateData.lifeNumerology;
  const mbti = fateData.mbti;

  const systemList = [
    bazi && '四柱八字',
    ziwei && '紫微斗数',
    western && '西洋本命星盘',
    numerology && '灵数',
    mbti && 'MBTI',
  ].filter(Boolean) as string[];

  const primarySystems = systemList.slice(0, 3).join('、');
  const auxSystems = systemList.slice(3).join('、');

  // 从格特别规则
  const sa = structuredAnalysis;
  const isFromGe = sa?.strength?.level === '极弱' &&
    Math.max(...Object.values(sa?.fiveElements?.percentages ?? {}) as number[]) > 35;
  const fromGeRule = isFromGe
    ? `\n**从格特别规则**：日主极弱（${sa.strength.score.toFixed(1)}分），五行独旺于${sa.fiveElements.dominant}，推断候选从格。从格以顺从旺神为吉，比劫印绶入运为忌；判断大运流年吉凶以是否顺势旺神为核心，不按普通扶抑法论。`
    : '';

  // ── 四柱八字证据块 ──
  let baziBlock = '';
  if (bazi && sa) {
    const p = bazi.pillars;
    const fmt = (hs: any[]) => hs?.map((h: any) => `${h.gan}(${h.tenGod})`).join('、') || '无';
    const recentDaYun = bazi.daYun?.pillars?.slice(0, 6)
      .map((d: any) => `${d.pillar}(${d.age}岁/${d.year}年)`).join(' → ') || '';

    baziBlock = `
【四柱八字结构化证据】
- 年柱：${p.year.gan}[${p.year.tenGod}] ${p.year.zhi}；藏干：${fmt(p.year.hiddenStems)}；纳音：${p.year.naYin}；空亡：${p.year.kongWang}；神煞：${p.year.shenSha?.join('、') || '无'}
- 月柱：${p.month.gan}[${p.month.tenGod}] ${p.month.zhi}；藏干：${fmt(p.month.hiddenStems)}；纳音：${p.month.naYin}；空亡：${p.month.kongWang}；神煞：${p.month.shenSha?.join('、') || '无'}
- 日柱：${p.day.gan}[日主] ${p.day.zhi}；藏干：${fmt(p.day.hiddenStems)}；纳音：${p.day.naYin}；空亡：${p.day.kongWang}；神煞：${p.day.shenSha?.join('、') || '无'}
- 时柱：${p.hour.gan}[${p.hour.tenGod}] ${p.hour.zhi}；藏干：${fmt(p.hour.hiddenStems)}；纳音：${p.hour.naYin}；空亡：${p.hour.kongWang}；神煞：${p.hour.shenSha?.join('、') || '无'}
- 日主：${sa.dayMaster.gan}（${sa.dayMaster.element}，${sa.dayMaster.yinYang}）
- 五行能量：木 ${sa.fiveElements.percentages['木']?.toFixed(1)}%（${bazi.fiveElements['木']?.strength}）｜火 ${sa.fiveElements.percentages['火']?.toFixed(1)}%（${bazi.fiveElements['火']?.strength}）｜土 ${sa.fiveElements.percentages['土']?.toFixed(1)}%（${bazi.fiveElements['土']?.strength}）｜金 ${sa.fiveElements.percentages['金']?.toFixed(1)}%（${bazi.fiveElements['金']?.strength}）｜水 ${sa.fiveElements.percentages['水']?.toFixed(1)}%（${bazi.fiveElements['水']?.strength}）
- 最强/最弱：${sa.fiveElements.dominant} / ${sa.fiveElements.weakest}
- 身强弱：${sa.strength.level}（${sa.strength.score.toFixed(1)}分）；${sa.strength.reason}
- 主格局：${sa.pattern.name}（${sa.pattern.description}）
- 喜用神：用神 ${sa.xiYongShen.yongShen}，喜神 ${sa.xiYongShen.xiShen}，忌神 ${sa.xiYongShen.jiShen}
- 干支关系：${bazi.relations?.map((r: any) => r.description).join('；') || '无'}
- 胎元/命宫/身宫：${bazi.taiYuan} / ${bazi.mingGong} / ${bazi.shenGong}
- 当前大运：${getCurrentDaYun(bazi.daYun, virtualAge)}
- 起运时间：${bazi.daYun.startYear}年（${bazi.daYun.startAge}岁）
- 近期大运序列：${recentDaYun}`;
  }

  // ── 紫微斗数证据块 ──
  let ziweiBlock = '';
  if (ziwei) {
    // Helper: format star with brightness and transformation
    const fmtStar = (s: any) => {
      const t = s.transformation;
      // Normalize short form ('禄') to full form ('化禄') for clarity
      const tFull = t === '禄' ? '化禄' : t === '权' ? '化权' : t === '科' ? '化科' : t === '忌' ? '化忌' : t;
      return `${s.name}${s.brightness ? '(' + s.brightness + ')' : ''}${tFull ? '[' + tFull + ']' : ''}`;
    };

    // Helper: format mutagen array ['太阳','武曲','太阴','天同'] → '太阳化禄、武曲化权、太阴化科、天同化忌'
    const fmtMutagen = (stars: string[]): string => {
      if (!Array.isArray(stars) || stars.length < 4) return '未知';
      const types = ['化禄', '化权', '化科', '化忌'];
      return stars.map((s, i) => `${s}${types[i]}`).join('、');
    };

    const keyPalaceNames = ['命宫', '财帛', '官禄', '夫妻', '迁移', '福德', '田宅', '疾厄'];
    const palaceLines = keyPalaceNames.map(name => {
      const palace = ziwei.palaces?.find((p: any) => p.name === name);
      if (!palace) return null;
      const major = palace.majorStars?.map(fmtStar).join('、') || '空宫';
      const minor = palace.minorStars?.map((s: any) => s.name).join('、');
      return `- ${name}（${palace.zhi}）：${major}${minor ? '；辅：' + minor : ''}`;
    }).filter(Boolean).join('\n');

    // Current decadal palace stars
    const decadalPalace = ziwei.decadal
      ? ziwei.palaces?.find((p: any) => p.name === ziwei.decadal!.name)
      : null;
    const decadalPalaceStars = decadalPalace?.majorStars?.map(fmtStar).join('、') || '空宫';

    const decadalLine = ziwei.decadal
      ? `\n- 当前大限：${ziwei.decadal.name}宫（${ziwei.decadal.gan}${ziwei.decadal.zhi}，${ziwei.decadal.range?.[0]}~${ziwei.decadal.range?.[1]}岁）；大限主星：${decadalPalaceStars}；大限四化：${fmtMutagen(ziwei.decadal.stars)}`
      : '';

    const yearlyLine = ziwei.yearly
      ? `\n- 流年：${ziwei.yearly.year}年 ${ziwei.yearly.name}宫（${ziwei.yearly.gan}${ziwei.yearly.zhi}）；流年四化：${fmtMutagen(ziwei.yearly.stars)}`
      : '';

    ziweiBlock = `
【紫微斗数结构化证据】
- 命主/身主：${ziwei.lifeMaster ?? '未知'} / ${ziwei.bodyMaster ?? '未知'}
${palaceLines}${decadalLine}${yearlyLine}`;
  }

  // ── 西洋星盘证据块 ──
  let westernBlock = '';
  if (western) {
    const keyPlanets = ['太阳', '月亮', '水星', '金星', '火星', '木星', '土星'];
    const planets = western.planetPositions
      ?.filter((p: any) => keyPlanets.includes(p.name))
      .map((p: any) => `${p.name} ${p.longitude.toFixed(1)}°`)
      .join('；') ?? '';
    const aspects = western.aspects?.slice(0, 5)
      .map((a: any) => `- ${a.name}：${a.description}`)
      .join('\n') ?? '';

    westernBlock = `
【西洋星盘结构化证据】
- 太阳星座：${western.sunSign}座
- 主要行星：${planets}
- 主要相位：
${aspects}`;
  }

  // ── 灵数证据块 ──
  const numerologyBlock = numerology
    ? `\n【灵数结构化证据】\n- 生命灵数：${numerology.lifePathNumber}（${numerology.meaning}）`
    : '';

  // ── MBTI证据块 ──
  const mbtiBlock = mbti
    ? `\n【MBTI参考】\n- 类型：${mbti.energy}${mbti.perception}${mbti.judgment}${mbti.lifestyle}`
    : '';

  return `你是一位精通${systemList.join('、')}的命理大师，说话直接有温度，分析有据可查，建议落地可执行，不写空泛鸡汤。

**输出规范（违反视为失败）**

【开头】直接从"## 核心结论"开始，严禁出现"好的""根据您提供""感谢""您好"等任何开场白。

【句式禁令】严禁使用以下句式模板：
- "不是…而是…" / "真正的X是…" / "与其…不如…" / "不仅仅是…更是…"
- "X不是Y，而是Z" 等转折排比
- 任何带有"公司""对方公司""您好"的句子
- 如实发现以上句式，必须重写为直接陈述句

【体系禁令】严禁"八字显示…紫微显示…"逐系罗列，必须交叉融合：
- 先给综合结论，再括号注明支撑体系
- ≥2体系指向同一结论 → 标注**高置信**
- 体系矛盾时 → 明确说"[A]指向X，[B]指向Y，综合判断：…"
- 每条论断引用至少1个具体数据（格局名、宫位、星名等）

**数据体系**
- 可用体系：${systemList.join('、')}
- 主体系：${primarySystems}${auxSystems ? '；辅体系：' + auxSystems : ''}
- 成长/婚恋/事业建议按周岁 ${age} 岁；大运流年时间轴按虚岁 ${virtualAge} 岁
${fromGeRule}

**命主信息**
- 姓名：${birthInfo.name || '未知'}；当前周岁约 ${age} 岁（虚岁约 ${virtualAge} 岁）；当前年份：${currentYear}年
- 出生：${birthInfo.year}年${birthInfo.month}月${birthInfo.day}日 ${birthInfo.hour}时${birthInfo.minute || 0}分；性别：${birthInfo.gender === 'male' ? '男' : '女'}
${baziBlock}
${ziweiBlock}
${westernBlock}
${numerologyBlock}
${mbtiBlock}

**输出结构（约2000-2500字，每模块须有交叉印证结论，覆盖核心证据后立即收尾）**

## 核心结论
列3-5条高置信结论，每条格式：结论本身（支撑体系）。直接陈述，不用排比句。

## 命运起伏
关键转折点，时间轴以大运/大限为锚，给出具体年龄/年份。

## 事业运
综合判断 → 关键证据 → 最适合的具体方向（不超过3个）。

## 财运
综合判断 → 关键证据 → 风险节点与机遇窗口。

## 婚姻与家庭
综合判断 → 关键证据 → 给出1条具体可操作的建议。

## 健康
综合判断 → 需关注的具体方向（器官/时段）。

## 未来5年运势（${currentYear}–${currentYear + 5}）
按大运节点或关键年份，交叉体系逐段判断，每段不超过3句。

## 行动方案
3条可在3个月内落地的具体行动，每条注明命理依据。

## 大师寄语
结合命主当前 ${age} 岁的实际处境写1段话，有温度有锋芒，点出最值得关注的1件事。语言直接，不写鸡汤，不用排比，不出现"您好"或任何客套语。`;
}

export async function getUnifiedInterpretation(
  birthInfo: any,
  fateData: any,
  structuredAnalysis: any,
  depth: 'quick' | 'deep' = 'deep',
  onChunk?: (chunk: string) => void
) {
  const prompt = buildFusionPrompt(birthInfo, fateData, structuredAnalysis);

  try {
    const response = await fetch(`${ARK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ARK_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL_ID,
        messages: [
          { role: 'system', content: '你是一位精通八字、紫微斗数、西洋星盘的命理大师。风格：直接说结论，不用"不是…而是…""真正…是…""与其…不如…"等排比句式，不以"好的""根据您提供"等客服开场白开头，直接进入正文输出。禁止出现"您好""公司""对方公司"等无关词语。' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.75,
        max_tokens: depth === 'deep' ? 4000 : 2500,
        stream: !!onChunk,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('AI API Error:', error);
      return '抱歉，AI 解读暂时无法生成，请稍后再试。';
    }

    if (onChunk && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullContent += content;
              onChunk(content);
            }
          } catch {}
        }
      }
      return fullContent || '抱歉，AI 解读暂时无法生成，请稍后再试。';
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error: any) {
    console.error('AI Interpretation Error:', error?.message || String(error));
    return '抱歉，AI 解读暂时无法生成，请稍后再试。';
  }
}

export async function chatWithMaster(
  birthInfo: any,
  fateData: any,
  structuredAnalysis: any,
  history: { role: 'user' | 'model'; text: string }[],
  message: string
) {
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthInfo.year;
  const virtualAge = age + 1;
  const sa = structuredAnalysis;
  const bazi = fateData.bazi;
  const ziwei = fateData.ziwei;

  // Full BaZi 大运 sequence
  let daYunBlock = '未知';
  let currentDaYunStr = '未知';
  if (bazi?.daYun?.pillars?.length) {
    const pillars = bazi.daYun.pillars;
    const curIdx = pillars.findIndex((d: any, i: number) => {
      const nextAge = pillars[i + 1]?.age ?? 999;
      return virtualAge >= d.age && virtualAge < nextAge;
    });
    daYunBlock = pillars.map((d: any, i: number) => {
      const isCur = i === curIdx;
      const endAge = pillars[i + 1]?.age ? pillars[i + 1].age - 1 : '终';
      return `${isCur ? '▶' : ' '} ${d.pillar} ${d.age}~${endAge}岁（${d.year}年起）`;
    }).join('\n');
    if (curIdx >= 0) currentDaYunStr = `${pillars[curIdx].pillar}（${pillars[curIdx].age}岁起，${pillars[curIdx].year}年）`;
  }

  // Ziwei current & next 大限
  let ziweiDecadalBlock = '';
  if (ziwei?.palaces?.length) {
    const sorted = [...ziwei.palaces]
      .filter((p: any) => p.decadal?.range?.length === 2)
      .sort((a: any, b: any) => a.decadal.range[0] - b.decadal.range[0]);
    const curPIdx = sorted.findIndex((p: any) => virtualAge >= p.decadal.range[0] && virtualAge <= p.decadal.range[1]);
    const buildPalaceDesc = (p: any, label: string) => {
      if (!p) return '';
      const stars = p.majorStars?.map((s: any) => s.name).join('、') || '空';
      const mutagen = p.decadal?.mutagen || ziwei.decadal?.stars || [];
      const mutagenStr = Array.isArray(mutagen) && mutagen.length >= 4
        ? `化禄:${mutagen[0]} 化权:${mutagen[1]} 化科:${mutagen[2]} 化忌:${mutagen[3]}`
        : '';
      return `${label}大限：${p.name}宫 ${p.decadal.range[0]}~${p.decadal.range[1]}岁，主星：${stars}${mutagenStr ? '，四化：' + mutagenStr : ''}`;
    };
    const curP = curPIdx >= 0 ? sorted[curPIdx] : null;
    const nxtP = curPIdx >= 0 ? sorted[curPIdx + 1] : null;
    ziweiDecadalBlock = [
      buildPalaceDesc(curP, '当前'),
      buildPalaceDesc(nxtP, '下一'),
    ].filter(Boolean).join('\n');
  }

  const lifePalaceStars = ziwei?.palaces?.find((p: any) => p.name === '命宫')
    ?.majorStars?.map((s: any) => s.name).join('、') || '未知';

  const systemPrompt = `你是一位博学严谨的命理大师，善于多体系交叉印证，给出有理有据、有温度、可落地的分析。

命主核心命盘（对话参考）：
- 姓名：${birthInfo.name || '未知'}，当前 ${age} 岁，${currentYear}年
- 日主：${sa?.dayMaster?.gan || '未知'}（${sa?.dayMaster?.element || '未知'}），身强弱：${sa?.strength?.level || '未知'}
- 主格局：${sa?.pattern?.name || '未知'}；用神：${sa?.xiYongShen?.yongShen || '未知'}，喜神：${sa?.xiYongShen?.xiShen || '未知'}，忌神：${sa?.xiYongShen?.jiShen || '未知'}
- 五行：木 ${sa?.fiveElements?.percentages?.['木']?.toFixed(1) || 0}%｜火 ${sa?.fiveElements?.percentages?.['火']?.toFixed(1) || 0}%｜土 ${sa?.fiveElements?.percentages?.['土']?.toFixed(1) || 0}%｜金 ${sa?.fiveElements?.percentages?.['金']?.toFixed(1) || 0}%｜水 ${sa?.fiveElements?.percentages?.['水']?.toFixed(1) || 0}%

【八字大运序列】
${daYunBlock}

${ziwei ? `【紫微大限】
${ziweiDecadalBlock || '未知'}
- 命宫主星：${lifePalaceStars}；命主/身主：${ziwei.lifeMaster || '未知'} / ${ziwei.bodyMaster || '未知'}` : ''}

回答要求：
1. 必须基于以上命盘数据，禁止编造无据内容
2. 回答时间性问题须引用大运干支和年龄段，给出具体时间范围
3. 八字与紫微要相互印证，引用具体证据
4. 回答简洁具体，给出可执行建议
5. 如问题超出命盘范围，如实说明`;

  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map(m => ({
        role: m.role === 'model' ? 'assistant' : 'user',
        content: m.text,
      })),
      { role: 'user', content: message },
    ];

    const response = await fetch(`${ARK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ARK_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL_ID,
        messages,
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('AI Chat Error:', error);
      return '抱歉，大师现在有点忙，请稍后再问。';
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error: any) {
    console.error('AI Chat Error:', error?.message || String(error));
    return '抱歉，大师现在有点忙，请稍后再问。';
  }
}
