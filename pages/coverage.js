// Page 6 — Coverage by Industry & LoB (heatmap + breakdown)

import { computeCoverageMatrix, computeByDimension } from '../data/transformations.js';
import { renderHorizontalBar, destroyPageCharts } from '../components/charts.js';
import { fmt } from '../utils/formatters.js';

function heatLevel(value, max) {
  if (!value || max === 0) return 0;
  const pct = value / max;
  if (pct <= 0) return 0;
  if (pct < 0.1) return 1;
  if (pct < 0.3) return 2;
  if (pct < 0.55) return 3;
  if (pct < 0.8) return 4;
  return 5;
}

function buildHeatmap(matrix, rows, cols, metric = 'requests') {
  const allVals = rows.flatMap(r => cols.map(c => matrix[r]?.[c]?.[metric] || 0));
  const max = Math.max(...allVals, 1);

  return `
    <div class="data-table-wrap">
      <table class="heatmap-table">
        <thead><tr>
          <th style="text-align:left;min-width:140px"></th>
          ${cols.map(c => `<th>${c}</th>`).join('')}
          <th>Total</th>
        </tr></thead>
        <tbody>${rows.map(row => {
          const rowTotal = cols.reduce((s, c) => s + (matrix[row]?.[c]?.[metric] || 0), 0);
          return `<tr>
            <td style="font-size:11px;font-weight:600;text-align:left;padding:5px 10px;white-space:nowrap">${row}</td>
            ${cols.map(c => {
              const v = matrix[row]?.[c]?.[metric] || 0;
              const lvl = heatLevel(v, max);
              return `<td class="heat-${lvl}" title="${row} × ${c}: ${metric === 'pipeline' ? fmt.currency(v) : v}">${v > 0 ? (metric === 'pipeline' ? fmt.currency(v) : v) : ''}</td>`;
            }).join('')}
            <td style="font-weight:600;font-size:12px;background:#EBF1FA">${metric === 'pipeline' ? fmt.currency(rowTotal) : rowTotal}</td>
          </tr>`;
        }).join('')}</tbody>
      </table>
    </div>`;
}

export function renderCoverage(container, requests, pipelineRecords) {
  destroyPageCharts('cov-');
  const hasPipeline = pipelineRecords.length > 0;

  const { matrix: indMatrix, rows: industries, cols: lobs } = computeCoverageMatrix(requests, pipelineRecords, 'industry', 'lob');
  const { matrix: indSolMatrix, rows: industries2, cols: solutions } = computeCoverageMatrix(requests, pipelineRecords, 'industry', 'solutionArea');

  const byIndustry = computeByDimension(requests, 'industry');
  const byLoB = computeByDimension(requests, 'lob');

  container.innerHTML = `
    <div>
      <p class="page-title">Coverage by Industry & LoB</p>
      <p class="page-subtitle">Where we operate and where gaps exist</p>

      <div class="tabs" id="cov-tabs">
        <button class="tab-btn active" data-tab="ind-lob">Industry × LoB</button>
        <button class="tab-btn" data-tab="ind-sol">Industry × Solution Area</button>
        ${hasPipeline ? '<button class="tab-btn" data-tab="pipeline-heat">Pipeline Heatmap</button>' : ''}
      </div>

      <div id="cov-tab-ind-lob" class="cov-tab-panel">
        <div class="card" style="margin-bottom:16px">
          <div class="card-header">
            <span class="card-title">Requests — Industry × Line of Business</span>
            <span style="font-size:11px;color:#6A7380">Deeper color = more activity</span>
          </div>
          <div class="card-body">${buildHeatmap(indMatrix, industries, lobs, 'requests')}</div>
        </div>
      </div>

      <div id="cov-tab-ind-sol" class="cov-tab-panel" style="display:none">
        <div class="card" style="margin-bottom:16px">
          <div class="card-header">
            <span class="card-title">Requests — Industry × Solution Area</span>
          </div>
          <div class="card-body">${buildHeatmap(indSolMatrix, industries2, solutions, 'requests')}</div>
        </div>
      </div>

      ${hasPipeline ? `
      <div id="cov-tab-pipeline-heat" class="cov-tab-panel" style="display:none">
        <div class="card" style="margin-bottom:16px">
          <div class="card-header"><span class="card-title">Pipeline — Industry × LoB</span></div>
          <div class="card-body">${buildHeatmap(indMatrix, industries, lobs, 'pipeline')}</div>
        </div>
      </div>` : ''}

      <div class="section-grid section-grid-2" style="margin-top:16px">
        <div class="card">
          <div class="card-header"><span class="card-title">Requests by Industry</span></div>
          <div class="card-body"><div class="chart-container"><canvas id="cov-industry"></canvas></div></div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Requests by LoB</span></div>
          <div class="card-body"><div class="chart-container"><canvas id="cov-lob"></canvas></div></div>
        </div>
      </div>

      <div class="card" style="margin-top:16px">
        <div class="card-header"><span class="card-title">Coverage Gaps — Industries with Low Activity</span></div>
        <div class="card-body">
          <p style="font-size:13px;color:#6A7380;margin:0 0 12px">Industries with fewer than 3 requests (potential coverage opportunity):</p>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            ${byIndustry.filter(d => d.count < 3).length > 0
              ? byIndustry.filter(d => d.count < 3).map(d => `
                  <div style="background:#FFF8E6;border:1px solid #F9A825;border-radius:6px;padding:8px 14px;font-size:13px">
                    <strong>${d.label}</strong> — ${d.count} request${d.count !== 1 ? 's' : ''}
                  </div>`).join('')
              : '<p style="color:#6A7380;font-size:13px">All industries have sufficient activity in the selected period.</p>'}
          </div>
        </div>
      </div>
    </div>`;

  // Tab switching
  container.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      container.querySelectorAll('.cov-tab-panel').forEach(p => p.style.display = 'none');
      btn.classList.add('active');
      container.querySelector(`#cov-tab-${btn.dataset.tab}`).style.display = '';
    });
  });

  renderHorizontalBar('cov-industry', { labels: byIndustry.map(d => d.label), data: byIndustry.map(d => d.count), color: '#0070F2' });
  renderHorizontalBar('cov-lob', { labels: byLoB.map(d => d.label), data: byLoB.map(d => d.count), color: '#6200EA' });
}
