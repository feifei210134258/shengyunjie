export const INTERVIEW_READY_MARKER = "[[DIAGNOSIS_INTERVIEW_READY]]";

export function parseInterviewReadiness(content: string) {
  const isReady = content.includes(INTERVIEW_READY_MARKER);
  const visibleContent = content
    .split(INTERVIEW_READY_MARKER)
    .join("")
    .trim();

  return {
    isReady,
    content: stripTrailingMarkerFragment(visibleContent),
  };
}

function stripTrailingMarkerFragment(content: string) {
  for (let i = INTERVIEW_READY_MARKER.length - 1; i > 0; i--) {
    const fragment = INTERVIEW_READY_MARKER.slice(0, i);
    if (content.endsWith(fragment)) {
      return content.slice(0, -fragment.length).trim();
    }
  }

  return content;
}
