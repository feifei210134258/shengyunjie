export function getBeijingDate(date?: Date): string {
  const d = date || new Date();
  const parts = d.toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai" }).split("/");
  const year = parts[0];
  const month = parts[1].padStart(2, "0");
  const day = parts[2].padStart(2, "0");
  return `${year}-${month}-${day}`;
}
