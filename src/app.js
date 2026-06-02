// Main application — routing, state, filter wiring, CSV upload
// ── CONFIGURATION ────────────────────────────────────────────────────────────

// Define team member capacity (max requests per quarter).
// Leave empty until real capacity data is available.
const CAPACITY_MAP = {
  // "Sarah Chen": 15,
  // "Marcus Johnson": 12,
  // "Elena Rodriguez": 12,
  // "David Kim": 10,
  // "Priya Patel": 10,
  // "James Wilson": 8,
};

// ── SAP Analytics Cloud links ─────────────────────────────────────────────────
// Paste your SAC story URLs here. They will appear in the sidebar.
// Each entry: { label: 'Name shown in sidebar', url: 'https://...' }
const SAC_REPORTS = [
  // { label: 'Pipeline Overview',     url: 'https://your-tenant.cloud.sap/sap/fpa/ui/tenants/...' },
  // { label: 'Regional Performance',  url: 'https://your-tenant.cloud.sap/sap/fpa/ui/tenants/...' },
  // { label: 'Industry Coverage',     url: 'https://your-tenant.cloud.sap/sap/fpa/ui/tenants/...' },
];

// ── Imports ───────────────────────────────────────────────────────────────────

import { createStore, DEFAULT_FILTERS } from './utils/store.js';
import { fmt, getDatePresetRange } from './utils/formatters.js';
import { generateMockRequests, generateMockPipeline } from './data/mockData.js';
import { parseRequestsCSV, parsePipelineCSV } from './data/csvParser.js';
import { applyFilters, applyPipelineFilters, getTaxonomy } from './data/transformations.js';
import { closeDrilldown } from './components/uiComponents.js';

import { renderOverview }        from './pages/overview.js';
import { renderRequests }        from './pages/requests.js';
import { renderAssetMix }        from './pages/assetMix.js';
import { renderAdoption }        from './pages/adoption.js';
import { renderTeamImpact }      from './pages/teamImpact.js';
import { renderCoverage }        from './pages/coverage.js';
import { renderPipelineImpact }  from './pages/pipelineImpact.js';
import { renderDemandCapacity }  from './pages/demandCapacity.js';
import { renderCampaignDetail }  from './pages/campaignDetail.js';
import { renderDataQuality }     from './pages/dataQuality.js';

// ── State ─────────────────────────────────────────────────────────────────────

const mockRequests  = generateMockRequests(120);
const mockPipeline  = generateMockPipeline(mockRequests);

const store = createStore({
  filters: { ...DEFAULT_FILTERS, datePreset: 'all' },
  allRequests:  mockRequests,
  allPipeline:  mockPipeline,
  dataSource:   'mock', // 'mock' | 'csv'
  currentPage:  'overview'
});

// ── Router ────────────────────────────────────────────────────────────────────

const PAGES = {
  overview:        { label: 'Overview',           icon: '⊞', render: renderOverview },
  requests:        { label: 'Requests',            icon: '📋', render: renderRequests },
  assetmix:        { label: 'Asset Mix',           icon: '🎨', render: renderAssetMix },
  adoption:        { label: 'How We Are Used',     icon: '📡', render: renderAdoption },
  teamimpact:      { label: 'Team Impact',         icon: '👥', render: renderTeamImpact },
  coverage:        { label: 'Industry & LoB',      icon: '🗺️', render: renderCoverage },
  pipeline:        { label: 'Pipeline Impact',     icon: '📈', render: renderPipelineImpact },
  demandcapacity:  { label: 'Demand vs Capacity',  icon: '⚖️', render: renderDemandCapacity },
  campaigns:       { label: 'Campaign Detail',     icon: '🔍', render: renderCampaignDetail },
  dataquality:     { label: 'Data Quality',        icon: '✅', render: renderDataQuality }
};

function navigate(page) {
  store.setState({ currentPage: page });
  history.replaceState(null, '', `#${page}`);
  renderCurrentPage();
  updateNav(page);
  closeDrilldown();
  document.getElementById('content-wrapper').scrollTop = 0;
}

function renderCurrentPage() {
  const { filters, allRequests, allPipeline, currentPage } = store.getState();
  const filtered  = applyFilters(allRequests, filters);
  const filtPipe  = applyPipelineFilters(allPipeline, filtered, filters);
  const container = document.getElementById('content');
  const pageDef   = PAGES[currentPage];

  // Update topbar title
  document.getElementById('topbar-title').textContent = pageDef?.label || 'Dashboard';

  switch (currentPage) {
    case 'overview':       renderOverview(container, filtered, filtPipe); break;
    case 'requests':       renderRequests(container, filtered); break;
    case 'assetmix':       renderAssetMix(container, filtered); break;
    case 'adoption':       renderAdoption(container, filtered); break;
    case 'teamimpact':     renderTeamImpact(container, filtered, filtPipe); break;
    case 'coverage':       renderCoverage(container, filtered, filtPipe); break;
    case 'pipeline':       renderPipelineImpact(container, filtered, filtPipe); break;
    case 'demandcapacity': renderDemandCapacity(container, filtered, CAPACITY_MAP); break;
    case 'campaigns':      renderCampaignDetail(container, filtered); break;
    case 'dataquality':    renderDataQuality(container, allRequests, allPipeline); break;
  }
}

function updateNav(activePage) {
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === activePage);
  });
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function buildSidebar() {
  const sidebar = document.getElementById('sidebar');
  const { allRequests, dataSource } = store.getState();
  const overdueCount = allRequests.filter(r => r.isOverdue).length;
  const dqCount = 0;

  sidebar.innerHTML = `
    <div class="sidebar-logo">
      <div class="sidebar-logo-title">Curators Dashboard</div>
      <div class="sidebar-logo-sub">2.0 — ${dataSource === 'mock' ? '⚠ Mock Data' : '✓ Live Data'}</div>
    </div>

    <div class="sidebar-section-label">Dashboard</div>
    ${Object.entries(PAGES).map(([key, p]) => `
      <a class="nav-item" data-page="${key}" href="#${key}">
        <span class="nav-icon">${p.icon}</span>
        <span style="flex:1">${p.label}</span>
        ${key === 'dataquality' && dqCount > 0 ? `<span style="background:#DF6E0C;color:#fff;border-radius:10px;padding:1px 7px;font-size:10px">${dqCount}</span>` : ''}
      </a>`).join('')}

    <div class="sidebar-section-label" style="margin-top:16px">SAC Reports</div>
    ${SAC_REPORTS.length > 0
      ? SAC_REPORTS.map(r => `
      <a class="nav-item" href="${r.url}" target="_blank" rel="noopener" style="opacity:.85">
        <span class="nav-icon">📊</span>
        <span style="flex:1">${r.label}</span>
        <span style="font-size:10px;opacity:.5">↗</span>
      </a>`).join('')
      : `<div style="padding:6px 16px 10px;font-size:11px;color:rgba(255,255,255,.3);line-height:1.5">
           Add SAC story URLs in<br><code style="color:rgba(255,255,255,.45)">app.js → SAC_REPORTS</code>
         </div>`
    }

    <div class="sidebar-footer">
      <div style="font-size:11px;color:rgba(255,255,255,.4);margin-bottom:10px">DATA SOURCE</div>
      <label class="upload-zone" id="upload-requests" title="Upload Requests CSV">
        <input type="file" accept=".csv" style="display:none" id="file-requests">
        <div style="font-size:11px;color:rgba(255,255,255,.6)">📁 Upload Requests CSV</div>
      </label>
      <label class="upload-zone" style="margin-top:8px" id="upload-pipeline" title="Upload Pipeline CSV">
        <input type="file" accept=".csv" style="display:none" id="file-pipeline">
        <div style="font-size:11px;color:rgba(255,255,255,.6)">📁 Upload Pipeline CSV</div>
      </label>
      <button id="use-mock-btn" class="btn btn-outline btn-sm" style="margin-top:8px;width:100%">Reset to Mock Data</button>
      <div style="font-size:10px;color:rgba(255,255,255,.3);margin-top:10px">${allRequests.length} requests · ${store.getState().allPipeline.length} pipeline records</div>
    </div>`;

  sidebar.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', (e) => { e.preventDefault(); navigate(el.dataset.page); });
  });

  document.getElementById('file-requests').addEventListener('change', handleRequestsUpload);
  document.getElementById('file-pipeline').addEventListener('change', handlePipelineUpload);
  document.getElementById('use-mock-btn').addEventListener('click', () => {
    store.setState({ allRequests: mockRequests, allPipeline: mockPipeline, dataSource: 'mock' });
    buildSidebar();
    buildFilterBar();
    renderCurrentPage();
  });
}

// ── Filter bar ────────────────────────────────────────────────────────────────

function buildFilterBar() {
  const { allRequests, filters } = store.getState();
  const tax = getTaxonomy(allRequests);
  const bar = document.getElementById('filter-bar');
  const activeCount = countActiveFilters(filters);

  bar.innerHTML = `
    <div class="filter-group">
      <label class="filter-label">Period</label>
      <select class="filter-select" id="f-preset">
        <option value="all" ${filters.datePreset==='all'?'selected':''}>All Time</option>
        <option value="ytd" ${filters.datePreset==='ytd'?'selected':''}>Year-to-Date</option>
        <option value="q_current" ${filters.datePreset==='q_current'?'selected':''}>Current Quarter</option>
        <option value="q_prev" ${filters.datePreset==='q_prev'?'selected':''}>Previous Quarter</option>
        <option value="l12m" ${filters.datePreset==='l12m'?'selected':''}>Last 12 Months</option>
        <option value="custom" ${filters.datePreset==='custom'?'selected':''}>Custom Range</option>
      </select>
    </div>
    ${filters.datePreset === 'custom' ? `
    <div class="filter-group">
      <label class="filter-label">From</label>
      <input type="date" class="filter-select" id="f-date-start" value="${filters.dateStart || ''}">
      <label class="filter-label" style="margin-left:6px">To</label>
      <input type="date" class="filter-select" id="f-date-end" value="${filters.dateEnd || ''}">
    </div>` : ''}

    ${buildMultiSelect('f-region',    'Region',      tax.regions,       filters.regions)}
    ${buildMultiSelect('f-role',      'Role',        tax.requesterRoles, filters.requesterRoles)}
    ${buildMultiSelect('f-camptype',  'Campaign',    tax.campaignTypes,  filters.campaignTypes)}
    ${buildMultiSelect('f-solution',  'Solution',    tax.solutionAreas,  filters.solutionAreas)}
    ${buildMultiSelect('f-industry',  'Industry',    tax.industries,     filters.industries)}
    ${buildMultiSelect('f-lob',       'LoB',         tax.lobs,           filters.lobs)}
    ${buildMultiSelect('f-asset',     'Asset Type',  tax.assetTypes,     filters.assetTypes)}
    ${buildMultiSelect('f-status',    'Status',      tax.statuses,       filters.statuses)}
    ${buildMultiSelect('f-member',    'Team Member', tax.teamMembers,    filters.teamMembers)}

    <div class="filter-group" style="margin-left:auto">
      <input type="text" class="filter-select" id="f-search" placeholder="Search…" value="${filters.search || ''}" style="width:160px">
    </div>
    ${activeCount > 0 ? `<button id="f-clear" class="btn btn-outline btn-sm">Clear Filters <span class="filter-active-count">${activeCount}</span></button>` : ''}`;

  // Wire up preset change
  document.getElementById('f-preset')?.addEventListener('change', e => {
    setFilter('datePreset', e.target.value);
    buildFilterBar(); // Rebuild to show/hide custom date inputs
    renderCurrentPage();
  });
  document.getElementById('f-date-start')?.addEventListener('change', e => { setFilter('dateStart', e.target.value); renderCurrentPage(); });
  document.getElementById('f-date-end')?.addEventListener('change',   e => { setFilter('dateEnd', e.target.value);   renderCurrentPage(); });
  document.getElementById('f-search')?.addEventListener('input', e => { setFilter('search', e.target.value); renderCurrentPage(); });
  document.getElementById('f-clear')?.addEventListener('click', () => {
    store.setState({ filters: { ...DEFAULT_FILTERS, datePreset: 'all' } });
    buildFilterBar();
    renderCurrentPage();
  });

  // Multi-select filters
  const multiMap = {
    'f-region':   'regions',
    'f-role':     'requesterRoles',
    'f-camptype': 'campaignTypes',
    'f-solution': 'solutionAreas',
    'f-industry': 'industries',
    'f-lob':      'lobs',
    'f-asset':    'assetTypes',
    'f-status':   'statuses',
    'f-member':   'teamMembers'
  };
  Object.entries(multiMap).forEach(([elId, filterKey]) => {
    document.getElementById(elId)?.addEventListener('change', e => {
      const selected = [...e.target.selectedOptions].map(o => o.value).filter(v => v !== '');
      setFilter(filterKey, selected);
      renderCurrentPage();
    });
  });
}

function buildMultiSelect(id, label, options, selected) {
  if (!options.length) return '';
  return `
    <div class="filter-group">
      <label class="filter-label">${label}</label>
      <select class="filter-select" id="${id}" multiple size="1" title="${label}">
        <option value="">All</option>
        ${options.map(o => `<option value="${o}" ${selected.includes(o) ? 'selected' : ''}>${o}</option>`).join('')}
      </select>
    </div>`;
}

function setFilter(key, value) {
  const { filters } = store.getState();
  store.setState({ filters: { ...filters, [key]: value } });
}

function countActiveFilters(filters) {
  let count = 0;
  if (filters.datePreset !== 'all') count++;
  const multiKeys = ['regions','requesterRoles','campaignTypes','solutionAreas','industries','lobs','assetTypes','statuses','teamMembers'];
  multiKeys.forEach(k => { if (filters[k]?.length) count++; });
  if (filters.search) count++;
  return count;
}

// ── CSV Upload ────────────────────────────────────────────────────────────────

function handleRequestsUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const { rows, unmappedFields } = parseRequestsCSV(ev.target.result);
      if (!rows.length) { alert('No rows found. Check that the CSV has the expected columns.'); return; }
      const pipeline = store.getState().allPipeline;
      store.setState({ allRequests: rows, dataSource: 'csv' });
      buildSidebar();
      buildFilterBar();
      renderCurrentPage();
      if (unmappedFields.length > 0) {
        console.warn('Unmapped CSV columns:', unmappedFields.join(', '));
      }
      alert(`✓ Loaded ${rows.length} requests from "${file.name}"`);
    } catch (err) {
      alert(`Error parsing CSV: ${err.message}`);
    }
  };
  reader.readAsText(file);
}

function handlePipelineUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const { rows } = parsePipelineCSV(ev.target.result);
      store.setState({ allPipeline: rows, dataSource: 'csv' });
      buildSidebar();
      renderCurrentPage();
      alert(`✓ Loaded ${rows.length} pipeline records from "${file.name}"`);
    } catch (err) {
      alert(`Error parsing pipeline CSV: ${err.message}`);
    }
  };
  reader.readAsText(file);
}

// ── Export ────────────────────────────────────────────────────────────────────

function exportFilteredData() {
  const { filters, allRequests } = store.getState();
  const filtered = applyFilters(allRequests, filters);
  const headers = ['requestId','campaignId','campaignName','requester','requesterRole','region','mu','industry','lob','solutionArea','campaignType','assetType','status','assignedTo','submittedDate','completedDate','dueDate','datSupportedNeededLink','influencedPipeline','sourcedPipeline','accountsTouched'];
  const csv = [headers.join(','), ...filtered.map(r => headers.map(h => {
    const v = r[h] ?? '';
    return typeof v === 'string' && v.includes(',') ? `"${v.replace(/"/g, '""')}"` : v;
  }).join(','))].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `curators-dashboard-export-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Topbar ────────────────────────────────────────────────────────────────────

function buildTopbar() {
  const topbar = document.getElementById('topbar');
  const filterToggle = topbar.querySelector('#filter-toggle');
  if (!filterToggle) {
    const btn = document.createElement('button');
    btn.id = 'filter-toggle';
    btn.className = 'btn btn-outline btn-sm';
    btn.textContent = '⚙ Filters';
    btn.addEventListener('click', () => {
      const bar = document.getElementById('filter-bar');
      bar.classList.toggle('hidden');
    });
    topbar.appendChild(btn);

    const exportBtn = document.createElement('button');
    exportBtn.className = 'btn btn-outline btn-sm';
    exportBtn.textContent = '⬇ Export';
    exportBtn.addEventListener('click', exportFilteredData);
    topbar.appendChild(exportBtn);
  }
}

// ── Drilldown panel wiring ────────────────────────────────────────────────────

function setupDrilldown() {
  document.getElementById('drilldown-close').addEventListener('click', closeDrilldown);
  document.getElementById('drilldown-overlay').addEventListener('click', closeDrilldown);
}

// ── Auto-load from GitHub repo data file ─────────────────────────────────────
// Power Automate updates data/requests.csv in this GitHub repo daily.
// On startup the dashboard tries to fetch it automatically.
// Falls back to mock data if the file doesn't exist yet.

async function tryAutoLoad() {
  try {
    const res = await fetch('data/requests.csv');
    if (!res.ok) return false;
    const text = await res.text();
    const { rows } = parseRequestsCSV(text);
    if (!rows.length) return false;
    store.setState({ allRequests: rows, dataSource: 'csv' });
    return true;
  } catch (_) {
    return false;
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  const initialPage = location.hash.replace('#', '') || 'overview';
  store.setState({ currentPage: PAGES[initialPage] ? initialPage : 'overview' });

  buildSidebar();
  buildTopbar();
  buildFilterBar();
  setupDrilldown();

  await tryAutoLoad();

  renderCurrentPage();
  updateNav(store.getState().currentPage);

  window.addEventListener('hashchange', () => {
    const page = location.hash.replace('#', '');
    if (PAGES[page]) {
      store.setState({ currentPage: page });
      renderCurrentPage();
      updateNav(page);
    }
  });
});
