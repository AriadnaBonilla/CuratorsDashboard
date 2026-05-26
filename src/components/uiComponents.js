// Reusable UI components: KPI cards, tables, badges, drilldown panel

import { fmt } from '../utils/formatters.js';

// ── KPI card ──────────────────────────────────────────────────────────────────

export function kpiCard({ label, value, sub, accent = 'primary', icon = '' }) {
  return `
    <div class="kpi-card ${accent}">
      <div class="kpi-label">${icon ? `<span>${icon}</span> ` : ''}${label}</div>
      <div class="kpi-value">${value}</div>
      ${sub ? `<div class="kpi-sub">${sub}</div>` : ''}
    </div>`;
}

// ── Status badge ──────────────────────────────────────────────────────────────

export function statusBadge(status) {
  if (!status) return '';
  const map = {
    'Completed':            'badge-completed',
    'In Progress':          'badge-in-progress',
    'Pending':              'badge-pending',
    'Cancelled':            'badge-cancelled',
    'Out of Scope':         'badge-out-of-scope',
    'Waiting for Feedback': 'badge-waiting',
    'No Action Needed':     'badge-no-action',
    'Overdue':              'badge-overdue'
  };
  const cls = map[status] || 'badge-info';
  return `<span class="badge ${cls}">${status}</span>`;
}

export function severityBadge(severity) {
  const map = { error: 'badge-cancelled', warning: 'badge-pending', info: 'badge-info' };
  return `<span class="badge ${map[severity] || 'badge-info'}">${fmt.titleCase(severity)}</span>`;
}

// ── Drilldown panel ───────────────────────────────────────────────────────────

export function openDrilldown(title, bodyHtml) {
  document.getElementById('drilldown-title').textContent = title;
  document.getElementById('drilldown-body').innerHTML = bodyHtml;
  document.getElementById('drilldown-overlay').classList.add('open');
  document.getElementById('drilldown-panel').classList.add('open');
}

export function closeDrilldown() {
  document.getElementById('drilldown-overlay').classList.remove('open');
  document.getElementById('drilldown-panel').classList.remove('open');
}

export function detailRow(label, value) {
  if (value === null || value === undefined || value === '' || value === '—') {
    return `<div class="detail-row"><span class="detail-label">${label}</span><span class="detail-value text-muted">—</span></div>`;
  }
  const isLink = typeof value === 'string' && value.startsWith('http');
  const display = isLink ? `<a href="${value}" target="_blank" class="detail-link" title="${value}">View asset ↗</a>` : value;
  return `<div class="detail-row"><span class="detail-label">${label}</span><span class="detail-value">${display}</span></div>`;
}

export function requestDrilldownHtml(req) {
  const hasPipeline = req.influencedPipeline || req.sourcedPipeline;
  return `
    <h4 style="margin:0 0 14px;font-size:14px;color:#32363A">${req.campaignName || '(No campaign name)'}</h4>
    <div style="margin-bottom:16px">${statusBadge(req.status)}${req.isOverdue ? ' ' + statusBadge('Overdue') : ''}</div>
    <hr class="section-divider" style="margin:12px 0">
    <p style="font-size:11px;font-weight:600;color:#6A7380;text-transform:uppercase;letter-spacing:.5px;margin:0 0 8px">Identifiers</p>
    ${detailRow('Request ID', req.requestId)}
    ${detailRow('Campaign ID', req.campaignId)}
    ${detailRow('Asset Link', req.datSupportedNeededLink)}
    <hr class="section-divider" style="margin:12px 0">
    <p style="font-size:11px;font-weight:600;color:#6A7380;text-transform:uppercase;letter-spacing:.5px;margin:0 0 8px">Requester</p>
    ${detailRow('Requester', req.requester)}
    ${detailRow('Role', req.requesterRole)}
    ${detailRow('Region', req.region)}
    ${detailRow('MU', req.mu)}
    <hr class="section-divider" style="margin:12px 0">
    <p style="font-size:11px;font-weight:600;color:#6A7380;text-transform:uppercase;letter-spacing:.5px;margin:0 0 8px">Campaign Details</p>
    ${detailRow('Campaign Type', req.campaignType)}
    ${detailRow('Asset Type', req.assetType)}
    ${detailRow('Industry', req.industry)}
    ${detailRow('LoB', req.lob)}
    ${detailRow('Solution Area', req.solutionArea)}
    ${detailRow('Assigned To', req.assignedTo)}
    <hr class="section-divider" style="margin:12px 0">
    <p style="font-size:11px;font-weight:600;color:#6A7380;text-transform:uppercase;letter-spacing:.5px;margin:0 0 8px">Timeline</p>
    ${detailRow('Submitted', fmt.date(req.submittedDate))}
    ${detailRow('Due Date', fmt.date(req.dueDate))}
    ${detailRow('Completed', fmt.date(req.completedDate))}
    ${req.submittedDate && req.completedDate ? detailRow('Delivery Time', fmt.days(Math.round((new Date(req.completedDate) - new Date(req.submittedDate)) / 86400000))) : ''}
    ${hasPipeline ? `
    <hr class="section-divider" style="margin:12px 0">
    <p style="font-size:11px;font-weight:600;color:#6A7380;text-transform:uppercase;letter-spacing:.5px;margin:0 0 8px">Pipeline Impact</p>
    ${detailRow('Influenced Pipeline', req.influencedPipeline ? fmt.currency(req.influencedPipeline) : null)}
    ${detailRow('Sourced Pipeline', req.sourcedPipeline ? fmt.currency(req.sourcedPipeline) : null)}
    ${detailRow('Accounts Touched', req.accountsTouched)}
    ` : ''}`;
}

// ── Sortable data table ───────────────────────────────────────────────────────

export class DataTable {
  constructor({ container, columns, rows, pageSize = 20, onRowClick, searchable = false }) {
    this.container = container;
    this.columns = columns;
    this.allRows = rows;
    this.filteredRows = rows;
    this.pageSize = pageSize;
    this.currentPage = 1;
    this.sortCol = null;
    this.sortDir = 'asc';
    this.onRowClick = onRowClick;
    this.searchable = searchable;
    this.searchQuery = '';
    this.render();
  }

  setRows(rows) {
    this.allRows = rows;
    this.filteredRows = rows;
    this.currentPage = 1;
    this.render();
  }

  render() {
    const sorted = this._sorted();
    const start = (this.currentPage - 1) * this.pageSize;
    const page = sorted.slice(start, start + this.pageSize);
    const totalPages = Math.ceil(sorted.length / this.pageSize);

    this.container.innerHTML = `
      ${this.searchable ? `<div style="padding:10px 0 8px;display:flex;gap:8px;align-items:center">
        <input class="search-input" placeholder="Search…" value="${this.searchQuery}" id="dt-search-${this.container.id}">
        <span style="font-size:12px;color:#6A7380">${sorted.length} record${sorted.length !== 1 ? 's' : ''}</span>
      </div>` : ''}
      <div class="data-table-wrap">
        <table class="data-table">
          <thead><tr>${this.columns.map(c => `
            <th data-col="${c.key}" class="${this.sortCol === c.key ? 'sorted' : ''}" style="${c.width ? 'width:' + c.width : ''}">
              ${c.label}<span class="sort-arrow">${this.sortCol === c.key ? (this.sortDir === 'asc' ? ' ↑' : ' ↓') : ' ↕'}</span>
            </th>`).join('')}</tr></thead>
          <tbody>${page.length ? page.map(row => `
            <tr class="${this.onRowClick ? 'clickable' : ''}" data-id="${row._rowId ?? ''}">
              ${this.columns.map(c => `<td>${c.render ? c.render(row[c.key], row) : (row[c.key] ?? '—')}</td>`).join('')}
            </tr>`).join('') : `<tr><td colspan="${this.columns.length}" class="empty-state">No records match the current filters.</td></tr>`}
          </tbody>
        </table>
      </div>
      ${totalPages > 1 ? `
      <div class="table-pagination">
        <span>Page ${this.currentPage} of ${totalPages}</span>
        <button id="dt-prev" ${this.currentPage === 1 ? 'disabled' : ''}>‹ Prev</button>
        <button id="dt-next" ${this.currentPage === totalPages ? 'disabled' : ''}>Next ›</button>
      </div>` : ''}`;

    this.container.querySelectorAll('thead th').forEach(th => {
      th.addEventListener('click', () => {
        const col = th.dataset.col;
        if (this.sortCol === col) this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
        else { this.sortCol = col; this.sortDir = 'asc'; }
        this.currentPage = 1;
        this.render();
      });
    });

    if (this.onRowClick) {
      this.container.querySelectorAll('tbody tr.clickable').forEach(tr => {
        tr.addEventListener('click', () => {
          const id = tr.dataset.id;
          const row = this.allRows.find(r => String(r._rowId) === id || String(r.requestId) === id);
          if (row) this.onRowClick(row);
        });
      });
    }

    const searchEl = this.container.querySelector(`#dt-search-${this.container.id}`);
    if (searchEl) {
      searchEl.addEventListener('input', e => {
        this.searchQuery = e.target.value.toLowerCase();
        this.filteredRows = this.allRows.filter(row =>
          Object.values(row).some(v => v && v.toString().toLowerCase().includes(this.searchQuery))
        );
        this.currentPage = 1;
        this.render();
      });
    }

    const prevBtn = this.container.querySelector('#dt-prev');
    const nextBtn = this.container.querySelector('#dt-next');
    if (prevBtn) prevBtn.addEventListener('click', () => { this.currentPage--; this.render(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { this.currentPage++; this.render(); });
  }

  _sorted() {
    if (!this.sortCol) return this.filteredRows;
    return [...this.filteredRows].sort((a, b) => {
      const av = a[this.sortCol], bv = b[this.sortCol];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = typeof av === 'number' ? av - bv : av.toString().localeCompare(bv.toString());
      return this.sortDir === 'asc' ? cmp : -cmp;
    });
  }
}

// ── Simple multi-select filter builder ───────────────────────────────────────

export function buildFilterSelect(id, label, options, selected, onChange) {
  const sel = `
    <div class="filter-group">
      <label class="filter-label">${label}</label>
      <select class="filter-select" id="${id}" multiple size="1" title="${label}">
        <option value="">All ${label}s</option>
        ${options.map(o => `<option value="${o}" ${selected.includes(o) ? 'selected' : ''}>${o}</option>`).join('')}
      </select>
    </div>`;
  return sel;
}
