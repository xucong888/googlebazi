// 火山方舟 AI Service - 融合子平八字与紫微斗数的深度分析
const ARK_API_KEY = '92e7669d-4a53-49bb-99fa-e81262096cb6';
const ARK_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';
const MODEL_ID = 'ep-20260402174320-2ghnf';

// 提取紫微斗数完整信息（含四化）
function extractZiweiFull(ziweiData: any) {
  if (!ziweiData || !ziweiData.palaces) return null;
  
  const info: any = {
    lifeMaster: ziweiData.lifeMaster || '未知',
    bodyMaster: ziweiData.bodyMaster || '未知',
    zodiac: ziweiData.zodiac || '未知',
    palaces: {},
    sihua: { lu: [], quan: [], ke: [], ji: [] } // 生年四化
  };
  
  // 提取关键宫位
  const keyPalaces = ['命宫', '财帛', '官禄', '夫妻', '迁移', '福德', '身宫'];
  keyPalaces.forEach(name => {
    const palace = ziweiData.palaces.find((p: any) => p.name === name);
    if (palace) {
      info.palaces[name] = {
        gan: palace.gan || '',
        zhi: palace.zhi || '',
        majorStars: palace.majorStars?.map((s: any) => ({
          name: s.name,
          brightness: s.brightness,
          transformation: s.transformation
        })) || [],
        minorStars: palace.minorStars?.map((s: any) => ({
          name: s.name,
          transformation: s.transformation
        })) || [],
        allStars: [...(palace.majorStars || []), ...(palace.minorStars || [])]
          .filter((s: any) => s.transformation)
          .map((s: any) => ({ name: s.name, transformation: s.transformation }))
      };
      
      // 收集四化
      [...(palace.majorStars || []), ...(palace.minorStars || [])].forEach((s: any) => {
        if (s.transformation) {
          const type = s.transformation.replace('化', '');
          if (info.sihua[type]) {
            info.sihua[type].push({
              star: s.name,
              palace: name,
              brightness: s.brightness
            });
          }
        }
      });
    }
  });
  
  // 找到身宫位置
  const bodyPalace = ziweiData.palaces.find((p: any) => p.name === '命宫' && p.isBodyPalace);
  info.bodyPalaceLocation = bodyPalace ? '命宫' : (ziweiData.palaces.find((p: any) => 
    p.majorStars?.some((s: any) => s.name === info.bodyMaster)
  )?.name || '未知');
  
  return info;
}

// 三位一体分析框架
function buildTrinityAnalysis(ziweiInfo: any, baziData: any, structuredAnalysis: any) {
  const analysis: any = {
    career: {},
    wealth: {},
    marriage: {},
    personality: {},
    turningPoints: []
  };
  
  // 1. 事业分析：官禄宫主星 + 八字十神 + 化权/化科
  const careerPalace = ziweiInfo?.palaces?.['官禄'];
  const careerStars = careerPalace?.majorStars || [];
  const careerSihua = careerPalace?.allStars || [];
  
  analysis.career = {
    palaceStars: careerStars.map((s: any) => s.name).join('、'),
    coreStar: careerStars[0]?.name,
    huaQuan: careerSihua.find((s: any) => s.transformation === '化权'),
    huaKe: careerSihua.find((s: any) => s.transformation === '化科'),
    pattern: analyzeCareerPattern(careerStars, structuredAnalysis?.pattern?.name)
  };
  
  // 2. 财富分析：财帛宫 + 八字财星 + 化禄
  const wealthPalace = ziweiInfo?.palaces?.['财帛'];
  const wealthStars = wealthPalace?.majorStars || [];
  
  analysis.wealth = {
    palaceStars: wealthStars.map((s: any) => s.name).join('、'),
    huaLu: ziweiInfo?.sihua?.lu?.find((s: any) => 
      ['财帛', '命宫', '官禄'].includes(s.palace)),
    pattern: analyzeWealthPattern(wealthStars, structuredAnalysis?.xiYongShen)
  };
  
  // 3. 婚姻分析：夫妻宫 + 福德宫联动 + 八字夫妻宫
  const marriagePalace = ziweiInfo?.palaces?.['夫妻'];
  const fortunePalace = ziweiInfo?.palaces?.['福德'];
  
  analysis.marriage = {
    spousePalace: marriagePalace?.majorStars?.map((s: any) => s.name).join('、'),
    fortunePalace: fortunePalace?.majorStars?.map((s: any) => s.name).join('、'),
    huaJi: ziweiInfo?.sihua?.ji?.find((s: any) => 
      ['夫妻', '福德', '命宫'].includes(s.palace)),
    conflict: analyzeMarriageConflict(marriagePalace, fortunePalace)
  };
  
  // 4. 性格分析：命宫 + 身宫 + 八字日主
  const lifePalace = ziweiInfo?.palaces?.['命宫'];
  const bodyPalace = ziweiInfo?.palaces?.[ziweiInfo?.bodyPalaceLocation];
  
  analysis.personality = {
    lifeStars: lifePalace?.majorStars?.map((s: any) => s.name).join('、'),
    bodyPalace: ziweiInfo?.bodyPalaceLocation,
    bodyStars: bodyPalace?.majorStars?.map((s: any) => s.name).join('、'),
    tension: analyzePersonalityTension(lifePalace, bodyPalace, structuredAnalysis?.dayMaster)
  };
  
  // 5. 关键转折点
  analysis.turningPoints = identifyTurningPoints(ziweiInfo, structuredAnalysis);
  
  return analysis;
}

// 分析事业格局
function analyzeCareerPattern(stars: any[], baziPattern: string) {
  const starNames = stars.map((s: any) => s.name);
  
  if (starNames.includes('紫微') && starNames.includes('天府')) 
    return '领导型：适合管理岗位，有统御能力';
  if (starNames.includes('天机')) 
    return '智谋型：适合策划、技术、顾问工作';
  if (starNames.includes('太阳')) 
    return '发散型：适合公关、教育、传播行业';
  if (starNames.includes('武曲')) 
    return '执行型：适合金融、工程、实业';
  if (starNames.includes('天同')) 
    return '服务型：适合医疗、服务、艺术';
  if (starNames.includes('廉贞')) 
    return '开创型：适合创业、销售、竞争性行业';
  if (starNames.includes('七杀')) 
    return '开创型：适合军警、外科、高风险高回报行业';
  if (starNames.includes('破军')) 
    return '变革型：适合改革、创新、破旧立新';
  
  return '稳健型：适合专业深耕，逐步积累';
}

// 分析财富格局
function analyzeWealthPattern(stars: any[], xiYongShen: any) {
  const starNames = stars.map((s: any) => s.name);
  
  if (starNames.includes('武曲') && starNames.includes('贪狼')) 
    return '横发型：有暴富机会，但波动大';
  if (starNames.includes('天府')) 
    return '守成型：善于理财积累，稳健增值';
  if (starNames.includes('太阴')) 
    return '计划型：适合长线投资，不动产';
  if (starNames.includes('天梁')) 
    return '荫庇型：靠贵人、长辈、专业口碑获利';
  if (starNames.includes('天机')) 
    return '智取型：靠信息差、策略获利';
  
  return '劳碌型：靠专业能力、辛勤工作获利';
}

// 分析婚姻矛盾点
function analyzeMarriageConflict(marriagePalace: any, fortunePalace: any) {
  const marriageStars = marriagePalace?.majorStars?.map((s: any) => s.name) || [];
  const fortuneStars = fortunePalace?.majorStars?.map((s: any) => s.name) || [];
  
  const conflicts = [];
  
  // 夫妻宫 vs 福德宫的冲突
  if (marriageStars.some((s: string) => ['七杀', '破军', '贪狼'].includes(s)) &&
      fortuneStars.some((s: string) => ['天同', '天梁', '太阴'].includes(s))) {
    conflicts.push('外在关系激烈 vs 内心渴望安稳');
  }
  
  if (marriageStars.some((s: string) => ['紫微', '天府'].includes(s)) &&
      fortuneStars.some((s: string) => ['天机', '巨门'].includes(s))) {
    conflicts.push('对伴侣要求高 vs 内心多思虑');
  }
  
  if (marriageStars.some((s: string) => ['廉贞', '贪狼'].includes(s))) {
    conflicts.push('感情要求高，易有桃花困扰');
  }
  
  return conflicts.length > 0 ? conflicts : ['无明显冲突，关系较为和谐'];
}

// 分析性格张力
function analyzePersonalityTension(lifePalace: any, bodyPalace: any, dayMaster: any) {
  const lifeStars = lifePalace?.majorStars?.map((s: any) => s.name) || [];
  const bodyStars = bodyPalace?.majorStars?.map((s: any) => s.name) || [];
  
  const tensions = [];
  
  // 命宫 vs 身宫的张力
  if (lifeStars.some((s: string) => ['七杀', '破军', '廉贞'].includes(s)) &&
      bodyStars.some((s: string) => ['天同', '天梁'].includes(s))) {
    tensions.push('外在强势进取 vs 内心渴望安逸');
  }
  
  if (lifeStars.some((s: string) => ['紫微', '天府', '天相'].includes(s)) &&
      bodyStars.some((s: string) => ['天机', '巨门'].includes(s))) {
    tensions.push('外在稳重得体 vs 内心多思多虑');
  }
  
  if (lifeStars.some((s: string) => ['太阳', '巨门'].includes(s))) {
    tensions.push('外热内冷，表达与内心的落差');
  }
  
  return tensions.length > 0 ? tensions : ['性格较为统一，内外一致'];
}

// 识别关键转折点
function identifyTurningPoints(ziweiInfo: any, structuredAnalysis: any) {
  const points = [];
  
  // 基于大运的转折点
  const currentYear = 2026;
  const age = 30; // 假设，实际应从birthInfo计算
  
  // 化忌所在宫位的年份需要特别注意
  const huaJi = ziweiInfo?.sihua?.ji?.[0];
  if (huaJi) {
    points.push({
      year: currentYear + 2,
      age: age + 2,
      event: `${huaJi.palace}受冲，需特别注意`,
      type: '挑战'
    });
  }
  
  // 化禄所在宫位的年份是机会
  const huaLu = ziweiInfo?.sihua?.lu?.[0];
  if (huaLu) {
    points.push({
      year: currentYear + 1,
      age: age + 1,
      event: `${huaLu.palace}得禄，机会显现`,
      type: '机遇'
    });
  }
  
  return points;
}

// 构建融合分析提示词
function buildFusionPrompt(birthInfo: any, fateData: any, structuredAnalysis: any): string {
  const age = 2026 - birthInfo.year;
  const ziweiInfo = extractZiweiFull(fateData.ziwei);
  const trinity = buildTrinityAnalysis(ziweiInfo, fateData.bazi, structuredAnalysis);
  
  return `
# Role
你是一位融合了子平八字与紫微斗数的资深命理专家，扮演"人生架构师"而非"翻译员"。

# 核心任务
综合八字与紫微命盘，分析用户在【性格A】与【性格B】之间的张力与平衡，找到人生的关键转折点。

# 结构化数据（必须引用）

## 1. 八字量化数据
| 五行 | 分数 | 占比 | 状态 |
|------|------|------|------|
| 木 | ${structuredAnalysis?.fiveElements?.scores?.['木']?.toFixed(1) || 0} | ${structuredAnalysis?.fiveElements?.percentages?.['木']?.toFixed(1) || 0}% | ${structuredAnalysis?.fiveElements?.weakest === '木' ? '最弱' : structuredAnalysis?.fiveElements?.dominant === '木' ? '最旺' : '平衡'} |
| 火 | ${structuredAnalysis?.fiveElements?.scores?.['火']?.toFixed(1) || 0} | ${structuredAnalysis?.fiveElements?.percentages?.['火']?.toFixed(1) || 0}% | ${structuredAnalysis?.fiveElements?.weakest === '火' ? '最弱' : structuredAnalysis?.fiveElements?.dominant === '火' ? '最旺' : '平衡'} |
| 土 | ${structuredAnalysis?.fiveElements?.scores?.['土']?.toFixed(1) || 0} | ${structuredAnalysis?.fiveElements?.percentages?.['土']?.toFixed(1) || 0}% | ${structuredAnalysis?.fiveElements?.weakest === '土' ? '最弱' : structuredAnalysis?.fiveElements?.dominant === '土' ? '最旺' : '平衡'} |
| 金 | ${structuredAnalysis?.fiveElements?.scores?.['金']?.toFixed(1) || 0} | ${structuredAnalysis?.fiveElements?.percentages?.['金']?.toFixed(1) || 0}% | ${structuredAnalysis?.fiveElements?.weakest === '金' ? '最弱' : structuredAnalysis?.fiveElements?.dominant === '金' ? '最旺' : '平衡'} |
| 水 | ${structuredAnalysis?.fiveElements?.scores?.['水']?.toFixed(1) || 0} | ${structuredAnalysis?.fiveElements?.percentages?.['水']?.toFixed(1) || 0}% | ${structuredAnalysis?.fiveElements?.weakest === '水' ? '最弱' : structuredAnalysis?.fiveElements?.dominant === '水' ? '最旺' : '平衡'} |

- 日主：${structuredAnalysis?.dayMaster?.gan || '未知'}（${structuredAnalysis?.dayMaster?.element || '未知'}）
- 日主强弱：${structuredAnalysis?.strength?.level || '未知'}
- 格局：${structuredAnalysis?.pattern?.name || '未知'}

## 2. 紫微核心数据
- **命宫**：${ziweiInfo?.palaces?.['命宫']?.zhi || '未知'}宫，主星：${ziweiInfo?.palaces?.['命宫']?.majorStars?.map((s: any) => s.name).join('、') || '未知'}
- **身宫**：位于${ziweiInfo?.bodyPalaceLocation || '未知'}，主星：${ziweiInfo?.palaces?.[ziweiInfo?.bodyPalaceLocation]?.majorStars?.map((s: any) => s.name).join('、') || '未知'}
- **官禄宫**：${ziweiInfo?.palaces?.['官禄']?.zhi || '未知'}宫，主星：${ziweiInfo?.palaces?.['官禄']?.majorStars?.map((s: any) => s.name).join('、') || '未知'}
- **财帛宫**：${ziweiInfo?.palaces?.['财帛']?.zhi || '未知'}宫，主星：${ziweiInfo?.palaces?.['财帛']?.majorStars?.map((s: any) => s.name).join('、') || '未知'}
- **夫妻宫**：${ziweiInfo?.palaces?.['夫妻']?.zhi || '未知'}宫，主星：${ziweiInfo?.palaces?.['夫妻']?.majorStars?.map((s: any) => s.name).join('、') || '未知'}
- **福德宫**：${ziweiInfo?.palaces?.['福德']?.zhi || '未知'}宫，主星：${ziweiInfo?.palaces?.['福德']?.majorStars?.map((s: any) => s.name).join('、') || '未知'}

## 3. 生年四化（关键！）
- **化禄**：${ziweiInfo?.sihua?.lu?.map((s: any) => `${s.star}在${s.palace}`).join('、') || '无'}
- **化权**：${ziweiInfo?.sihua?.quan?.map((s: any) => `${s.star}在${s.palace}`).join('、') || '无'}
- **化科**：${ziweiInfo?.sihua?.ke?.map((s: any) => `${s.star}在${s.palace}`).join('、') || '无'}
- **化忌**：${ziweiInfo?.sihua?.ji?.map((s: any) => `${s.star}在${s.palace}`).join('、') || '无'}

## 4. 三位一体分析结果
- **事业格局**：${trinity.career.pattern}
- **财富格局**：${trinity.wealth.pattern}
- **婚姻矛盾点**：${trinity.marriage.conflict?.join('；')}
- **性格张力**：${trinity.personality.tension?.join('；')}

# 分析框架（必须遵循）

## 1. 开篇定调（禁用"你好，你是XX格局"）
改为："综合八字与紫微命盘，我发现你是一个在【${trinity.personality.tension?.[0]?.split(' vs ')?.[0] || '外在表现'}】与【${trinity.personality.tension?.[0]?.split(' vs ')?.[1] || '内心需求'}】之间寻找平衡的人。"

## 2. 事业分析（强制关联）
- 必须引用官禄宫主星 + 八字十神
- 必须查找化权或化科星，定义为"职业护城河"
- 示例："你的八字带${structuredAnalysis?.pattern?.name?.includes('杀') ? '七杀' : '正官'}，配合紫微官禄宫的${trinity.career.coreStar}，说明你的${trinity.career.coreStar === '天机' ? '智谋是内敛的，适合幕后运筹帷幄' : '能量是外放的，适合开创性工作'}。"

## 3. 财富分析（深度引用）
- 必须结合财帛宫主星 + 八字财星 + 化禄位置
- 分析"横发"还是"积累"的动态逻辑

## 4. 婚姻分析（宫位联动）
- 必须检查夫妻宫与福德宫的联动
- 必须分析化忌所在宫位的"执念所在"

## 5. 关键转折点（找到"变轨"年份）
- 明确指出从"寻找资源"转向"建立权威"的转折年份
- 结合大运和流年分析

# 文风要求
- 咨询顾问风，使用"价值沉淀"、"野心驱动"、"置信度声明"等高级词汇
- 拒绝传统算命术语（"印绶护身"、"用神到位"等）
- 专业且充满人文关怀
- 所有结论必须注明数据来源（"八字显示..."、"紫微命宫..."、"化忌在..."）

# 输出结构
1. 开篇寄语（性格张力定调）
2. 核心结论摘要（一句话定论 + 关键转折点 + 置信度声明）
3. 命运起伏（八字证据 + 紫微印证 + 过去复盘 + 未来转机）
4. 事业运（三位一体交叉 + 职业护城河分析）
5. 财运（财富格局 + 横发/积累逻辑）
6. 婚姻与家庭（宫位联动 + 执念分析）
7. 健康（五行对应 + 化忌提示）
8. 未来5年运势（找到变轨年份）
9. 三大行动方案（利用星曜特质）
10. 大师寄语（情绪价值 + 行动方向）
`;
}

export async function getUnifiedInterpretation(
  birthInfo: any, 
  fateData: any, 
  structuredAnalysis: any,
  depth: 'quick' | 'deep' = 'deep'
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
          { role: 'system', content: '你是融合子平八字与紫微斗数的资深命理专家，扮演人生架构师。必须基于提供的数据进行深度交叉验证，引用四化信息，找到性格张力与人生转折点。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: depth === 'deep' ? 4000 : 2500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Ark API Error:", error);
      return "抱歉，AI 解读暂时无法生成。请稍后再试。";
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error: any) {
    console.error("AI Interpretation Error:", error?.message || String(error));
    return "抱歉，AI 解读暂时无法生成。请稍后再试。";
  }
}

export async function chatWithMaster(
  birthInfo: any, 
  fateData: any, 
  structuredAnalysis: any,
  history: { role: 'user' | 'model'; text: string }[], 
  message: string
) {
  const age = 2026 - birthInfo?.year || 30;
  const ziweiInfo = extractZiweiFull(fateData?.ziwei);
  
  const systemPrompt = `
你是融合子平八字与紫微斗数的资深命理专家，扮演人生架构师。

用户命盘核心数据：
- 姓名：${birthInfo?.name || '未知'}
- 年龄：${age}岁（2026年）
- 日主：${structuredAnalysis?.dayMaster?.gan || '未知'}（${structuredAnalysis?.dayMaster?.element || '未知'}）
- 日主强弱：${structuredAnalysis?.strength?.level || '未知'}
- 喜用神：${structuredAnalysis?.xiYongShen?.yongShen || '未知'}
- 紫微命宫：${ziweiInfo?.palaces?.['命宫']?.majorStars?.map((s: any) => s.name).join('、') || '未知'}
- 生年四化：禄(${ziweiInfo?.sihua?.lu?.[0]?.star || '无'}) 权(${ziweiInfo?.sihua?.quan?.[0]?.star || '无'}) 科(${ziweiInfo?.sihua?.ke?.[0]?.star || '无'}) 忌(${ziweiInfo?.sihua?.ji?.[0]?.star || '无'})

回答要求：
1. 必须基于以上数据，禁止编造
2. 八字和紫微要相互印证，引用四化信息
3. 用"人生架构师"的口吻，而非"翻译员"
4. 分析性格张力和人生转折点
5. 注明数据来源
`;

  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map(m => ({
        role: m.role === 'model' ? 'assistant' : 'user',
        content: m.text
      })),
      { role: 'user', content: message }
    ];

    const response = await fetch(`${ARK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ARK_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL_ID,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Ark API Error:", error);
      return "抱歉，大师现在有点忙，请稍后再问。";
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error: any) {
    console.error("AI Chat Error:", error?.message || String(error));
    return "抱歉，大师现在有点忙，请稍后再问。";
  }
}
