type ResumeProject = {
  name?: string;
  company?: string;
  description?: string;
  role?: string;
  outcomes?: string[];
};

type WorkExperience = {
  company?: string;
  title?: string;
  duration?: string;
  highlights?: string[];
};

export type ParsedProfileLike = {
  work_experience?: WorkExperience[];
  projects?: ResumeProject[];
};

export type ResumeProjectAnchor = {
  name: string;
  company: string;
  description: string;
  evidence: string[];
};

function cleanText(value: unknown) {
  return String(value || "").trim();
}

function normalizeForMatch(value: string) {
  return cleanText(value).replace(/\s+/g, "").toLowerCase();
}

function tokenizeForOverlap(value: string) {
  const genericTerms = new Set([
    "这个项目",
    "该项目",
    "当前项目",
    "你的回答",
    "我的回答",
    "当前题目",
  ]);

  return cleanText(value)
    .split(/[，。；：、！？,.!?;:\s]+/)
    .map(normalizeForMatch)
    .filter((part) => part.length >= 4 && !genericTerms.has(part));
}

function hasMeaningfulOverlap(haystack: string, needle: string) {
  if (haystack.includes(needle)) return true;
  if (needle.length < 5) return false;

  const genericFragments = new Set(["这个项目", "你的回答", "当前题目"]);
  for (let start = 0; start <= needle.length - 5; start += 1) {
    const fragment = needle.slice(start, start + 5);
    const isGenericFragment =
      genericFragments.has(fragment) ||
      fragment.includes("项目") ||
      fragment.includes("回答") ||
      fragment.includes("题目");
    if (!isGenericFragment && haystack.includes(fragment)) {
      return true;
    }
  }

  return false;
}

function includesNormalized(source: string, target: string) {
  const normalizedSource = normalizeForMatch(source);
  const normalizedTarget = normalizeForMatch(target);
  return Boolean(
    normalizedSource && normalizedTarget && normalizedSource.includes(normalizedTarget)
  );
}

function projectEvidence(project: ResumeProject) {
  return [
    cleanText(project.name),
    cleanText(project.description),
    cleanText(project.role),
    ...(project.outcomes || []).map(cleanText),
  ].filter(Boolean);
}

function workEvidence(work: WorkExperience) {
  return [
    cleanText(work.company),
    cleanText(work.title),
    cleanText(work.duration),
    ...(work.highlights || []).map(cleanText),
  ].filter(Boolean);
}

export function buildResumeProjectAnchors(
  parsedProfile: ParsedProfileLike
): ResumeProjectAnchor[] {
  const workExperience = parsedProfile.work_experience || [];

  return (parsedProfile.projects || [])
    .map((project) => {
      const name = cleanText(project.name);
      if (!name) return null;

      const explicitProjectCompany = cleanText(project.company);
      const projectFields = projectEvidence(project);
      const matchedWork =
        (explicitProjectCompany
          ? workExperience.find(
              (work) => cleanText(work.company) === explicitProjectCompany
            )
          : null) ||
        workExperience.find((work) => {
          const company = cleanText(work.company);
          if (!company) return false;
          return projectFields.some((field) => includesNormalized(field, company));
        }) ||
        workExperience.find((work) => {
          const fields = workEvidence(work);
          return fields.some((field) => includesNormalized(field, name));
        });

      return {
        name,
        company: explicitProjectCompany || cleanText(matchedWork?.company),
        description: cleanText(project.description),
        evidence: projectFields,
      };
    })
    .filter((anchor): anchor is ResumeProjectAnchor => Boolean(anchor));
}

export function formatResumeGroundingContext(parsedProfile: ParsedProfileLike) {
  const anchors = buildResumeProjectAnchors(parsedProfile);
  if (!anchors.length) return "未提取到明确项目锚点。";

  return anchors
    .map((anchor, index) => {
      const company = anchor.company || "公司未明确";
      const description = anchor.description || "无项目描述";
      return `${index + 1}. 项目「${anchor.name}」 | 所属公司：${company} | 描述：${description}`;
    })
    .join("\n");
}

export function questionUsesInvalidProjectCompanyPair(
  questionText: string,
  parsedProfile: ParsedProfileLike
) {
  const anchors = buildResumeProjectAnchors(parsedProfile).filter(
    (anchor) => anchor.company
  );
  if (!anchors.length) return false;

  return anchors.some((anchor) => {
    if (!includesNormalized(questionText, anchor.name)) return false;

    return anchors.some(
      (otherAnchor) =>
        otherAnchor.company !== anchor.company &&
        includesNormalized(questionText, otherAnchor.company)
    );
  });
}

export function sanitizeFeedbackForCurrentQuestion(
  feedback: string,
  questionText: string,
  answer: string
) {
  const normalizedFeedback = normalizeForMatch(feedback);

  if (!feedback.trim()) return "";

  const overlapsCurrentContext =
    tokenizeForOverlap(questionText)
      .some((part) => hasMeaningfulOverlap(normalizedFeedback, part)) ||
    tokenizeForOverlap(answer)
      .some((part) => hasMeaningfulOverlap(normalizedFeedback, part));

  return overlapsCurrentContext ? feedback.trim() : "";
}
