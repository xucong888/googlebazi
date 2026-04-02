// 火山方舟 AI Service - 使用结构化数据和分步推理
const ARK_API_KEY = '92e7669d-4a53-49bb-99fa-e81262096cb6';
const ARK_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';
const MODEL_ID = 'ep-20260402174320-2ghnf';

// 构建结构化提示词
function buildStructuredPrompt(birthInfo: any, fateData: any, structuredAnalysis: any): string {
  return `
# 八字命盘结构化数据

## 1. 基本信息
- 姓名: ${birthInfo.name || '未知'}
- 性别: ${birthInfo.gender === 'male' ? '男' : '女'}
- 出生日期: ${birthInfo.year}年${birthInfo.month}月${birthInfo.day}日
- 出生时间: ${birthInfo.hour}时${birthInfo.minute || 0}分
- 当前年份: 2026年（请据此计算实际年龄）

## 2. 四柱八字
| 柱位 | 天干 | 地支 | 十神 |
|------|------|------|------|
| 年柱 | ${fateData.bazi.pillars.year.gan} | ${fateData.bazi.pillars.year.zhi} | ${fateData.bazi.pillars.year.tenGod} |
| 月柱 | ${fateData.bazi.pillars.month.gan} | ${fateData.bazi.pillars.month.zhi} | ${fateData.bazi.pillars.month.tenGod} |
| 日柱 | ${fateData.bazi.pillars.day.gan} | ${fateData.bazi.pillars.day.zhi} | 日主 |
| 时柱 | ${fateData.bazi.pillars.hour.gan} | ${fateData.bazi.pillars.hour.zhi} | ${fateData.bazi.pillars.hour.tenGod} |

## 3. 五行分析（已计算）
| 五行 | 分数 | 占比 | 状态 |
|------|------|------|------|
| 木 | ${structuredAnalysis.fiveElements.scores['木']?.toFixed(1) || 0} | ${structuredAnalysis.fiveElements.percentages['木']?.toFixed(1) || 0}% | ${structuredAnalysis.fiveElements.dominant === '木' ? '最旺' : structuredAnalysis.fiveElements.weakest === '木' ? '最弱' : '正常'} |
| 火 | ${structuredAnalysis.fiveElements.scores['火']?.toFixed(1) || 0} | ${structuredAnalysis.fiveElements.percentages['火']?.toFixed(1) || 0}% | ${structuredAnalysis.fiveElements.dominant === '火' ? '最旺' : structuredAnalysis.fiveElements.weakest === '火' ? '最弱' : '正常'} |
| 土 | ${structuredAnalysis.fiveElements.scores['土']?.toFixed(1) || 0} | ${structuredAnalysis.fiveElements.percentages['土']?.toFixed(1) || 0}% | ${structuredAnalysis.fiveElements.dominant === '土' ? '最旺' : structuredAnalysis.fiveElements.weakest === '土' ? '最弱' : '正常'} |
| 金 | ${structuredAnalysis.fiveElements.scores['金']?.toFixed(1) || 0} | ${structuredAnalysis.fiveElements.percentages['金']?.toFixed(1) || 0}% | ${structuredAnalysis.fiveElements.dominant === '金' ? '最旺' : structuredAnalysis.fiveElements.weakest === '金' ? '最弱' : '正常'} |
| 水 | ${structuredAnalysis.fiveElements.scores['水']?.toFixed(1) || 0} | ${structuredAnalysis.fiveElements.percentages['水']?.toFixed(1) || 0}% | ${structuredAnalysis.fiveElements.dominant === '水' ? '最旺' : structuredAnalysis.fiveElements.weakest === '水' ? '最弱' : '正常'} |

## 4. 日主强弱（已计算）
- 日主: ${structuredAnalysis.dayMaster.gan}（${structuredAnalysis.dayMaster.element}）
- 强弱等级: ${structuredAnalysis.strength.level}
- 计算得分: ${structuredAnalysis.strength.score.toFixed(1)}
- 判断依据: ${structuredAnalysis.strength.reason}

## 5. 喜用神（已计算）
- 用神: ${structuredAnalysis.xiYongShen.yongShen}（最需要）
- 喜神: ${structuredAnalysis.xiYongShen.xiShen}（喜欢）
- 忌神: ${structuredAnalysis.xiYongShen.jiShen}（忌讳）
- 分析: ${structuredAnalysis.xiYongShen.reason}

## 6. 格局（已计算）
- 格局名称: ${structuredAnalysis.pattern.name}
- 格局说明: ${structuredAnalysis.pattern.description}

## 7. 关键关系
${structuredAnalysis.relations.map((r: any) => `- ${r.type}: ${r.description}`).join('\n')}

## 8. 紫微斗数概要
- 命宫主星: ${fateData.ziwei?.lifeMaster || '未知'}
- 身宫主星: ${fateData.ziwei?.bodyMaster || '未知'}
- 生肖: ${fateData.ziwei?.zodiac || '未知'}

## 9. 其他信息
- 生命灵数: ${fateData.lifeNumerology?.lifePathNumber || '未知'}
- MBTI: ${fateData.mbti?.type || '未知'}
- 西方星座: ${fateData.westernZodiac || '未知'}
`;
}

// 分步推理提示词
const STEP_BY_STEP_PROMPT = `
# 角色设定
你是一位专业的八字命理分析师。我将为你提供已经计算好的结构化数据，请你基于这些数据进行解读和润色。

# 重要说明
**你不需要重新计算五行、日主强弱、喜用神等，这些数据已经在"结构化数据"中提供。你的任务是基于这些计算结果进行专业解读。**

# 分析步骤（请按此顺序）

## Step 1: 日主分析
基于提供的"日主强弱"和"喜用神"数据，分析：
- 日主${'{'}dayMaster{'}'}的特质
- 为什么日主是${'{'}strength.level{'}'}（引用计算得分）
- 喜用神如何影响命主的人生

## Step 2: 性格分析
基于日主、十神配置和格局，分析：
- 核心性格特质
- 优点和缺点
- 与他人的相处模式

## Step 3: 事业财运
基于喜用神、格局和十神，分析：
- 适合的行业和职业
- 财运特点（正财/偏财）
- 事业发展建议

## Step 4: 感情婚姻
基于日支（夫妻宫）和十神，分析：
- 感情模式
- 择偶倾向
- 婚姻建议

## Step 5: 健康提示
基于五行分布，分析：
- 需要注意的身体部位
- 养生建议

## Step 6: 未来5年运势（2026-2031）
结合当前大运和流年，给出每年的：
- 关键词
- 注意事项
- 行动建议

# 输出要求
- 使用专业但易懂的语言
- 每个结论都要引用结构化数据作为依据
- 禁止编造数据，所有分析必须基于提供的结构化数据
- 格式清晰，使用标题和列表
`;

export async function getUnifiedInterpretation(
  birthInfo: any, 
  fateData: any, 
  structuredAnalysis: any,
  depth: 'quick' | 'deep' = 'quick'
) {
  const structuredData = buildStructuredPrompt(birthInfo, fateData, structuredAnalysis);
  
  const prompt = `${STEP_BY_STEP_PROMPT}\n\n${structuredData}\n\n请按照上述步骤进行分析，生成${depth === 'deep' ? '详细' : '简洁'}的命理报告。`;

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
          { role: 'system', content: '你是专业的八字命理分析师，基于结构化数据进行解读。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: depth === 'deep' ? 4000 : 2000,
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

// 聊天功能 - 也使用结构化数据
export async function chatWithMaster(
  birthInfo: any, 
  fateData: any, 
  structuredAnalysis: any,
  history: { role: 'user' | 'model'; text: string }[], 
  message: string
) {
  const structuredData = buildStructuredPrompt(birthInfo, fateData, structuredAnalysis);
  
  const systemPrompt = `
你是专业的八字命理分析师。以下是用户的命盘结构化数据（已计算）：

${structuredData}

请基于以上数据回答用户的问题。不要编造数据，所有回答必须基于提供的结构化信息。
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
