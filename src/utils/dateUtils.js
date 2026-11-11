export const DEFAULT_TIMEZONE = 'Asia/Kolkata';

export function getZonedParts(date = new Date(), timeZone = DEFAULT_TIMEZONE) {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    const parts = formatter.formatToParts(date);
    const map = {};
    parts.forEach((p) => {
      map[p.type] = p.value;
    });
    const hour = Number(map.hour === '24' ? 0 : map.hour);
    return {
      year: Number(map.year),
      month: Number(map.month),
      day: Number(map.day),
      hour,
      minute: Number(map.minute),
      second: Number(map.second),
      dateKey: `${map.year}-${map.month}-${map.day}`
    };
  } catch {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return {
      year: y,
      month: Number(m),
      day: Number(d),
      hour: date.getHours(),
      minute: date.getMinutes(),
      second: date.getSeconds(),
      dateKey: `${y}-${m}-${d}`
    };
  }
}

export function getTodayDateKey(timeZone = DEFAULT_TIMEZONE, resetTime = '00:00') {
  const now = new Date();
  const parts = getZonedParts(now, timeZone);
  if (resetTime && resetTime !== '00:00') {
    const [resetH, resetM] = resetTime.split(':').map(Number);
    const nowMinutes = parts.hour * 60 + parts.minute;
    const resetMinutes = (resetH || 0) * 60 + (resetM || 0);
    if (nowMinutes < resetMinutes) {
      const prev = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      return getZonedParts(prev, timeZone).dateKey;
    }
  }
  return parts.dateKey;
}

export function getGreeting(timeZone = DEFAULT_TIMEZONE) {
  const { hour } = getZonedParts(new Date(), timeZone);
  if (hour < 12) return 'Good Morning!';
  if (hour < 17) return 'Good Afternoon!';
  return 'Good Evening!';
}

export function formatReadableDate(dateKey) {
  if (!dateKey) return '';
  const [y, m, d] = dateKey.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  return dateObj.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export function formatShortDate(dateKey) {
  if (!dateKey) return '';
  const [y, m, d] = dateKey.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  return dateObj.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short'
  });
}

export function formatTime12h(time24) {
  if (!time24 || !time24.includes(':')) return time24 || '';
  const [hStr, mStr] = time24.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

export function timeToMinutes(time24) {
  if (!time24 || !time24.includes(':')) return 0;
  const [h, m] = time24.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function getCurrentMinutesInZone(timeZone = DEFAULT_TIMEZONE) {
  const { hour, minute } = getZonedParts(new Date(), timeZone);
  return hour * 60 + minute;
}

export function getLastNDates(n, endDateKey) {
  const [y, m, d] = endDateKey.split('-').map(Number);
  const end = new Date(y, m - 1, d);
  const result = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const dt = new Date(end);
    dt.setDate(end.getDate() - i);
    const yr = dt.getFullYear();
    const mo = String(dt.getMonth() + 1).padStart(2, '0');
    const da = String(dt.getDate()).padStart(2, '0');
    result.push(`${yr}-${mo}-${da}`);
  }
  return result;
}

export function getPreviousDateKeys(endDateKey, count = 30) {
  return getLastNDates(count, endDateKey);
}

export function getMonthCalendarDays(year, monthIndex) {
  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);
  const startWeekday = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const days = [];
  for (let i = 0; i < startWeekday; i += 1) {
    days.push(null);
  }
  for (let d = 1; d <= totalDays; d += 1) {
    const yr = String(year);
    const mo = String(monthIndex + 1).padStart(2, '0');
    const da = String(d).padStart(2, '0');
    days.push({
      day: d,
      dateKey: `${yr}-${mo}-${da}`
    });
  }
  return days;
}

export function shouldRoutineRunOnDate(routine, dateKey) {
  if (!routine || routine.active === false) return false;
  const repeat = routine.repeatSchedule || 'daily';
  if (repeat === 'daily') return true;
  const [y, m, d] = dateKey.split('-').map(Number);
  const dayOfWeek = new Date(y, m - 1, d).getDay();
  if (repeat === 'weekdays') return dayOfWeek >= 1 && dayOfWeek <= 5;
  if (repeat === 'weekends') return dayOfWeek === 0 || dayOfWeek === 6;
  if (Array.isArray(routine.customDays)) {
    return routine.customDays.includes(dayOfWeek);
  }
  return true;
}
