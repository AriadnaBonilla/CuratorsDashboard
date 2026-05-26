// Data transformation layer — all dashboard metrics computed here
// Pages import these functions; no business logic lives in page components.

import { daysBetween, getDatePresetRange, fmt } from '../utils/formatters.js';

const TODAY = new Date('2025-05-26');

// ── Filter application ────────────────────────────────────────────────────────

export function applyFilters(requests, filters) {
  const { start, end } = filters.dateStart && filters.dateEnd
    ? { start: new Date(filters.dateStart), end: new Date(filters.dateEnd) }
    : getDatePresetRange(filters.datePreset || 'all');

  return requests.filter(r => {
    const submitted = r.submittedDate ? new Date(r.submittedDate) : null;
    if (start && submitted && submitted < start) return false;
    if (end && submitted && submitted > end) return false;
    if (filters.regions?.length && !filters.regions.includes(r.region)) return false;
    if (filters.requesterRoles?.length && !filters.requesterRoles.includes(r.requesterRole)) return false;
    if (filters.campaignTypes?.length && !filters.campaignTypes.includes(r.campaignType)) return false;
    if (filters.solutionAreas?.length && !filters.solutionAreas.includes(r.solutionArea)) return false;
    if (filters.industries?.length && !filters.industries.includes(r.industry)) return false;
    if (filters.lobs?.length && !filters.lobs.includes(r.lob)) return false;
    if (filters.assetTypes?.length && !filters.assetTypes.includes(r.assetType)) return false;
    if (filters.statuses?.length && !filters.statuses.includes(r.status)) return false;
    if (filters.teamMembers?.length && !filters.teamMembers.includes(r.assignedTo)) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const haystack = [r.requestId, r.campaignId, r.campaignName, r.requester, r.assignedTo, r.industry].join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export function applyPipelineFilters(pipeline, requests, filters) {
  const filteredIds = new Set(requests.map(r => r.requestId));
  return pipeline.filter(p => {
    if (p.requestId && !filteredIds.has(p.requestId)) return false;
    return true;
  });
}

// ── Taxonomy discovery (dynamic, never hardcoded in pages) ───────────────────

export function getTaxonomy(requests) {
  const unique = (fn) => [...new Set(requests.map(fn).filter(Boolean))].sort();
  return {
    regions:        unique(r => r.region),
    mus:            unique(r => r.mu),
    industries:     unique(r => r.industry),
    lobs:           unique(r => r.lob),
    solutionAreas:  unique(r => r.solutionArea),
    campaignTypes:  unique(r => r.campaignType),
    assetTypes:     unique(r => r.assetType),
    requesterRoles: unique(r => r.requesterRole),
    teamMembers:    unique(r => r.assignedTo),
    statuses:       unique(r => r.status)
  };
}

// ── KPI: Overview metrics ─────────────────────────────────────────────────────

export function computeOverviewKPIs(requests, pipelineRecords) {
  const total = requests.length;
  const completed = requests.filter(r => r.status === 'Completed');
  const inProgress = requests.filter(r => r.status === 'In Progress');
  const cancelled = requests.filter(r => r.status === 'Cancelled');
  const overdue = requests.filter(r => r.isOverdue);
  const hasDueDate = requests.some(r => r.dueDate);

  const deliveryTimes = completed
    .filter(r => r.submittedDate && r.completedDate)
    .map(r => daysBetween(r.submittedDate, r.completedDate));

  const avgDelivery = deliveryTimes.length
    ? deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length : null;

  const totalAssets = completed.length;
  const completionRate = total > 0 ? (completed.length / total) * 100 : 0;

  const influenced = pipelineRecords.filter(p => p.type === 'Influenced').reduce((a, p) => a + (p.amount || 0), 0);
  const sourced = pipelineRecords.filter(p => p.type === 'Sourced').reduce((a, p) => a + (p.amount || 0), 0);
  const accountsTouched = [...new Set(requests.filter(r => r.accountsTouched).flatMap(r => r.accountsTouched))].length;
  const hasPipeline = pipelineRecords.length > 0;
  const hasAccounts = requests.some(r => r.accountsTouched);

  return {
    total, completed: completed.length, inProgress: inProgress.length,
    cancelled: cancelled.length, overdue: overdue.length, hasDueDate,
    completionRate, avgDelivery, totalAssets,
    influencedPipeline: influenced, sourcedPipeline: sourced,
    accountsTouched: requests.reduce((a, r) => a + (r.accountsTouched || 0), 0),
    hasPipeline, hasAccounts
  };
}

// ── Request volume over time ──────────────────────────────────────────────────

export function computeVolumeByMonth(requests) {
  const map = {};
  requests.forEach(r => {
    if (!r.submittedDate) return;
    const key = fmt.monthYear(r.submittedDate);
    if (!map[key]) map[key] = { label: key, submitted: 0, completed: 0, cancelled: 0, inProgress: 0 };
    map[key].submitted++;
    if (r.status === 'Completed') map[key].completed++;
    else if (r.status === 'Cancelled') map[key].cancelled++;
    else map[key].inProgress++;
  });
  return Object.values(map).sort((a, b) => new Date('1 ' + a.label) - new Date('1 ' + b.label));
}

export function computeVolumeByQuarter(requests) {
  const map = {};
  requests.forEach(r => {
    if (!r.submittedDate) return;
    const key = fmt.quarter(r.submittedDate);
    if (!map[key]) map[key] = { label: key, submitted: 0, completed: 0, cancelled: 0, inProgress: 0 };
    map[key].submitted++;
    if (r.status === 'Completed') map[key].completed++;
    else if (r.status === 'Cancelled') map[key].cancelled++;
    else map[key].inProgress++;
  });
  return Object.values(map).sort((a, b) => {
    const pa = a.label.split(' '); const pb = b.label.split(' ');
    return pa[1] - pb[1] || pa[0].localeCompare(pb[0]);
  });
}

export function computeRequestAging(requests) {
  const buckets = { '0–7 days': 0, '8–14 days': 0, '15–30 days': 0, '31–60 days': 0, '60+ days': 0 };
  requests.filter(r => r.status === 'In Progress' || r.status === 'Pending').forEach(r => {
    const age = r.submittedDate ? daysBetween(r.submittedDate, TODAY) : 0;
    if (age <= 7) buckets['0–7 days']++;
    else if (age <= 14) buckets['8–14 days']++;
    else if (age <= 30) buckets['15–30 days']++;
    else if (age <= 60) buckets['31–60 days']++;
    else buckets['60+ days']++;
  });
  return Object.entries(buckets).map(([label, count]) => ({ label, count }));
}

// ── Asset mix ─────────────────────────────────────────────────────────────────

export function computeAssetMix(requests) {
  const map = {};
  requests.filter(r => r.status === 'Completed').forEach(r => {
    const t = r.assetType || 'Unknown';
    map[t] = (map[t] || 0) + 1;
  });
  const total = Object.values(map).reduce((a, b) => a + b, 0);
  return Object.entries(map)
    .map(([label, count]) => ({ label, count, pct: total ? (count / total) * 100 : 0 }))
    .sort((a, b) => b.count - a.count);
}

export function computeAssetsByDimension(requests, dimension) {
  const map = {};
  requests.filter(r => r.status === 'Completed').forEach(r => {
    const dim = r[dimension] || 'Unknown';
    if (!map[dim]) map[dim] = {};
    const asset = r.assetType || 'Unknown';
    map[dim][asset] = (map[dim][asset] || 0) + 1;
  });
  return map;
}

// ── Adoption (how the team is used) ──────────────────────────────────────────

export function computeByDimension(requests, dimension) {
  const map = {};
  requests.forEach(r => {
    const val = r[dimension] || 'Unknown';
    map[val] = (map[val] || 0) + 1;
  });
  return Object.entries(map)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

export function computeAdoptionTrend(requests) {
  const map = {};
  requests.forEach(r => {
    if (!r.submittedDate) return;
    const key = fmt.quarter(r.submittedDate);
    if (!map[key]) map[key] = { label: key, uniqueRequesters: new Set(), requests: 0 };
    map[key].requests++;
    if (r.requester) map[key].uniqueRequesters.add(r.requester);
  });
  return Object.values(map)
    .map(d => ({ label: d.label, requests: d.requests, uniqueRequesters: d.uniqueRequesters.size }))
    .sort((a, b) => {
      const pa = a.label.split(' '), pb = b.label.split(' ');
      return pa[1] - pb[1] || pa[0].localeCompare(pb[0]);
    });
}

// ── Team impact ───────────────────────────────────────────────────────────────

export function computeTeamMetrics(requests, pipelineRecords) {
  const map = {};

  requests.forEach(r => {
    const name = r.assignedTo || 'Unassigned';
    if (!map[name]) map[name] = {
      name, handled: 0, completed: 0, inProgress: 0, overdue: 0,
      deliveryTimes: [], assetTypes: {}, influencedPipeline: 0, sourcedPipeline: 0, accountsTouched: 0
    };
    const m = map[name];
    m.handled++;
    if (r.status === 'Completed') {
      m.completed++;
      if (r.submittedDate && r.completedDate) m.deliveryTimes.push(daysBetween(r.submittedDate, r.completedDate));
    }
    if (r.status === 'In Progress') m.inProgress++;
    if (r.isOverdue) m.overdue++;
    m.accountsTouched += r.accountsTouched || 0;
    if (r.assetType) m.assetTypes[r.assetType] = (m.assetTypes[r.assetType] || 0) + 1;
  });

  pipelineRecords.forEach(p => {
    const name = p.assignedTo;
    if (name && map[name]) {
      if (p.type === 'Influenced') map[name].influencedPipeline += p.amount || 0;
      if (p.type === 'Sourced') map[name].sourcedPipeline += p.amount || 0;
    }
  });

  return Object.values(map).map(m => ({
    ...m,
    avgDelivery: m.deliveryTimes.length ? m.deliveryTimes.reduce((a, b) => a + b, 0) / m.deliveryTimes.length : null,
    completionRate: m.handled > 0 ? (m.completed / m.handled) * 100 : 0,
    topAsset: Object.entries(m.assetTypes).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'
  })).sort((a, b) => b.handled - a.handled);
}

// ── Coverage matrices ─────────────────────────────────────────────────────────

export function computeCoverageMatrix(requests, pipelineRecords, rowDimension, colDimension) {
  const rows = new Set(), cols = new Set();
  requests.forEach(r => {
    if (r[rowDimension]) rows.add(r[rowDimension]);
    if (r[colDimension]) cols.add(r[colDimension]);
  });

  const matrix = {};
  [...rows].forEach(row => {
    matrix[row] = {};
    [...cols].forEach(col => { matrix[row][col] = { requests: 0, completed: 0, pipeline: 0 }; });
  });

  requests.forEach(r => {
    const row = r[rowDimension], col = r[colDimension];
    if (row && col && matrix[row]?.[col]) {
      matrix[row][col].requests++;
      if (r.status === 'Completed') matrix[row][col].completed++;
    }
  });

  pipelineRecords.forEach(p => {
    const row = p[rowDimension], col = p[colDimension];
    if (row && col && matrix[row]?.[col]) matrix[row][col].pipeline += p.amount || 0;
  });

  return { matrix, rows: [...rows].sort(), cols: [...cols].sort() };
}

// ── Pipeline impact ───────────────────────────────────────────────────────────

export function computePipelineByDimension(pipelineRecords, dimension) {
  const map = {};
  pipelineRecords.forEach(p => {
    const val = p[dimension] || 'Unknown';
    if (!map[val]) map[val] = { label: val, influenced: 0, sourced: 0 };
    if (p.type === 'Influenced') map[val].influenced += p.amount || 0;
    else map[val].sourced += p.amount || 0;
  });
  return Object.values(map)
    .map(d => ({ ...d, total: d.influenced + d.sourced }))
    .sort((a, b) => b.total - a.total);
}

export function computePipelineKPIs(pipelineRecords) {
  const influenced = pipelineRecords.filter(p => p.type === 'Influenced').reduce((a, p) => a + (p.amount || 0), 0);
  const sourced = pipelineRecords.filter(p => p.type === 'Sourced').reduce((a, p) => a + (p.amount || 0), 0);
  const opps = new Set(pipelineRecords.map(p => p.opportunityId)).size;
  const accounts = new Set(pipelineRecords.map(p => p.accountName).filter(Boolean)).size;
  return { influenced, sourced, total: influenced + sourced, opps, accounts };
}

// ── Demand vs Capacity ────────────────────────────────────────────────────────

export function computeDemandCapacity(requests, capacityMap = {}) {
  // capacityMap: { "Sarah Chen": 10, ... } — max requests per quarter per person
  // Pass empty object when capacity not yet defined.
  const byMember = {};
  requests.forEach(r => {
    const name = r.assignedTo || 'Unassigned';
    const q = r.submittedDate ? fmt.quarter(r.submittedDate) : 'Unknown';
    const key = `${name}__${q}`;
    if (!byMember[key]) byMember[key] = { name, quarter: q, requests: 0, completed: 0, open: 0, overdue: 0, deliveryTimes: [] };
    byMember[key].requests++;
    if (r.status === 'Completed') {
      byMember[key].completed++;
      if (r.submittedDate && r.completedDate) byMember[key].deliveryTimes.push(daysBetween(r.submittedDate, r.completedDate));
    } else {
      byMember[key].open++;
    }
    if (r.isOverdue) byMember[key].overdue++;
  });

  return Object.values(byMember).map(d => ({
    ...d,
    capacity: capacityMap[d.name] || null,
    utilizationPct: capacityMap[d.name] ? (d.requests / capacityMap[d.name]) * 100 : null,
    avgDelivery: d.deliveryTimes.length ? d.deliveryTimes.reduce((a, b) => a + b, 0) / d.deliveryTimes.length : null
  })).sort((a, b) => a.name.localeCompare(b.name) || a.quarter.localeCompare(b.quarter));
}

export function computeWorkloadByQuarter(requests) {
  const map = {};
  requests.forEach(r => {
    const q = r.submittedDate ? fmt.quarter(r.submittedDate) : 'Unknown';
    if (!map[q]) map[q] = { label: q, submitted: 0, completed: 0, open: 0 };
    map[q].submitted++;
    if (r.status === 'Completed') map[q].completed++;
    else map[q].open++;
  });
  return Object.values(map).sort((a, b) => {
    const pa = a.label.split(' '), pb = b.label.split(' ');
    return pa[1] - pb[1] || pa[0].localeCompare(pb[0]);
  });
}

// ── Data quality checks ───────────────────────────────────────────────────────

export function detectDataQualityIssues(requests) {
  const issues = [];

  // Duplicate campaign IDs
  const campIdMap = {};
  requests.forEach(r => {
    if (!r.campaignId) return;
    campIdMap[r.campaignId] = campIdMap[r.campaignId] || [];
    campIdMap[r.campaignId].push(r.requestId);
  });
  Object.entries(campIdMap).forEach(([cid, rids]) => {
    if (rids.length > 1) {
      issues.push({ severity: 'warning', type: 'Duplicate Campaign ID', message: `Campaign ID "${cid}" is used by ${rids.length} requests: ${rids.join(', ')}`, affectedIds: rids });
    }
  });

  requests.forEach(r => {
    // Completed without a link
    if (r.status === 'Completed' && !r.datSupportedNeededLink) {
      issues.push({ severity: 'warning', type: 'Missing Asset Link', message: `Request ${r.requestId} is "Completed" but has no DAT Supported Needed link.`, affectedIds: [r.requestId] });
    }
    // Completed without completion date
    if (r.status === 'Completed' && !r.completedDate) {
      issues.push({ severity: 'info', type: 'Missing Completion Date', message: `Request ${r.requestId} is "Completed" but has no Completed Date.`, affectedIds: [r.requestId] });
    }
    // Blank industry
    if (!r.industry) {
      issues.push({ severity: 'info', type: 'Missing Industry', message: `Request ${r.requestId} has no Industry value.`, affectedIds: [r.requestId] });
    }
    // Blank LoB
    if (!r.lob) {
      issues.push({ severity: 'info', type: 'Missing LoB', message: `Request ${r.requestId} has no Line of Business value.`, affectedIds: [r.requestId] });
    }
    // Missing asset type
    if (!r.assetType) {
      issues.push({ severity: 'warning', type: 'Missing Asset Type', message: `Request ${r.requestId} has no Asset Type specified.`, affectedIds: [r.requestId] });
    }
    // Inconsistent asset type names would be caught in csvParser normalization
  });

  return issues;
}

export function summarizeIssues(issues) {
  const byType = {};
  issues.forEach(i => {
    byType[i.type] = byType[i.type] || { type: i.type, severity: i.severity, count: 0 };
    byType[i.type].count++;
  });
  return Object.values(byType).sort((a, b) => {
    const order = { error: 0, warning: 1, info: 2 };
    return (order[a.severity] || 3) - (order[b.severity] || 3);
  });
}
