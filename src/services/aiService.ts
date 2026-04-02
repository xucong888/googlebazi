// 火山方舟 AI Service - 融合子平八字与紫微斗数的深度分析
const ARK_API_KEY = '92e7669d-4a53-49bb-99fa-e81262096cb6';
const ARK_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';
const MODEL_ID = 'ep-20260402174320-2ghnf';

// 构建融合分析提示词
function buildFusionPrompt(birthInfo: any, fateData: any, structuredAnalysis: any): string {
  const age = 2026 - birthInfo.year;
  
  return `
# Role
你是一位融合了子平八字与紫微斗数的资深命理专家。你不仅精通干支克泄，更能通过紫微星曜透视人性深层动机。

# Data Inputs (结构化数据，已计算)

## 1. 八字原局
| 柱位 | 天干 | 地支 | 十神 | 藏干 |
|------|------|------|------|------|
| 年柱 | ${fateData.bazi.pillars.year.gan} | ${fateData.bazi.pillars.year.zhi} | ${fateData.bazi.pillars.year.tenGod} | ${fateData.bazi.pillars.year.hiddenStems.map((h: any) => h.gan).join(',')} |
| 月柱 | ${fateData.bazi.pillars.month.gan} | ${fateData.bazi.pillars.month.zhi} | ${fateData.bazi.pillars.month.tenGod} | ${fateData.bazi.pillars.month.hiddenStems.map((h: any) => h.gan).join(',')} |
| 日柱 | ${fateData.bazi.pillars.day.gan} | ${fateData.bazi.pillars.day.zhi} | 日主 | ${fateData.bazi.pillars.day.hiddenStems.map((h: any) => h.gan).join(',')} |
| 时柱 | ${fateData.bazi.pillars.hour.gan} | ${fateData.bazi.pillars.hour.zhi} | ${fateData.bazi.pillars.hour.tenGod} | ${fateData.bazi.pillars.hour.hiddenStems.map((h: any) => h.gan).join(',')} |

## 2. 五行强弱占比（已精确计算）
| 五行 | 分数 | 占比 | 状态 |
|------|------|------|------|
| 木 | ${structuredAnalysis.fiveElements.scores['木']?.toFixed(1) || 0} | ${structuredAnalysis.fiveElements.percentages['木']?.toFixed(1) || 0}% | ${structuredAnalysis.fiveElements.dominant === '木' ? '最旺' : structuredAnalysis.fiveElements.weakest === '木' ? '最弱' : '平衡'} |
| 火 | ${structuredAnalysis.fiveElements.scores['火']?.toFixed(1) || 0} | ${structuredAnalysis.fiveElements.percentages['火']?.toFixed(1) || 0}% | ${structuredAnalysis.fiveElements.dominant === '火' ? '最旺' : structuredAnalysis.fiveElements.weakest === '火' ? '最弱' : '平衡'} |
| 土 | ${structuredAnalysis.fiveElements.scores['土']?.toFixed(1) || 0} | ${structuredAnalysis.fiveElements.percentages['土']?.toFixed(1) || 0}% | ${structuredAnalysis.fiveElements.dominant === '土' ? '最旺' : structuredAnalysis.fiveElements.weakest === '土' ? '最弱' : '平衡'} |
| 金 | ${structuredAnalysis.fiveElements.scores['金']?.toFixed(1) || 0} | ${structuredAnalysis.fiveElements.percentages['金']?.toFixed(1) || 0}% | ${structuredAnalysis.fiveElements.dominant === '金' ? '最旺' : structuredAnalysis.fiveElements.weakest === '金' ? '最弱' : '平衡'} |
| 水 | ${structuredAnalysis.fiveElements.scores['水']?.toFixed(1) || 0} | ${structuredAnalysis.fiveElements.percentages['水']?.toFixed(1) || 0}% | ${structuredAnalysis.fiveElements.dominant === '水' ? '最旺' : structuredAnalysis.fiveElements.weakest === '水' ? '最弱' : '平衡'} |

- 日主：${structuredAnalysis.dayMaster.gan}（${structuredAnalysis.dayMaster.element}，${structuredAnalysis.dayMaster.yinYang}）
- 日主强弱：${structuredAnalysis.strength.level}（得分：${structuredAnalysis.strength.score.toFixed(1)}）
- 判断依据：${structuredAnalysis.strength.reason}

## 3. 喜用神（已计算）
- 用神：${structuredAnalysis.xiYongShen.yongShen}（最需要）
- 喜神：${structuredAnalysis.xiYongShen.xiShen}（喜欢）
- 忌神：${structuredAnalysis.xiYongShen.jiShen}（忌讳）
- 分析：${structuredAnalysis.xiYongShen.reason}

## 4. 格局
- 格局名称：${structuredAnalysis.pattern.name}
- 格局说明：${structuredAnalysis.pattern.description}

## 5. 紫微斗数核心
- 命宫主星：${fateData.ziwei?.lifeMaster || '未知'}
- 身宫主星：${fateData.ziwei?.bodyMaster || '未知'}
- 生肖：${fateData.ziwei?.zodiac || '未知'}
- 财帛宫：${fateData.ziwei?.palaces?.find((p: any) => p.name === '财帛')?.majorStars.map((s: any) => s.name).join(',') || '未知'}
- 官禄宫：${fateData.ziwei?.palaces?.find((p: any) => p.name === '官禄')?.majorStars.map((s: any) => s.name).join(',') || '未知'}
- 夫妻宫：${fateData.ziwei?.palaces?.find((p: any) => p.name === '夫妻')?.majorStars.map((s: any) => s.name).join(',') || '未知'}

## 6. 其他信息
- 生命灵数：${fateData.lifeNumerology?.lifePathNumber || '未知'} - ${fateData.lifeNumerology?.meaning || ''}
- 西方星座：${fateData.westernZodiac || '未知'}
- 当前年份：2026年（用户${age}岁）

# Analysis Framework (必须遵循的逻辑链)

## 1. 格局定调
- 先看八字月令定旺衰，再看紫微命宫主星定性格底色
- 寻找两者的一致性（例如：八字伤官见官 + 紫微七杀 = 极强的反传统与开创力）

## 2. 多体系交叉证据
- **事业观**：结合八字官杀受克情况与紫微官禄宫主星，给出职业定位
- **财富观**：对比八字财星虚实与紫微财帛宫（如贪狼、武曲）的爆发力
- **感情观**：对比八字夫妻宫与紫微夫妻宫主星

## 3. 动态运势推演
- 结合当前流年干支对八字日主的冲合，以及紫微流年宫位的星曜变化
- 给出未来1-3年的具体转折点

# Tone & Style
- 称呼用户为"${birthInfo.name || '先生/女士'}"，语气要专业且充满人文关怀
- 拒绝模棱两可的套话，必须引用输入的数据作为证据（例如："由于你八字中${structuredAnalysis.fiveElements.weakest}气偏弱..."）
- 开篇要有共情，结合用户年龄（${age}岁）和人生阶段
- 结尾必须包含"大师寄语"，提供情绪价值和行动方案

# Output Structure
1. 开篇寄语（结合年龄和人生阶段的共情）
2. 核心结论摘要（一句话定论 + 关键节点 + 置信度声明）
3. 命运起伏（八字证据 + 过去3-5年复盘 + 未来转机）
4. 事业运（多体系交叉 + 具体建议）
5. 财运（八字证据 + 财富属性 + 风险提示）
6. 婚姻与家庭（情感模式 + 矛盾点 + 落地建议）
7. 健康（五行对应 + 调节建议）
8. 未来5年运势（2026-2031逐年分析）
9. 三大行动方案（极其具体、可操作）
10. 大师寄语（情绪价值 + 哲理）
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
          { role: 'system', content: '你是融合子平八字与紫微斗数的资深命理专家，基于结构化数据进行深度分析。' },
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
  const age = 2026 - birthInfo.year;
  const systemPrompt = `
你是融合子平八字与紫微斗数的资深命理专家。

用户基本信息：
- 姓名：${birthInfo.name || '未知'}
- 年龄：${age}岁（2026年）
- 日主：${structuredAnalysis.dayMaster.gan}（${structuredAnalysis.dayMaster.element}）
- 日主强弱：${structuredAnalysis.strength.level}
- 喜用神：${structuredAnalysis.xiYongShen.yongShen}（用神）、${structuredAnalysis.xiYongShen.xiShen}（喜神）
- 紫微命宫：${fateData.ziwei?.lifeMaster || '未知'}

请基于以上数据回答用户问题，必须引用数据作为依据，拒绝模棱两可的回答。
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
