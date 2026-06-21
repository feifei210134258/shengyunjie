import { generateText } from "ai";
import { createServerClient } from "@/lib/supabase-server";
import {
  normalizeDiagnosisScore,
} from "@/lib/diagnosis/report-summary";
import { getThinkingModel } from "@/lib/ai";
import {
  calibrateDiagnosisScores,
  normalizeDiagnosisCaseEvaluation,
} from "@/lib/diagnosis/case-calibration";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const { reportId, caseData } = await req.json();

    if (!reportId) {
      return NextResponse.json({ error: "缺少 reportId" }, { status: 400 });
    }

    const logicInput = String(caseData?.logicInput || "").trim();
    if (logicInput.length < 20) {
      return NextResponse.json(
        { error: "案例分析至少需要 20 个字，才能形成有效诊断。" },
        { status: 400 }
      );
    }

    const { data: report } = await supabase
      .from("diagnosis_reports")
      .select("stage1_data, stage2_summary")
      .eq("id", reportId)
      .eq("user_id", user.id)
      .single();

    if (!report) {
      return NextResponse.json({ error: "未找到诊断报告" }, { status: 404 });
    }

    const { data: dims } = await supabase
      .from("dimension_scores")
      .select("id, dimension, score, grade, label, description")
      .eq("report_id", reportId);

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI 服务未配置" }, { status: 500 });
    }

    const model = getThinkingModel(apiKey, "deepseek-v4-flash");
    const { text } = await generateText({
      model,
      system: `你是一位严谨的 B 端产品能力诊断师。你需要根据用户在案例实战中的回答，校验量表自评是否可信。
请只返回 JSON，不要使用 Markdown 代码块或额外解释。
JSON 结构必须为：
{
  "overall_score": 0-10,
  "dimension_scores": {
    "strategic_thinking": {"score": 0-10, "evidence": "引用或概括用户回答中的证据", "gap": "该维度最主要差距"},
    "system_design": {"score": 0-10, "evidence": "...", "gap": "..."},
    "data_decision": {"score": 0-10, "evidence": "...", "gap": "..."},
    "user_insight": {"score": 0-10, "evidence": "...", "gap": "..."},
    "commercial_thinking": {"score": 0-10, "evidence": "...", "gap": "..."}
  },
  "summary": "80-140 字综合诊断，说明案例暴露出的真实产品判断力",
  "strengths": ["强项，必须来自用户回答证据"],
  "weaknesses": ["弱项，必须指出缺失的判断链路"],
  "improvement_suggestions": ["后续训练建议"]
}
评分关注真实思考过程：是否抓住核心矛盾、是否有取舍标准、是否考虑角色/流程/边界、是否有指标验证、是否理解商业影响。不要因为表达流畅就高分，也不要因为答案短但判断准确就过度低分。`,
      messages: [
        {
          role: "user",
          content: `量表初筛数据：${JSON.stringify(report.stage1_data || {})}
访谈摘要：${JSON.stringify(report.stage2_summary || {})}

案例标题：${caseData?.scenario || "SaaS 平台多租户权限体系重构"}
用户选择：${caseData?.selectedOption || "未选择"}
用户案例分析：${logicInput}

请完成结构化诊断评估。`,
        },
      ],
    });

    const rawJsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate =
      rawJsonMatch?.[1]?.trim() ||
      text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
    let parsedEvaluation: unknown = null;
    try {
      parsedEvaluation = JSON.parse(candidate);
    } catch {
      return NextResponse.json(
        { error: "AI 诊断结果解析失败，请稍后重试。" },
        { status: 502 }
      );
    }

    const caseEvaluation = normalizeDiagnosisCaseEvaluation(parsedEvaluation);
    const calibrated = calibrateDiagnosisScores(dims || [], caseEvaluation);

    for (const dim of calibrated.dimensionScores) {
      if (!dim.id) continue;

      const { error: dimUpdateError } = await supabase
        .from("dimension_scores")
        .update({
          score: dim.score,
          grade: dim.grade,
          description: dim.description,
        })
        .eq("id", dim.id);

      if (dimUpdateError) {
        return NextResponse.json(
          { error: dimUpdateError.message },
          { status: 500 }
        );
      }
    }

    // 更新并完成诊断报告
    const { error } = await supabase
      .from("diagnosis_reports")
      .update({
        stage3_case_data: {
          ...caseData,
          ai_evaluation: caseEvaluation,
          calibration: {
            weight: 0.25,
            note: "阶段三案例实战按 25% 权重校准量表自评分，避免一次案例完全推翻初筛。",
          },
        },
        status: "completed",
        overall_score: calibrated.overallScore,
        overall_grade: calibrated.overallGrade,
        strengths: calibrated.strengths,
        weaknesses: calibrated.weaknesses,
        improvements: caseEvaluation.improvement_suggestions,
        completed_at: new Date().toISOString(),
      })
      .eq("id", reportId)
      .eq("user_id", user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // 创建成长快照
    const dimScores: Record<string, number> = {};
    calibrated.dimensionScores.forEach((d) => {
      const score = normalizeDiagnosisScore(d.score);
      if (score != null) dimScores[d.dimension] = score;
    });

    await supabase.from("growth_snapshots").insert({
      user_id: user.id,
      dimension_scores: dimScores,
      overall_score: calibrated.overallScore || 0,
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "服务器错误" }, { status: 500 });
  }
}
