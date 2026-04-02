// 火山方舟 AI Service
const ARK_API_KEY = import.meta.env.VITE_ARK_API_KEY;
const ARK_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';

if (!ARK_API_KEY) {
  console.error("Ark API configuration is missing. Please check your environment variables.");
}

const MODEL_ID = 'ep-20260326101147-6hrzr';

function buildPrompt(birthInfo: any, fateData: any): string {
  return `
用户信息:
姓名: ${birthInfo.name || '未知'}
性别: ${birthInfo.gender === 'male' ? '男' : '女'}
出生日期: ${birthInfo.year}年${birthInfo.month}月${birthInfo.day}日 (${birthInfo.calendarType === 'solar' ? '公历' : '农历'})
出生时间: ${birthInfo.hour}时${birthInfo.minute || 0}分
出生地点: ${birthInfo.country} ${birthInfo.province} ${birthInfo.city}

排盘数据摘要:
${fateData.bazi ? `八字: ${JSON.stringify({
  pillars: Object.entries(fateData.bazi.pillars).map(([k, v]: any) => `${k}:${v.gan}${v.zhi}`),
  dayMaster: fateData.bazi.dayMaster,
  fiveElements: fateData.bazi.fiveElements,
  relations: fateData.bazi.relations.map((r: any) => r.description)
})}` : ''}
${fateData.ziwei ? `紫微斗数: ${JSON.stringify({
  lifeMaster: fateData.ziwei.lifeMaster,
  bodyMaster: fateData.ziwei.bodyMaster,
  zodiac: fateData.ziwei.zodiac,
  palaces: fateData.ziwei.palaces.map((p: any) => ({
    name: p.name,
    stars: [...p.majorStars.map((s: any) => s.name), ...p.minorStars.map((s: any) => s.name)]
  }))
})}` : ''}
${fateData.western ? `西方星盘: ${JSON.stringify({
  sunSign: fateData.western.sunSign,
  aspects: fateData.western.aspects.map((a: any) => a.name)
})}` : ''}
${fateData.lifeNumerology ? `生命灵数: ${JSON.stringify(fateData.lifeNumerology)}` : ''}
${fateData.mbti ? `MBTI: ${JSON.stringify(fateData.mbti)}` : ''}
生肖: ${fateData.zodiac}
星座: ${fateData.westernZodiac}
  `;
}

export async function getUnifiedInterpretation(birthInfo: any, fateData: any, depth: 'quick' | 'deep' = 'quick') {
  const systemInstruction = `
# 角色设定
你是一位深耕命理领域10年以上的跨体系专业命理顾问，精通中国传统八字命理、紫微斗数、西方占星、生命灵数、人类图（Human Design）及印度吠陀占星（印占）等多个体系。你擅长多体系交叉验证，输出严谨、有深度、不浮夸的人生趋势分析报告。
你的报告既要具备极强的专业命理支撑（如具体的星曜、神煞、相位、通道等），也要有贴合人生阶段的共情力。你强调「命理不是宿命，而是天气预报」，旨在帮助用户在关键节点做出最优选择。

# 输出规则与强制结构
1. 开篇寄语：直接称呼用户（如：[姓名]先生/女士，你好）。结合其当前年龄和人生阶段（如：三十而立、不惑之年等），给出共情式的人生阶段总结，快速建立信任感。
2. 核心结论摘要：
   - **一句话定论**：用一个极具辨识度的人设标签概括用户的核心特质（如："打磨内在锋芒的奋斗者"）。
   - **多体系交叉验证**：选取至少2个体系的依据（如八字+人类图）互相印证一个核心结论。
   - **关键节点**：明确指出未来3-5年内最重要的转折年份及方向。
   - **置信度声明**：诚实说明各体系数据的可靠程度（如：八字置信度高，星盘重在趋势指引）。
3. 命运起伏（底层逻辑）：
   - **核心证据**：提取八字日主、月令或星盘核心相位。
   - **起伏逻辑**：简述过去3-5年的状态（复盘），并引出未来的转机（大运/流年更替）。
4. 事业运势：
   - **多体系映射**：结合紫微斗数主星和人类图通道，分析职业天赋。
   - **具体建议**：适合的领域、岗位角色，以及沟通/决策中的避坑指南。
5. 财运分析：
   - **财富属性**：分析财星占比及财库情况，说明是正财还是偏财。
   - **风险提示**：未来几年的财务波动预警及资产布局建议。
6. 婚姻与家庭：
   - **情感模式**：分析用户的择偶偏好与相处模式。
   - **矛盾与落地建议**：指出潜在冲突点，并给出具体的沟通改善方案。
7. 健康指引：
   - **五行/星象反馈**：对应身体的薄弱环节。
   - **调节建议**：具体的运动或生活方式建议。
8. 未来5年逐年运势（2026-2031）：
   - 结合流年、生命灵数个人年，给出每年的核心关键词和行动指南。
9. 三大行动方案：
   - 给出3条极其具体的、可操作的建议（职业优化、情绪管理、财务规划）。
10. 大师寄语：
    - 总结全篇，给予力量，强调平衡与个人成长。

# 话术与排版要求
- 专业严谨：每一个结论都必须有对应的命理体系依据。
- 通俗好懂：专业术语必须搭配通俗解释。
- 排版精美：使用清晰的标题层级（H2, H3），段落之间保持充足空行。**禁止在正文中过度使用加粗（**符号）**，仅在极少数核心关键词上使用。
- 篇幅：深度报告控制在1200-1800字。
  `;

  const userPrompt = buildPrompt(birthInfo, fateData);

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
          { role: 'system', content: systemInstruction },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: depth === 'deep' ? 4000 : 1500,
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
  history: { role: 'user' | 'model'; text: string }[], 
  message: string
) {
  const systemInstruction = `
你是一位深耕命理领域10年以上的跨体系专业命理顾问，精通中国传统八字命理、紫微斗数、西方占星、生命灵数、人类图及印占等多个体系。
你的回答既要具备极强的专业命理支撑，也要有贴合人生阶段的共情力，强调「命理为指引，人为核心」的底层逻辑。
请结合用户的出生信息和排盘数据回答他们的问题。

用户信息:
姓名: ${birthInfo.name || '未知'}
性别: ${birthInfo.gender === 'male' ? '男' : '女'}
出生日期: ${birthInfo.year}年${birthInfo.month}月${birthInfo.day}日

排盘数据摘要:
${fateData.bazi ? `八字: ${JSON.stringify({
  pillars: Object.entries(fateData.bazi.pillars).map(([k, v]: any) => `${k}:${v.gan}${v.zhi}`),
  dayMaster: fateData.bazi.dayMaster,
  fiveElements: fateData.bazi.fiveElements,
  relations: fateData.bazi.relations.map((r: any) => r.description)
})}` : ''}
${fateData.ziwei ? `紫微斗数: ${JSON.stringify({
  lifeMaster: fateData.ziwei.lifeMaster,
  bodyMaster: fateData.ziwei.bodyMaster,
  zodiac: fateData.ziwei.zodiac,
  palaces: fateData.ziwei.palaces.map((p: any) => ({
    name: p.name,
    stars: [...p.majorStars.map((s: any) => s.name), ...p.minorStars.map((s: any) => s.name)]
  }))
})}` : ''}
${fateData.western ? `西方星盘: ${JSON.stringify({
  sunSign: fateData.western.sunSign,
  aspects: fateData.western.aspects.map((a: any) => a.name)
})}` : ''}
${fateData.lifeNumerology ? `生命灵数: ${JSON.stringify(fateData.lifeNumerology)}` : ''}
${fateData.mbti ? `MBTI: ${JSON.stringify(fateData.mbti)}` : ''}

请保持专业、沉稳、真诚、有落地性的语气。
  `;

  try {
    const messages = [
      { role: 'system', content: systemInstruction },
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
        max_tokens: 1000,
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
