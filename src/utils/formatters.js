// Number and value formatting utilities

export const fmt = {
  currency(v) {
    if (v == null || isNaN(v)) return '—';
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
    return `$${v}`;
  },

  number(v) {
    if (v == null || isNaN(v)) return '—';
    return Number(v).toLocaleString();
  },

  pct(v, decimals = 1) {
    if (v == null || isNaN(v)) return '—';
    return `${Number(v).toFixed(decimals)}%`;
  },

  days(v) {
    if (v == null || isNaN(v)) return '—';
    const d = Math.round(v);
    return d === 1 ? '1 day' : `${d} days`;
  },

  date(str) {
    if (!str) return '—';
    const d = new Date(str);
    if (isNaN(d)) return str;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  },

  shortDate(str) {
    if (!str) return '—';
    const d = new Date(str);
    if (isNaN(d)) return str;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  },

  quarter(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d)) return '—';
    const q = Math.floor(d.getMonth() / 3) + 1;
    return `Q${q} ${d.getFullYear()}`;
  },

  monthYear(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d)) return '—';
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  },

  titleCase(str) {
    if (!str) return '';
    return str.replace(/\w\S*/g, t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());
  }
};

export function getQuarterBounds(label) {
  // label like "Q1 2024"
  const [q, y] = label.split(' ');
  const qNum = parseInt(q.replace('Q', '')) - 1;
  const year = parseInt(y);
  const start = new Date(year, qNum * 3, 1);
  const end = new Date(year, qNum * 3 + 3, 0);
  return { start, end };
}

export function daysBetween(a, b) {
  const d1 = a instanceof Date ? a : new Date(a);
  const d2 = b instanceof Date ? b : new Date(b);
  return Math.max(0, Math.round((d2 - d1) / 86_400_000));
}

export function getDatePresetRange(preset) {
  const now = new Date('2025-05-26');
  const year = now.getFullYear();
  const month = now.getMonth();
  const q = Math.floor(month / 3);

  switch (preset) {
    case 'q_current':
      return { start: new Date(year, q * 3, 1), end: new Date(year, q * 3 + 3, 0) };
    case 'q_prev': {
      const pq = q === 0 ? 3 : q - 1;
      const py = q === 0 ? year - 1 : year;
      return { start: new Date(py, pq * 3, 1), end: new Date(py, pq * 3 + 3, 0) };
    }
    case 'l12m':
      return { start: new Date(year - 1, month + 1, 1), end: now };
    case 'ytd':
      return { start: new Date(year, 0, 1), end: now };
    case 'all':
    default:
      return { start: null, end: null };
  }
}
