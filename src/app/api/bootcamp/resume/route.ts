import { createServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { getChatModel } from "@/lib/ai";

// POST: 上传并解析简历
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "未提供文件" }, { status: 400 });

    // 校验文件类型和大小
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "请上传 PDF 或 Word 格式的简历" },
        { status: 400 }
      );
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "文件大小不能超过 10MB" },
        { status: 400 }
      );
    }

    // 提取文本
    const bytes = await file.arrayBuffer();
    const text = new TextDecoder().decode(bytes);

    // 如果文本提取失败（扫描件 PDF）
    if (text.length < 100) {
      return NextResponse.json(
        {
          error:
            "无法解析该简历，请尝试上传文字版 PDF 或手动输入关键信息",
          needs_manual_input: true,
        },
        { status: 400 }
      );
    }

    // 调用 AI 解析简历
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey)
      return NextResponse.json({ error: "AI 服务未配置" }, { status: 500 });

    const model = getChatModel(apiKey);

    const { text: parsedText } = await generateText({
      model,
      system: `你是一位资深 HR，请解析简历并返回 JSON 格式的结构化信息。`,
      messages: [{ role: "user", content: `简历内容：\n${text}` }],
    });

    let parsedProfile;
    try {
      parsedProfile = JSON.parse(parsedText);
    } catch {
      return NextResponse.json(
        { error: "解析失败，请手动输入" },
        { status: 500 }
      );
    }

    // 生成弱点预测
    const { text: weaknessText } = await generateText({
      model,
      system: `你是一位 B 端产品总监，分析候选人的面试弱点。`,
      messages: [
        {
          role: "user",
          content: `简历信息：${JSON.stringify(parsedProfile)}`,
        },
      ],
    });

    let weaknessPrediction;
    try {
      weaknessPrediction = JSON.parse(weaknessText);
    } catch {
      weaknessPrediction = { weak_dimensions: [], recommended_focus: [] };
    }

    // 创建或更新特训会话
    const { data: session, error } = await supabase
      .from("bootcamp_sessions")
      .upsert(
        {
          user_id: user.id,
          status: "in_progress",
          current_day: 0,
          resume_text: text,
          parsed_profile: parsedProfile,
          weakness_prediction: weaknessPrediction,
        },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      session,
      parsed_profile: parsedProfile,
      weakness_prediction: weaknessPrediction,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "服务器错误" },
      { status: 500 }
    );
  }
}

// GET: 获取已解析的简历
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const { data: session } = await supabase
      .from("bootcamp_sessions")
      .select("parsed_profile, weakness_prediction, status, current_day")
      .eq("user_id", user.id)
      .single();

    if (!session)
      return NextResponse.json(
        { error: "未找到特训记录" },
        { status: 404 }
      );

    return NextResponse.json(session);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "服务器错误" },
      { status: 500 }
    );
  }
}
