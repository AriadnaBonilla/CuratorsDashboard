// Chart.js wrapper — manages canvas lifecycle and consistent styling
// Requires Chart.js loaded globally via CDN

const CHART_REGISTRY = {};

export const COLORS = {
  primary:  '#0070F2',
  teal:     '#0099CC',
  green:    '#107E3E',
  orange:   '#DF6E0C',
  purple:   '#6200EA',
  pink:     '#D81B60',
  yellow:   '#F9A825',
  navy:     '#354A5E',
  indigo:   '#3730A3',
  lime:     '#65A30D',
  palette: ['#0070F2','#0099CC','#107E3E','#DF6E0C','#6200EA','#D81B60','#F9A825','#354A5E','#3730A3','#65A30D']
};

const BASE_FONT = { family: "ui-sans-serif, system-ui, -apple-system, sans-serif", size: 12 };

function destroyChart(id) {
  if (CHART_REGISTRY[id]) { CHART_REGISTRY[id].destroy(); delete CHART_REGISTRY[id]; }
}

function getCanvas(id) {
  const el = document.getElementById(id);
  if (!el) return null;
  destroyChart(id);
  return el;
}

export function renderBarChart(id, { labels, datasets, horizontal = false, stacked = false, legend = true, height = 280 }) {
  const canvas = getCanvas(id);
  if (!canvas) return;
  canvas.parentElement.style.height = height + 'px';
  canvas.style.height = height + 'px';

  CHART_REGISTRY[id] = new Chart(canvas, {
    type: 'bar',
    data: { labels, datasets: datasets.map((d, i) => ({
      ...d,
      backgroundColor: d.backgroundColor || COLORS.palette[i % COLORS.palette.length],
      borderRadius: 3,
      borderSkipped: false
    }))},
    options: {
      indexAxis: horizontal ? 'y' : 'x',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: legend, position: 'top', labels: { font: BASE_FONT, boxWidth: 12, padding: 16 } },
        tooltip: { bodyFont: BASE_FONT, titleFont: BASE_FONT }
      },
      scales: {
        x: { stacked, grid: { color: '#E0E3E6' }, ticks: { font: BASE_FONT, color: '#6A7380' } },
        y: { stacked, grid: { color: horizontal ? 'transparent' : '#E0E3E6' }, ticks: { font: BASE_FONT, color: '#6A7380' } }
      }
    }
  });
}

export function renderLineChart(id, { labels, datasets, legend = true, height = 260, yTickFormatter }) {
  const canvas = getCanvas(id);
  if (!canvas) return;
  canvas.parentElement.style.height = height + 'px';
  canvas.style.height = height + 'px';

  CHART_REGISTRY[id] = new Chart(canvas, {
    type: 'line',
    data: { labels, datasets: datasets.map((d, i) => ({
      ...d,
      borderColor: d.borderColor || COLORS.palette[i % COLORS.palette.length],
      backgroundColor: d.backgroundColor || (COLORS.palette[i % COLORS.palette.length] + '20'),
      tension: 0.3,
      fill: d.fill ?? false,
      pointRadius: 4,
      pointHoverRadius: 6,
      borderWidth: 2
    }))},
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: legend, position: 'top', labels: { font: BASE_FONT, boxWidth: 12, padding: 16 } },
        tooltip: { bodyFont: BASE_FONT, titleFont: BASE_FONT }
      },
      scales: {
        x: { grid: { color: 'transparent' }, ticks: { font: BASE_FONT, color: '#6A7380' } },
        y: { grid: { color: '#E0E3E6' }, ticks: { font: BASE_FONT, color: '#6A7380',
          callback: yTickFormatter || undefined
        }}
      }
    }
  });
}

export function renderDoughnutChart(id, { labels, data, colors, height = 240, legend = true }) {
  const canvas = getCanvas(id);
  if (!canvas) return;
  canvas.parentElement.style.height = height + 'px';
  canvas.style.height = height + 'px';

  const usedColors = colors || COLORS.palette;

  CHART_REGISTRY[id] = new Chart(canvas, {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: usedColors.slice(0, data.length), borderWidth: 2, borderColor: '#fff', hoverOffset: 6 }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: { display: legend, position: 'right', labels: { font: BASE_FONT, boxWidth: 12, padding: 14 } },
        tooltip: { bodyFont: BASE_FONT, titleFont: BASE_FONT }
      }
    }
  });
}

export function renderHorizontalBar(id, { labels, data, color, height, formatter }) {
  renderBarChart(id, {
    labels,
    datasets: [{ label: 'Count', data, backgroundColor: color || COLORS.primary }],
    horizontal: true,
    legend: false,
    height: height || Math.max(200, labels.length * 32)
  });
}

export function destroyAllCharts() {
  Object.keys(CHART_REGISTRY).forEach(id => destroyChart(id));
}

export function destroyPageCharts(prefix) {
  Object.keys(CHART_REGISTRY).filter(id => id.startsWith(prefix)).forEach(id => destroyChart(id));
}
