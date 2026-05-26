// Page 3 — Asset Mix

import { computeAssetMix, computeAssetsByDimension, getTaxonomy } from '../data/transformations.js';
import { renderDoughnutChart, renderBarChart, destroyPageCharts, COLORS } from '../components/charts.js';
import { fmt } from '../utils/formatters.js';

export function renderAssetMix(container, requests) {
  destroyPageCharts('am-');
  const mix = computeAssetMix(requests);
  const byRegion = computeAssetsByDimension(requests, 'region');
  const bySolution = computeAssetsByDimension(requests, 'solutionArea');
  const tax = getTaxonomy(requests);

  // Build stacked bar for assets by region
  const assetTypes = tax.assetTypes;
  const regions = Object.keys(byRegion);
  const regionDatasets = assetTypes.map((at, i) => ({
    label: at,
    data: regions.map(r => byRegion[r][at] || 0),
    backgroundColor: COLORS.palette[i % COLORS.palette.length]
  }));

  const solutions = Object.keys(bySolution);
  const solutionDatasets = assetTypes.map((at, i) => ({
    label: at,
    data: solutions.map(s => bySolution[s][at] || 0),
    backgroundColor: COLORS.palette[i % COLORS.palette.length]
  }));

  container.innerHTML = `
    <div>
      <p class="page-title">Asset Mix</p>
      <p class="page-subtitle">Distribution of asset types created by the Curators team</p>

      <div class="section-grid section-grid-2" style="margin-bottom:16px">
        <div class="card">
          <div class="card-header"><span class="card-title">Asset Type Distribution</span>
            <span style="font-size:11px;color:#6A7380">Completed requests</span>
          </div>
          <div class="card-body"><div class="chart-container"><canvas id="am-donut"></canvas></div></div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Asset Count by Type</span></div>
          <div class="card-body">
            <table class="data-table">
              <thead><tr><th>Asset Type</th><th>Count</th><th>Share</th></tr></thead>
              <tbody>${mix.map(m => `
                <tr>
                  <td>${m.label}</td>
                  <td><strong>${fmt.number(m.count)}</strong></td>
                  <td>
                    <div style="display:flex;align-items:center;gap:8px">
                      <div class="progress-bar" style="width:100px">
                        <div class="progress-fill" style="width:${m.pct.toFixed(0)}%;background:#0070F2"></div>
                      </div>
                      <span>${fmt.pct(m.pct)}</span>
                    </div>
                  </td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="section-grid section-grid-2" style="margin-bottom:16px">
        <div class="card">
          <div class="card-header"><span class="card-title">Assets by Region</span></div>
          <div class="card-body"><div class="chart-container"><canvas id="am-region"></canvas></div></div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Assets by Solution Area</span></div>
          <div class="card-body"><div class="chart-container"><canvas id="am-solution"></canvas></div></div>
        </div>
      </div>
    </div>`;

  renderDoughnutChart('am-donut', {
    labels: mix.map(m => m.label),
    data: mix.map(m => m.count),
    height: 280
  });

  if (regions.length && assetTypes.length) {
    renderBarChart('am-region', { labels: regions, datasets: regionDatasets, stacked: true, height: 280 });
  }
  if (solutions.length && assetTypes.length) {
    renderBarChart('am-solution', { labels: solutions, datasets: solutionDatasets, stacked: true, height: 280 });
  }
}
