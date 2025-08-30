// src/routes/analytics.js - Analytics dashboard for lead insights
import express from 'express';
import { leadDb } from '../models/database.js';
import { log } from '../utils/logger.js';

const router = express.Router();

// Dashboard endpoint - gives you powerful lead insights
router.get('/dashboard', async (req, res) => {
  try {
    const stats = leadDb.getDashboardStats();
    const followups = leadDb.getLeadsNeedingFollowup();
    const funnel = leadDb.getConversionFunnel();
    
    // Return HTML dashboard instead of JSON
    const dashboardHtml = generateAdvancedAnalyticsDashboard({
      ...stats,
      followupNeeded: followups,
      conversionFunnel: funnel,
      generatedAt: new Date().toISOString()
    });
    
    res.send(dashboardHtml);
  } catch (error) {
    log.error('Dashboard analytics failed', { error: error.message });
    res.status(500).json({ ok: false, error: 'Failed to load analytics' });
  }
});

// API endpoint for JSON data
router.get('/api/data', async (req, res) => {
  try {
    const stats = leadDb.getDashboardStats();
    const followups = leadDb.getLeadsNeedingFollowup();
    const funnel = leadDb.getConversionFunnel();
    
    res.json({
      ok: true,
      data: {
        ...stats,
        followupNeeded: followups,
        conversionFunnel: funnel,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    log.error('Dashboard analytics failed', { error: error.message });
    res.status(500).json({ ok: false, error: 'Failed to load analytics' });
  }
});

function getScoreClass(score) {
  if (score >= 90) return 'score-high';
  if (score >= 70) return 'score-medium';
  return 'score-low';
}

function generateAdvancedAnalyticsDashboard(data) {
  const { overview, topSources, recentHighValue, dailyTrends, followupNeeded, conversionFunnel } = data;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Advanced Analytics Dashboard | Jacobs Counsel</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/date-fns@2.29.3/index.min.js"></script>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .dashboard { 
            max-width: 1400px; 
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            color: white;
            margin-bottom: 30px;
        }
        
        .header h1 {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 10px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        .header p {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: rgba(255,255,255,0.95);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            transition: transform 0.3s ease;
        }
        
        .stat-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 40px rgba(0,0,0,0.15);
        }
        
        .stat-value {
            font-size: 2.5rem;
            font-weight: 800;
            color: #2563eb;
            margin-bottom: 8px;
        }
        
        .stat-label {
            font-size: 0.9rem;
            color: #64748b;
            text-transform: uppercase;
            font-weight: 600;
            letter-spacing: 0.05em;
        }
        
        .charts-section {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }
        
        .chart-container {
            background: rgba(255,255,255,0.95);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        }
        
        .chart-title {
            font-size: 1.2rem;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .leads-table {
            background: rgba(255,255,255,0.95);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            overflow-x: auto;
        }
        
        .table-title {
            font-size: 1.2rem;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 20px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
        }
        
        th, td {
            text-align: left;
            padding: 12px;
            border-bottom: 1px solid #e2e8f0;
        }
        
        th {
            background: #f8fafc;
            font-weight: 600;
            color: #475569;
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        
        tr:hover {
            background: #f1f5f9;
        }
        
        .priority-high { color: #dc2626; font-weight: 600; }
        .priority-medium { color: #d97706; font-weight: 600; }
        .priority-low { color: #16a34a; font-weight: 600; }
        
        .lead-score {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: 600;
        }
        
        .score-high { background: #dcfce7; color: #166534; }
        .score-medium { background: #fef3c7; color: #92400e; }
        .score-low { background: #fee2e2; color: #991b1b; }
        
        .refresh-btn {
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: #2563eb;
            color: white;
            border: none;
            padding: 14px 20px;
            border-radius: 50px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 20px rgba(37, 99, 235, 0.3);
            transition: all 0.3s ease;
        }
        
        .refresh-btn:hover {
            background: #1d4ed8;
            transform: translateY(-2px);
            box-shadow: 0 6px 25px rgba(37, 99, 235, 0.4);
        }
        
        .loading {
            opacity: 0.6;
            pointer-events: none;
        }
        
        /* New Interactive Controls */
        .controls-section {
            background: rgba(255,255,255,0.95);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        }
        
        .search-filters {
            display: flex;
            gap: 15px;
            align-items: center;
            flex-wrap: wrap;
        }
        
        .search-input, .filter-select {
            padding: 10px 15px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            font-size: 14px;
            background: white;
            transition: border-color 0.3s;
        }
        
        .search-input:focus, .filter-select:focus {
            outline: none;
            border-color: #2563eb;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
        
        .search-input {
            flex: 1;
            min-width: 250px;
        }
        
        .clear-filters-btn {
            background: #64748b;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
            transition: background 0.3s;
        }
        
        .clear-filters-btn:hover {
            background: #475569;
        }
        
        /* Enhanced Table Styles */
        .table-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .table-actions {
            display: flex;
            gap: 10px;
        }
        
        .export-btn, .refresh-table-btn {
            background: #2563eb;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
            transition: background 0.3s;
        }
        
        .export-btn:hover, .refresh-table-btn:hover {
            background: #1d4ed8;
        }
        
        .lead-name {
            display: flex;
            flex-direction: column;
        }
        
        .lead-id {
            color: #64748b;
            font-size: 11px;
        }
        
        .email-link, .phone-link {
            color: #2563eb;
            text-decoration: none;
            transition: color 0.3s;
        }
        
        .email-link:hover, .phone-link:hover {
            color: #1d4ed8;
            text-decoration: underline;
        }
        
        .type-badge {
            background: #f1f5f9;
            color: #475569;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 500;
            text-transform: capitalize;
        }
        
        .date-info {
            display: flex;
            flex-direction: column;
            font-size: 13px;
        }
        
        .date-info small {
            color: #64748b;
            font-size: 11px;
        }
        
        /* Action Buttons */
        .action-buttons {
            display: flex;
            gap: 4px;
        }
        
        .action-btn {
            width: 32px;
            height: 32px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .book-btn { background: #16a34a; color: white; }
        .book-btn:hover { background: #15803d; transform: scale(1.1); }
        
        .email-btn { background: #2563eb; color: white; }
        .email-btn:hover { background: #1d4ed8; transform: scale(1.1); }
        
        .call-btn { background: #dc2626; color: white; }
        .call-btn:hover { background: #b91c1c; transform: scale(1.1); }
        
        .note-btn { background: #d97706; color: white; }
        .note-btn:hover { background: #b45309; transform: scale(1.1); }
        
        .menu-btn { background: #64748b; color: white; }
        .menu-btn:hover { background: #475569; transform: scale(1.1); }
        
        /* Table Footer */
        .table-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
        }
        
        .bulk-actions {
            display: flex;
            gap: 15px;
            align-items: center;
        }
        
        .selected-count {
            font-weight: 600;
            color: #2563eb;
        }
        
        .bulk-btn {
            background: #7c3aed;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
            transition: background 0.3s;
        }
        
        .bulk-btn:hover {
            background: #6d28d9;
        }
        
        .pagination {
            display: flex;
            gap: 10px;
            align-items: center;
        }
        
        .page-btn {
            background: #f1f5f9;
            color: #475569;
            border: none;
            padding: 8px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            transition: background 0.3s;
        }
        
        .page-btn:hover {
            background: #e2e8f0;
        }
        
        .page-info {
            font-size: 13px;
            color: #64748b;
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
            .charts-section {
                grid-template-columns: 1fr;
            }
            .stats-grid {
                grid-template-columns: 1fr;
            }
            .header h1 {
                font-size: 2rem;
            }
            .search-filters {
                flex-direction: column;
                align-items: stretch;
            }
            .search-input {
                min-width: auto;
            }
            .table-header {
                flex-direction: column;
                gap: 10px;
                align-items: stretch;
            }
            .table-footer {
                flex-direction: column;
                gap: 15px;
                align-items: stretch;
            }
            .action-buttons {
                flex-wrap: wrap;
            }
        }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="header">
            <h1>📊 Advanced Analytics Dashboard</h1>
            <p>Comprehensive insights for Jacobs Counsel Law Firm</p>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${overview.total_leads || 0}</div>
                <div class="stat-label">Total Leads</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${overview.high_value_leads || 0}</div>
                <div class="stat-label">High Value Leads</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${overview.avg_lead_score?.toFixed(1) || 0}</div>
                <div class="stat-label">Average Lead Score</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${overview.leads_last_7_days || 0}</div>
                <div class="stat-label">Last 7 Days</div>
            </div>
        </div>
        
        <div class="charts-section">
            <div class="chart-container">
                <div class="chart-title">📈 Lead Trends Over Time</div>
                <canvas id="trendsChart" width="400" height="200"></canvas>
            </div>
            
            <div class="chart-container">
                <div class="chart-title">🎯 Lead Sources Distribution</div>
                <canvas id="sourcesChart" width="300" height="300"></canvas>
            </div>
        </div>
        
        <div class="controls-section">
            <div class="search-filters">
                <input type="text" id="searchLeads" placeholder="🔍 Search leads..." class="search-input">
                <select id="filterType" class="filter-select">
                    <option value="">All Types</option>
                    <option value="estate-intake">Estate Planning</option>
                    <option value="brand-protection">Brand Protection</option>
                    <option value="business-formation">Business Formation</option>
                    <option value="legal-strategy-builder">Strategy Builder</option>
                </select>
                <select id="filterScore" class="filter-select">
                    <option value="">All Scores</option>
                    <option value="high">High Score (90+)</option>
                    <option value="medium">Medium Score (70-89)</option>
                    <option value="low">Low Score (<70)</option>
                </select>
                <button class="clear-filters-btn" onclick="clearFilters()">Clear Filters</button>
            </div>
        </div>
        
        <div class="leads-table">
            <div class="table-header">
                <div class="table-title">🔥 High Priority Leads Requiring Follow-up</div>
                <div class="table-actions">
                    <button class="export-btn" onclick="exportLeads()">📊 Export CSV</button>
                    <button class="refresh-table-btn" onclick="refreshTable()">🔄 Refresh</button>
                </div>
            </div>
            <table id="leadsTable">
                <thead>
                    <tr>
                        <th>
                            <input type="checkbox" id="selectAll" onchange="toggleSelectAll()">
                        </th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Type</th>
                        <th>Score</th>
                        <th>Priority</th>
                        <th>Created</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="leadsTableBody">
                    ${followupNeeded.slice(0, 20).map(lead => `
                        <tr class="lead-row" data-type="${lead.submission_type}" data-score="${lead.lead_score}">
                            <td>
                                <input type="checkbox" class="lead-checkbox" value="${lead.id}">
                            </td>
                            <td>
                                <div class="lead-name">
                                    <strong>${lead.first_name || 'N/A'} ${lead.last_name || ''}</strong>
                                    <small class="lead-id">#${lead.id}</small>
                                </div>
                            </td>
                            <td>
                                <a href="mailto:${lead.email}" class="email-link">${lead.email}</a>
                            </td>
                            <td>
                                ${lead.phone ? `<a href="tel:${lead.phone}" class="phone-link">${lead.phone}</a>` : 'N/A'}
                            </td>
                            <td>
                                <span class="type-badge">${lead.submission_type.replace('-', ' ')}</span>
                            </td>
                            <td>
                                <span class="lead-score ${getScoreClass(lead.lead_score)}">${lead.lead_score}</span>
                            </td>
                            <td>
                                <span class="priority-${lead.priority.toLowerCase()}">${lead.priority}</span>
                            </td>
                            <td>
                                <div class="date-info">
                                    <div>${new Date(lead.created_at).toLocaleDateString()}</div>
                                    <small>${new Date(lead.created_at).toLocaleTimeString()}</small>
                                </div>
                            </td>
                            <td>
                                <div class="action-buttons">
                                    <button class="action-btn book-btn" onclick="bookConsultation('${lead.calendly_link}')">📅</button>
                                    <button class="action-btn email-btn" onclick="sendEmail('${lead.email}')">📧</button>
                                    <button class="action-btn call-btn" onclick="callLead('${lead.phone}')">📞</button>
                                    <button class="action-btn note-btn" onclick="addNote(${lead.id})">📝</button>
                                    <button class="action-btn menu-btn" onclick="showLeadMenu(${lead.id})">⋯</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="table-footer">
                <div class="bulk-actions" id="bulkActions" style="display: none;">
                    <span class="selected-count">0 leads selected</span>
                    <button class="bulk-btn" onclick="bulkEmail()">📧 Email Selected</button>
                    <button class="bulk-btn" onclick="bulkExport()">📊 Export Selected</button>
                    <button class="bulk-btn" onclick="bulkMarkContacted()">✅ Mark Contacted</button>
                </div>
                <div class="pagination">
                    <button class="page-btn" onclick="previousPage()">← Previous</button>
                    <span class="page-info">Page 1 of 3</span>
                    <button class="page-btn" onclick="nextPage()">Next →</button>
                </div>
            </div>
        </div>
        
        <button class="refresh-btn" onclick="refreshData()">🔄 Refresh Data</button>
    </div>
    
    <script>
        function getScoreClass(score) {
            if (score >= 90) return 'score-high';
            if (score >= 70) return 'score-medium';
            return 'score-low';
        }
        
        // Trends Chart
        const trendsCtx = document.getElementById('trendsChart').getContext('2d');
        const trendsData = ${JSON.stringify(dailyTrends || [])};
        
        new Chart(trendsCtx, {
            type: 'line',
            data: {
                labels: trendsData.map(d => d.date),
                datasets: [{
                    label: 'Total Leads',
                    data: trendsData.map(d => d.leads),
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'High Value Leads',
                    data: trendsData.map(d => d.high_value),
                    borderColor: '#dc2626',
                    backgroundColor: 'rgba(220, 38, 38, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    }
                }
            }
        });
        
        // Sources Chart
        const sourcesCtx = document.getElementById('sourcesChart').getContext('2d');
        const sourcesData = ${JSON.stringify(topSources || [])};
        
        new Chart(sourcesCtx, {
            type: 'doughnut',
            data: {
                labels: sourcesData.map(s => s.submission_type.replace('-', ' ')),
                datasets: [{
                    data: sourcesData.map(s => s.count),
                    backgroundColor: [
                        '#2563eb', '#dc2626', '#d97706', '#16a34a', '#7c3aed'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                        }
                    }
                }
            }
        });
        
        // Lead Management Functions
        function bookConsultation(calendlyLink) {
            if (calendlyLink && calendlyLink !== '#') {
                window.open(calendlyLink, '_blank');
            } else {
                alert('No Calendly link available for this lead.');
            }
        }
        
        function sendEmail(email) {
            window.open(\`mailto:\${email}?subject=Follow-up from Jacobs Counsel&body=Hi there,\\n\\nI wanted to follow up on your recent inquiry about our legal services.\\n\\nBest regards,\\nDrew Jacobs, Esq.\\nJacobs Counsel LLC\`, '_blank');
        }
        
        function callLead(phone) {
            if (phone && phone !== 'N/A') {
                window.open(\`tel:\${phone}\`, '_self');
            } else {
                alert('No phone number available for this lead.');
            }
        }
        
        function addNote(leadId) {
            const note = prompt('Add a note about this lead:');
            if (note) {
                // Here you would normally save to database
                alert(\`Note added for lead #\${leadId}: \${note}\`);
                // TODO: Implement actual note saving
            }
        }
        
        function showLeadMenu(leadId) {
            const actions = [
                '👤 View Full Profile',
                '📧 Send Custom Email',
                '📝 Add Detailed Note',
                '📅 Schedule Follow-up',
                '⏸️ Pause Automation',
                '🚫 Mark as Unqualified',
                '✅ Mark as Contacted'
            ];
            
            const choice = prompt(\`Choose an action for lead #\${leadId}:\\n\\n\${actions.map((a, i) => \`\${i + 1}. \${a}\`).join('\\n')}\`);
            
            if (choice) {
                const actionIndex = parseInt(choice) - 1;
                if (actionIndex >= 0 && actionIndex < actions.length) {
                    alert(\`Action: \${actions[actionIndex]} - Feature coming soon!\`);
                }
            }
        }
        
        // Search and Filter Functions
        function setupSearchAndFilters() {
            const searchInput = document.getElementById('searchLeads');
            const typeFilter = document.getElementById('filterType');
            const scoreFilter = document.getElementById('filterScore');
            
            function filterLeads() {
                const searchTerm = searchInput.value.toLowerCase();
                const selectedType = typeFilter.value;
                const selectedScore = scoreFilter.value;
                const rows = document.querySelectorAll('.lead-row');
                
                rows.forEach(row => {
                    const name = row.querySelector('.lead-name strong').textContent.toLowerCase();
                    const email = row.querySelector('.email-link').textContent.toLowerCase();
                    const type = row.dataset.type;
                    const score = parseInt(row.dataset.score);
                    
                    let showRow = true;
                    
                    // Search filter
                    if (searchTerm && !name.includes(searchTerm) && !email.includes(searchTerm)) {
                        showRow = false;
                    }
                    
                    // Type filter
                    if (selectedType && type !== selectedType) {
                        showRow = false;
                    }
                    
                    // Score filter
                    if (selectedScore) {
                        if (selectedScore === 'high' && score < 90) showRow = false;
                        if (selectedScore === 'medium' && (score < 70 || score >= 90)) showRow = false;
                        if (selectedScore === 'low' && score >= 70) showRow = false;
                    }
                    
                    row.style.display = showRow ? '' : 'none';
                });
            }
            
            searchInput.addEventListener('input', filterLeads);
            typeFilter.addEventListener('change', filterLeads);
            scoreFilter.addEventListener('change', filterLeads);
        }
        
        function clearFilters() {
            document.getElementById('searchLeads').value = '';
            document.getElementById('filterType').value = '';
            document.getElementById('filterScore').value = '';
            
            // Show all rows
            document.querySelectorAll('.lead-row').forEach(row => {
                row.style.display = '';
            });
        }
        
        // Bulk Actions
        function toggleSelectAll() {
            const selectAll = document.getElementById('selectAll');
            const checkboxes = document.querySelectorAll('.lead-checkbox');
            const bulkActions = document.getElementById('bulkActions');
            
            checkboxes.forEach(cb => cb.checked = selectAll.checked);
            updateBulkActionsVisibility();
        }
        
        function updateBulkActionsVisibility() {
            const checkedBoxes = document.querySelectorAll('.lead-checkbox:checked');
            const bulkActions = document.getElementById('bulkActions');
            const selectedCount = document.querySelector('.selected-count');
            
            if (checkedBoxes.length > 0) {
                bulkActions.style.display = 'flex';
                selectedCount.textContent = \`\${checkedBoxes.length} lead\${checkedBoxes.length > 1 ? 's' : ''} selected\`;
            } else {
                bulkActions.style.display = 'none';
            }
        }
        
        function bulkEmail() {
            const checkedBoxes = document.querySelectorAll('.lead-checkbox:checked');
            const emails = Array.from(checkedBoxes).map(cb => {
                const row = cb.closest('.lead-row');
                return row.querySelector('.email-link').textContent;
            });
            
            if (emails.length > 0) {
                window.open(\`mailto:\${emails.join(';')}?subject=Follow-up from Jacobs Counsel&body=Hi there,\\n\\nI wanted to follow up on your recent inquiry about our legal services.\\n\\nBest regards,\\nDrew Jacobs, Esq.\\nJacobs Counsel LLC\`, '_blank');
            }
        }
        
        function bulkExport() {
            const checkedBoxes = document.querySelectorAll('.lead-checkbox:checked');
            if (checkedBoxes.length === 0) {
                alert('Please select leads to export.');
                return;
            }
            
            const data = Array.from(checkedBoxes).map(cb => {
                const row = cb.closest('.lead-row');
                return {
                    name: row.querySelector('.lead-name strong').textContent,
                    email: row.querySelector('.email-link').textContent,
                    phone: row.querySelector('.phone-link')?.textContent || 'N/A',
                    type: row.querySelector('.type-badge').textContent,
                    score: row.querySelector('.lead-score').textContent,
                    priority: row.querySelector('[class*="priority-"]').textContent
                };
            });
            
            exportToCSV(data, 'selected_leads.csv');
        }
        
        function bulkMarkContacted() {
            const checkedBoxes = document.querySelectorAll('.lead-checkbox:checked');
            if (checkedBoxes.length === 0) {
                alert('Please select leads to mark as contacted.');
                return;
            }
            
            if (confirm(\`Mark \${checkedBoxes.length} lead(s) as contacted?\`)) {
                // Here you would normally update the database
                alert(\`\${checkedBoxes.length} lead(s) marked as contacted. (Feature coming soon!)\`);
            }
        }
        
        // Export Functions
        function exportLeads() {
            const rows = document.querySelectorAll('.lead-row');
            const data = Array.from(rows).map(row => ({
                name: row.querySelector('.lead-name strong').textContent,
                email: row.querySelector('.email-link').textContent,
                phone: row.querySelector('.phone-link')?.textContent || 'N/A',
                type: row.querySelector('.type-badge').textContent,
                score: row.querySelector('.lead-score').textContent,
                priority: row.querySelector('[class*="priority-"]').textContent,
                created: row.querySelector('.date-info div').textContent
            }));
            
            exportToCSV(data, 'all_leads.csv');
        }
        
        function exportToCSV(data, filename) {
            const csvContent = [
                Object.keys(data[0]).join(','),
                ...data.map(row => Object.values(row).map(val => \`"\${val}"\`).join(','))
            ].join('\\n');
            
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            window.URL.revokeObjectURL(url);
        }
        
        // Pagination (placeholder)
        function previousPage() {
            alert('Previous page functionality coming soon!');
        }
        
        function nextPage() {
            alert('Next page functionality coming soon!');
        }
        
        // Refresh Functions
        function refreshTable() {
            location.reload();
        }
        
        function refreshData() {
            const btn = document.querySelector('.refresh-btn');
            btn.innerHTML = '⏳ Refreshing...';
            btn.classList.add('loading');
            
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
        
        // Initialize everything when page loads
        document.addEventListener('DOMContentLoaded', function() {
            setupSearchAndFilters();
            
            // Add event listeners to checkboxes
            document.querySelectorAll('.lead-checkbox').forEach(cb => {
                cb.addEventListener('change', updateBulkActionsVisibility);
            });
        });
        
        // Auto-refresh every 30 seconds
        setInterval(refreshData, 30000);
    </script>
</body>
</html>`;
}

// Lead intelligence - shows what's working for conversions
router.get('/lead-intelligence', async (req, res) => {
  try {
    const { period = '30' } = req.query;
    
    // What sources convert best?
    const conversionsBySource = leadDb.db.prepare(`
      SELECT 
        l.submission_type,
        COUNT(*) as total_leads,
        AVG(l.lead_score) as avg_score,
        COUNT(CASE WHEN i.interaction_type = 'calendly_booked' THEN 1 END) as bookings,
        ROUND(COUNT(CASE WHEN i.interaction_type = 'calendly_booked' THEN 1 END) * 100.0 / COUNT(*), 1) as booking_rate
      FROM leads l
      LEFT JOIN lead_interactions i ON l.id = i.lead_id
      WHERE l.created_at >= date('now', '-' || ? || ' days')
      GROUP BY l.submission_type
      ORDER BY booking_rate DESC
    `).all(period);

    // What score ranges convert best?
    const conversionsByScore = leadDb.db.prepare(`
      SELECT 
        CASE 
          WHEN l.lead_score >= 70 THEN 'High (70+)'
          WHEN l.lead_score >= 50 THEN 'Medium (50-69)'
          ELSE 'Standard (<50)'
        END as score_range,
        COUNT(*) as total_leads,
        COUNT(CASE WHEN i.interaction_type = 'calendly_booked' THEN 1 END) as bookings,
        ROUND(COUNT(CASE WHEN i.interaction_type = 'calendly_booked' THEN 1 END) * 100.0 / COUNT(*), 1) as booking_rate
      FROM leads l
      LEFT JOIN lead_interactions i ON l.id = i.lead_id
      WHERE l.created_at >= date('now', '-' || ? || ' days')
      GROUP BY score_range
      ORDER BY booking_rate DESC
    `).all(period);

    // Best follow-up timing
    const followupTiming = leadDb.db.prepare(`
      SELECT 
        CASE 
          WHEN julianday(i.created_at) - julianday(l.created_at) <= 1 THEN '< 24 hours'
          WHEN julianday(i.created_at) - julianday(l.created_at) <= 3 THEN '1-3 days' 
          WHEN julianday(i.created_at) - julianday(l.created_at) <= 7 THEN '3-7 days'
          ELSE '> 7 days'
        END as followup_timing,
        COUNT(*) as bookings
      FROM leads l
      JOIN lead_interactions i ON l.id = i.lead_id
      WHERE i.interaction_type = 'calendly_booked'
        AND l.created_at >= date('now', '-' || ? || ' days')
      GROUP BY followup_timing
      ORDER BY bookings DESC
    `).all(period);

    res.json({
      ok: true,
      data: {
        conversionsBySource,
        conversionsByScore, 
        followupTiming,
        insights: generateInsights(conversionsBySource, conversionsByScore),
        period: `${period} days`
      }
    });
  } catch (error) {
    log.error('Lead intelligence failed', { error: error.message });
    res.status(500).json({ ok: false, error: 'Failed to generate intelligence' });
  }
});

// Follow-up recommendations - actionable insights
router.get('/followup-recommendations', async (req, res) => {
  try {
    const highValueNeeds = leadDb.getLeadsNeedingFollowup();
    
    // Prioritize by recency and score
    const prioritized = highValueNeeds
      .map(lead => ({
        ...lead,
        hoursSinceSubmission: Math.floor((Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60)),
        urgencyScore: lead.lead_score + (48 - Math.min(48, Math.floor((Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60))))
      }))
      .sort((a, b) => b.urgencyScore - a.urgencyScore)
      .slice(0, 10);

    res.json({
      ok: true,
      data: {
        highPriorityFollowups: prioritized,
        recommendations: generateFollowupRecommendations(prioritized),
        summary: {
          totalNeedingFollowup: highValueNeeds.length,
          averageScore: Math.round(highValueNeeds.reduce((sum, l) => sum + l.lead_score, 0) / highValueNeeds.length) || 0
        }
      }
    });
  } catch (error) {
    log.error('Followup recommendations failed', { error: error.message });
    res.status(500).json({ ok: false, error: 'Failed to generate recommendations' });
  }
});

// Helper functions
function generateInsights(bySource, byScore) {
  const insights = [];
  
  // Best converting source
  const topSource = bySource[0];
  if (topSource && topSource.booking_rate > 0) {
    insights.push(`${topSource.submission_type} leads convert at ${topSource.booking_rate}% - your best source!`);
  }
  
  // Score insight
  const highScoreConversion = byScore.find(s => s.score_range.includes('High'));
  if (highScoreConversion && highScoreConversion.booking_rate > 20) {
    insights.push(`High-score leads convert ${highScoreConversion.booking_rate}% of the time - prioritize immediate follow-up`);
  }
  
  return insights;
}

function generateFollowupRecommendations(leads) {
  return leads.map(lead => {
    let action = 'Send personal email';
    let urgency = 'standard';
    
    if (lead.hoursSinceSubmission < 2) {
      action = 'Call immediately - strike while hot!';
      urgency = 'immediate';
    } else if (lead.hoursSinceSubmission < 24) {
      action = 'Send personal email today';
      urgency = 'high';
    } else if (lead.hoursSinceSubmission < 48) {
      action = 'Personal email + calendar link';
      urgency = 'medium';
    }
    
    return {
      lead,
      action,
      urgency,
      reason: `Score ${lead.lead_score}/100, ${lead.hoursSinceSubmission}h since submission`
    };
  });
}

export default router;