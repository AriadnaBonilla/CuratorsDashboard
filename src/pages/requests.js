// Page 2 — Request Volume & Status

import { computeVolumeByMonth, computeVolumeByQuarter, computeRequestAging } from '../data/transformations.js';
import { renderBarChart, renderLineChart, renderHorizontalBar, destroyPageCharts } from '../components/charts.js';
import { fmt, daysBetween } from '../utils/formatters.js';

const TODAY = new Date('2025-05-26');

export function renderRequests(container, requests) {
  destroyPageCharts('req-');
  const monthly = computeVolumeByMonth(requests);
  const quarterly = computeVolumeByQuarter(requests);
  const aging = computeRequestAging(requests);

  // Backlog trend (open at end of each month)
  const backlogByMonth = monthly.map((m, i) => {
    const submittedSoFar = monthly.slice(0, i + 1).reduce((a, d) => a + d.submitted, 0);
    const completedSoFar = monthly.slice(0, i + 1).reduce((a, d) => a + d.completed, 0);
    const cancelledSoFar = monthly.slice(0, i + 1).reduce((a, d) => a + d.cancelled, 0);
    return { label: m.label, backlog: submittedSoFar - completedSoFar - cancelledSoFar };
  });

  // Completion rate over time
  const completionRateTrend = quarterly.map(q => ({
    label: q.label,
    rate: q.submitted > 0 ? Math.round((q.completed / q.submitted) * 100) : 0
  }));

  container.innerHTML = `
    <div>
      <p class="page-title">Request Volume & Status</p>
      <p class="page-subtitle">Trends in submission, completion, backlog, and request aging</p>

      <div class="section-grid section-grid-2" style="margin-bottom:16px">
        <div class="card">
          <div class="card-header"><span class="card-title">Monthly Request Volume</span></div>
          <div class="card-body"><div class="chart-container"><canvas id="req-monthly-vol"></canvas></div></div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Quarterly Breakdown</span></div>
          <div class="card-body"><div class="chart-container"><canvas id="req-quarterly"></canvas></div></div>
        </div>
      </div>

      <div class="section-grid section-grid-2" style="margin-bottom:16px">
        <div class="card">
          <div class="card-header"><span class="card-title">Backlog Trend</span></div>
          <div class="card-body"><div class="chart-container"><canvas id="req-backlog"></canvas></div></div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Completion Rate by Quarter</span></div>
          <div class="card-body"><div class="chart-container"><canvas id="req-completion-rate"></canvas></div></div>
        </div>
      </div>

      <div class="section-grid section-grid-2" style="margin-bottom:16px">
        <div class="card">
          <div class="card-header"><span class="card-title">Open Request Aging</span>
            <span style="font-size:11px;color:#6A7380">In Progress + Pending</span>
          </div>
          <div class="card-body"><div class="chart-container"><canvas id="req-aging"></canvas></div></div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Status Mix by Quarter</span></div>
          <div class="card-body"><div class="chart-container"><canvas id="req-status-mix"></canvas></div></div>
        </div>
      </div>
    </div>`;

  renderBarChart('req-monthly-vol', {
    labels: monthly.map(d => d.label),
    datasets: [
      { label: 'Submitted', data: monthly.map(d => d.submitted) },
      { label: 'Completed', data: monthly.map(d => d.completed) }
    ],
    height: 260
  });

  renderBarChart('req-quarterly', {
    labels: quarterly.map(d => d.label),
    datasets: [
      { label: 'Completed', data: quarterly.map(d => d.completed), backgroundColor: '#107E3E' },
      { label: 'In Progress', data: quarterly.map(d => d.inProgress), backgroundColor: '#3730A3' },
      { label: 'Cancelled', data: quarterly.map(d => d.cancelled), backgroundColor: '#BB0000' }
    ],
    stacked: true,
    height: 260
  });

  renderLineChart('req-backlog', {
    labels: backlogByMonth.map(d => d.label),
    datasets: [{ label: 'Open Requests', data: backlogByMonth.map(d => d.backlog), borderColor: '#DF6E0C', backgroundColor: '#DF6E0C20', fill: true }],
    height: 260
  });

  renderLineChart('req-completion-rate', {
    labels: completionRateTrend.map(d => d.label),
    datasets: [{ label: 'Completion Rate %', data: completionRateTrend.map(d => d.rate), borderColor: '#0070F2' }],
    height: 260,
    yTickFormatter: v => `${v}%`
  });

  renderHorizontalBar('req-aging', {
    labels: aging.map(d => d.label),
    data: aging.map(d => d.count),
    color: '#6200EA',
    height: 200
  });

  renderBarChart('req-status-mix', {
    labels: quarterly.map(d => d.label),
    datasets: [
      { label: 'Completed', data: quarterly.map(d => d.completed), backgroundColor: '#107E3E' },
      { label: 'Open', data: quarterly.map(d => d.inProgress) }
    ],
    stacked: true,
    height: 260
  });
}
