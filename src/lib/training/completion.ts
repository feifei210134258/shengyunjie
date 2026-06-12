type CreatedAtRecord = {
  created_at: string | null;
};

function getBeijingDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function getBeijingMonthUtcRange(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const startUtc = new Date(Date.UTC(year, monthNumber - 1, 1, -8, 0, 0, 0));
  const endUtc = new Date(Date.UTC(year, monthNumber, 1, -8, 0, 0, 0));

  return {
    startIso: startUtc.toISOString(),
    endIso: endUtc.toISOString(),
  };
}

export function getBeijingDateFromIso(iso: string) {
  return getBeijingDate(new Date(iso));
}

export function getUniqueBeijingDates(records: CreatedAtRecord[]) {
  return Array.from(
    new Set(
      records
        .map((record) =>
          record.created_at ? getBeijingDateFromIso(record.created_at) : null
        )
        .filter(Boolean) as string[]
    )
  ).sort();
}

export function getUniqueBeijingMonthDays(
  records: CreatedAtRecord[],
  month: string
) {
  return getUniqueBeijingDates(records)
    .filter((date) => date.startsWith(`${month}-`))
    .map((date) => Number(date.slice(-2)));
}

export function calcStreakFromBeijingDates(
  dates: string[],
  today = getBeijingDate()
) {
  const uniqueDates = new Set(dates);
  const todayDate = new Date(`${today}T00:00:00+08:00`);
  const yesterdayDate = new Date(todayDate);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = getBeijingDate(yesterdayDate);

  let checkDate = uniqueDates.has(today) ? today : yesterday;
  if (!uniqueDates.has(checkDate)) return 0;

  let streak = 0;
  while (uniqueDates.has(checkDate)) {
    streak += 1;
    const previous = new Date(`${checkDate}T00:00:00+08:00`);
    previous.setDate(previous.getDate() - 1);
    checkDate = getBeijingDate(previous);
  }

  return streak;
}
