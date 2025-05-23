/**
 * Trading Agents Dashboard
 *
 * This script handles the dashboard functionality, including:
 * - Fetching metrics from the API
 * - Updating the UI with the latest metrics
 * - Managing charts and visualizations
 * - Handling alerts
 */

// API endpoints
const API_BASE_URL = '/api';
const METRICS_ENDPOINT = `${API_BASE_URL}/monitoring/metrics`;
const ALERTS_ENDPOINT = `${API_BASE_URL}/monitoring/alerts`;
const AGENTS_ENDPOINT = `${API_BASE_URL}/agents`;
const BACKTEST_ENDPOINT = `${API_BASE_URL}/backtesting/results`;

// Chart objects
let systemChart = null;
let cacheHitChart = null;
let cacheSizeChart = null;

// Data storage
let metricsHistory = {
    system: [],
    cache: [],
    http: [],
    execution: []
};

let alertsHistory = [];
let agentData = {};
let backtestData = {};

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Initialize charts
    initializeCharts();

    // Initialize advanced charts
    if (window.advancedCharts) {
        window.advancedCharts.initAdvancedCharts();
    }

    // Load initial data
    refreshData();

    // Fetch agent data
    fetchAgentData();

    // Fetch backtest data
    fetchBacktestData();

    // Set up refresh button
    document.getElementById('refresh-btn').addEventListener('click', refreshData);

    // Set up auto-refresh intervals
    setInterval(refreshData, 30000); // Refresh metrics every 30 seconds
    setInterval(fetchAgentData, 60000); // Refresh agent data every 60 seconds

    // Set up tab switching
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(event) {
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            // Hide all tab panes
            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.remove('show', 'active');
            });

            // Show the selected tab pane
            const target = this.getAttribute('href').substring(1);
            document.getElementById(target).classList.add('show', 'active');

            event.preventDefault();
        });
    });
});

/**
 * Initialize all charts
 */
function initializeCharts() {
    // System resource usage chart
    const systemCtx = document.getElementById('system-chart').getContext('2d');
    systemChart = new Chart(systemCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'CPU Usage',
                    data: [],
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    tension: 0.4
                },
                {
                    label: 'Memory Usage',
                    data: [],
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    tension: 0.4
                },
                {
                    label: 'Disk Usage',
                    data: [],
                    borderColor: 'rgba(255, 206, 86, 1)',
                    backgroundColor: 'rgba(255, 206, 86, 0.2)',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Usage (%)'
                    }
                }
            }
        }
    });

    // Cache hit rate chart
    const cacheHitCtx = document.getElementById('cache-hit-chart').getContext('2d');
    cacheHitChart = new Chart(cacheHitCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Memory Hit Rate',
                    data: [],
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.4
                },
                {
                    label: 'Disk Hit Rate',
                    data: [],
                    borderColor: 'rgba(153, 102, 255, 1)',
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    tension: 0.4
                },
                {
                    label: 'Distributed Hit Rate',
                    data: [],
                    borderColor: 'rgba(255, 159, 64, 1)',
                    backgroundColor: 'rgba(255, 159, 64, 0.2)',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Hit Rate (%)'
                    }
                }
            }
        }
    });

    // Cache size chart
    const cacheSizeCtx = document.getElementById('cache-size-chart').getContext('2d');
    cacheSizeChart = new Chart(cacheSizeCtx, {
        type: 'bar',
        data: {
            labels: ['Memory', 'Disk', 'Distributed'],
            datasets: [
                {
                    label: 'Current Size',
                    data: [0, 0, 0],
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(153, 102, 255, 0.6)',
                        'rgba(255, 159, 64, 0.6)'
                    ],
                    borderColor: [
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)'
                    ],
                    borderWidth: 1
                },
                {
                    label: 'Maximum Size',
                    data: [0, 0, 0],
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.2)',
                        'rgba(153, 102, 255, 0.2)',
                        'rgba(255, 159, 64, 0.2)'
                    ],
                    borderColor: [
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)'
                    ],
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Size (bytes)'
                    }
                }
            }
        }
    });
}

/**
 * Refresh all dashboard data
 */
async function refreshData() {
    try {
        // Fetch metrics
        const metricsResponse = await fetch(METRICS_ENDPOINT);
        const metricsData = await metricsResponse.json();

        // Fetch alerts
        const alertsResponse = await fetch(ALERTS_ENDPOINT);
        const alertsData = await alertsResponse.json();

        // Update data storage
        updateMetricsHistory(metricsData.metrics);
        updateAlertsHistory(alertsData.alerts);

        // Update UI
        updateOverviewMetrics(metricsData.metrics);
        updateCacheMetrics(metricsData.metrics);
        updateAlerts(alertsData.alerts);

        // Update charts
        updateCharts();

        // Update advanced charts
        if (window.advancedCharts) {
            window.advancedCharts.updateCachePerformanceChart(metricsHistory.cache);
            window.advancedCharts.updateRealTimeMetricsChart(metricsHistory.http);
        }

        // Update last updated time
        document.getElementById('last-updated').textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
    } catch (error) {
        console.error('Error refreshing data:', error);
    }
}

/**
 * Fetch agent data
 */
async function fetchAgentData() {
    try {
        // Fetch agent data
        const response = await fetch(AGENTS_ENDPOINT);
        const data = await response.json();

        // Process agent data
        processAgentData(data.agents);

        // Update agent status table
        updateAgentStatusTable(data.agents);

        // Update agent performance chart
        if (window.advancedCharts) {
            window.advancedCharts.updateAgentPerformanceChart(agentData);
        }

        console.log('Agent data refreshed');
    } catch (error) {
        console.error('Error fetching agent data:', error);
    }
}

/**
 * Process agent data for visualization
 */
function processAgentData(agents) {
    if (!agents) return;

    agents.forEach(agent => {
        const agentId = agent.agent_id;

        // Initialize agent data if not exists
        if (!agentData[agentId]) {
            agentData[agentId] = {
                timestamps: [],
                performance: [],
                metrics: []
            };
        }

        // Add timestamp
        const timestamp = new Date().toLocaleTimeString();
        agentData[agentId].timestamps.push(timestamp);

        // Calculate performance (example: success rate)
        const totalCycles = agent.metrics.cycles_completed + agent.metrics.cycles_failed;
        const successRate = totalCycles > 0 ? (agent.metrics.cycles_completed / totalCycles) * 100 : 0;
        agentData[agentId].performance.push(successRate);

        // Store metrics
        agentData[agentId].metrics.push(agent.metrics);

        // Limit data points (keep last 20)
        if (agentData[agentId].timestamps.length > 20) {
            agentData[agentId].timestamps.shift();
            agentData[agentId].performance.shift();
            agentData[agentId].metrics.shift();
        }
    });
}

/**
 * Update agent status table
 */
function updateAgentStatusTable(agents) {
    if (!agents) return;

    const tableBody = document.getElementById('agent-status-table').querySelector('tbody');
    if (!tableBody) return;

    // Clear table
    tableBody.innerHTML = '';

    // Add rows for each agent
    agents.forEach(agent => {
        const row = document.createElement('tr');

        // Calculate success rate
        const totalCycles = agent.metrics.cycles_completed + agent.metrics.cycles_failed;
        const successRate = totalCycles > 0 ? (agent.metrics.cycles_completed / totalCycles) * 100 : 0;

        // Format last run time
        const lastRun = agent.metrics.last_cycle_completed ?
            new Date(agent.metrics.last_cycle_completed).toLocaleString() : 'Never';

        // Create row content
        row.innerHTML = `
            <td>${agent.agent_id}</td>
            <td>${agent.agent_type}</td>
            <td><span class="badge ${agent.status === 'running' ? 'bg-success' : 'bg-secondary'}">${agent.status}</span></td>
            <td>${lastRun}</td>
            <td>${successRate.toFixed(1)}%</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="runAgentCycle('${agent.agent_id}')">Run</button>
                <button class="btn btn-sm btn-secondary" onclick="viewAgentDetails('${agent.agent_id}')">Details</button>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

/**
 * Fetch backtest data
 */
async function fetchBacktestData() {
    try {
        // Fetch backtest data
        const response = await fetch(BACKTEST_ENDPOINT);
        const data = await response.json();

        // Store backtest data
        backtestData = data.results || {};

        // Update strategy selector
        updateStrategySelector();

        console.log('Backtest data refreshed');
    } catch (error) {
        console.error('Error fetching backtest data:', error);
    }
}

/**
 * Update strategy selector
 */
function updateStrategySelector() {
    const selector = document.getElementById('strategy-selector');
    if (!selector) return;

    // Clear existing options (except the first one)
    while (selector.options.length > 1) {
        selector.remove(1);
    }

    // Add options for each strategy
    Object.keys(backtestData).forEach(strategy => {
        const option = document.createElement('option');
        option.value = strategy;
        option.textContent = strategy;
        selector.appendChild(option);
    });

    // Set up change event
    selector.onchange = function() {
        const strategy = this.value;
        if (strategy) {
            displayBacktestResults(strategy);
        }
    };
}

/**
 * Display backtest results for a strategy
 */
function displayBacktestResults(strategy) {
    if (!backtestData[strategy]) return;

    const results = backtestData[strategy];
    const ctx = document.getElementById('strategy-backtest-chart');

    if (!ctx) return;

    // Create chart if it doesn't exist
    if (!window.strategyBacktestChart) {
        window.strategyBacktestChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Equity Curve',
                        data: [],
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderWidth: 2,
                        tension: 0.1
                    },
                    {
                        label: 'Benchmark',
                        data: [],
                        borderColor: 'rgba(54, 162, 235, 1)',
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderWidth: 2,
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    title: {
                        display: true,
                        text: `Backtest Results: ${strategy}`
                    },
                    tooltip: {
                        enabled: true,
                        mode: 'index',
                        intersect: false
                    },
                    zoom: {
                        zoom: {
                            wheel: {
                                enabled: true
                            },
                            pinch: {
                                enabled: true
                            },
                            mode: 'xy'
                        },
                        pan: {
                            enabled: true,
                            mode: 'xy'
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Value ($)'
                        }
                    }
                }
            }
        });
    } else {
        // Update chart title
        window.strategyBacktestChart.options.plugins.title.text = `Backtest Results: ${strategy}`;
    }

    // Update chart data
    window.strategyBacktestChart.data.labels = results.dates || [];
    window.strategyBacktestChart.data.datasets[0].data = results.equity_curve || [];
    window.strategyBacktestChart.data.datasets[1].data = results.benchmark || [];

    // Update chart
    window.strategyBacktestChart.update();

    // Display metrics
    displayBacktestMetrics(strategy, results);
}

/**
 * Display backtest metrics
 */
function displayBacktestMetrics(strategy, results) {
    // Find metrics container
    const container = document.querySelector('.card:has(#strategy-backtest-chart)');
    if (!container) return;

    // Create or update metrics section
    let metricsDiv = container.querySelector('.backtest-metrics');
    if (!metricsDiv) {
        metricsDiv = document.createElement('div');
        metricsDiv.className = 'backtest-metrics mt-3';
        container.querySelector('.card-body').appendChild(metricsDiv);
    }

    // Format metrics
    const metrics = results.metrics || {};
    const formattedMetrics = [
        { label: 'Total Return', value: `${(metrics.total_return * 100).toFixed(2)}%` },
        { label: 'Annual Return', value: `${(metrics.annual_return * 100).toFixed(2)}%` },
        { label: 'Sharpe Ratio', value: metrics.sharpe_ratio?.toFixed(2) || 'N/A' },
        { label: 'Max Drawdown', value: `${(metrics.max_drawdown * 100).toFixed(2)}%` },
        { label: 'Win Rate', value: `${(metrics.win_rate * 100).toFixed(2)}%` },
        { label: 'Profit Factor', value: metrics.profit_factor?.toFixed(2) || 'N/A' }
    ];

    // Create metrics HTML
    metricsDiv.innerHTML = `
        <div class="row">
            ${formattedMetrics.map(metric => `
                <div class="col-md-4 col-sm-6 mb-2">
                    <div class="card">
                        <div class="card-body p-2 text-center">
                            <h6 class="card-title mb-0">${metric.label}</h6>
                            <p class="card-text fs-4 mb-0">${metric.value}</p>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

/**
 * Update metrics history
 */
function updateMetricsHistory(metrics) {
    // Add new metrics to history (limit to 20 entries)
    for (const category in metrics) {
        if (!metricsHistory[category]) {
            metricsHistory[category] = [];
        }

        if (Array.isArray(metrics[category]) && metrics[category].length > 0) {
            metricsHistory[category].push(metrics[category][metrics[category].length - 1]);

            // Limit history size
            if (metricsHistory[category].length > 20) {
                metricsHistory[category].shift();
            }
        }
    }
}

/**
 * Update alerts history
 */
function updateAlertsHistory(alerts) {
    // Add new alerts to history
    for (const alert of alerts) {
        // Check if alert already exists
        const exists = alertsHistory.some(a =>
            a.timestamp === alert.timestamp &&
            a.level === alert.level &&
            a.message === alert.message
        );

        if (!exists) {
            alertsHistory.push(alert);
        }
    }

    // Sort by timestamp (newest first)
    alertsHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Limit history size
    if (alertsHistory.length > 100) {
        alertsHistory = alertsHistory.slice(0, 100);
    }
}

/**
 * Update overview metrics
 */
function updateOverviewMetrics(metrics) {
    // Update system metrics
    if (metrics.system && metrics.system.length > 0) {
        const systemMetrics = metrics.system[metrics.system.length - 1];

        // Update CPU usage
        document.getElementById('cpu-usage').textContent =
            `${systemMetrics.system.cpu_percent.toFixed(1)}%`;

        // Update memory usage
        document.getElementById('memory-usage').textContent =
            `${systemMetrics.system.memory_percent.toFixed(1)}%`;

        // Update disk usage
        document.getElementById('disk-usage').textContent =
            `${systemMetrics.system.disk_percent.toFixed(1)}%`;
    }

    // Update active agents count
    if (metrics.execution && metrics.execution.length > 0) {
        const executionMetrics = metrics.execution[metrics.execution.length - 1];
        document.getElementById('active-agents').textContent =
            executionMetrics.agents_tracked || 0;
    }
}

/**
 * Update cache metrics
 */
function updateCacheMetrics(metrics) {
    // Update cache hit rates
    if (metrics.cache && metrics.cache.length > 0) {
        const cacheMetrics = metrics.cache[metrics.cache.length - 1];

        // Memory hit rate
        const memoryHitRate = (cacheMetrics.memory_hit_rate || 0) * 100;
        document.getElementById('memory-hit-rate').textContent =
            `${memoryHitRate.toFixed(1)}%`;

        // Disk hit rate
        const diskHitRate = (cacheMetrics.disk_hit_rate || 0) * 100;
        document.getElementById('disk-hit-rate').textContent =
            `${diskHitRate.toFixed(1)}%`;

        // Distributed hit rate
        const distributedHitRate = (cacheMetrics.distributed_hit_rate || 0) * 100;
        document.getElementById('distributed-hit-rate').textContent =
            `${distributedHitRate.toFixed(1)}%`;
    }
}

/**
 * Update alerts display
 */
function updateAlerts(alerts) {
    // Update alert count badge
    document.getElementById('alert-count').textContent = alerts.length;

    // Update recent alerts table
    const alertsTable = document.getElementById('recent-alerts-table').getElementsByTagName('tbody')[0];
    alertsTable.innerHTML = '';

    // Add the 5 most recent alerts
    const recentAlerts = alerts.slice(0, 5);
    for (const alert of recentAlerts) {
        const row = alertsTable.insertRow();

        // Format timestamp
        const timestamp = new Date(alert.timestamp).toLocaleTimeString();

        // Add cells
        const timeCell = row.insertCell(0);
        timeCell.textContent = timestamp;

        const levelCell = row.insertCell(1);
        levelCell.textContent = alert.level.toUpperCase();

        // Add color based on level
        switch (alert.level) {
            case 'critical':
                levelCell.classList.add('text-danger', 'fw-bold');
                break;
            case 'error':
                levelCell.classList.add('text-danger');
                break;
            case 'warning':
                levelCell.classList.add('text-warning');
                break;
            case 'info':
                levelCell.classList.add('text-info');
                break;
        }

        const sourceCell = row.insertCell(2);
        sourceCell.textContent = alert.source;

        const messageCell = row.insertCell(3);
        messageCell.textContent = alert.message;
    }
}

/**
 * Update all charts with the latest data
 */
function updateCharts() {
    // Update system chart
    if (metricsHistory.system.length > 0) {
        // Create labels (timestamps)
        const labels = metricsHistory.system.map(metric => {
            return new Date(metric.timestamp).toLocaleTimeString();
        });

        // Update chart data
        systemChart.data.labels = labels;
        systemChart.data.datasets[0].data = metricsHistory.system.map(metric => metric.system.cpu_percent);
        systemChart.data.datasets[1].data = metricsHistory.system.map(metric => metric.system.memory_percent);
        systemChart.data.datasets[2].data = metricsHistory.system.map(metric => metric.system.disk_percent);

        // Update chart
        systemChart.update();
    }
}

/**
 * Run an agent cycle
 */
async function runAgentCycle(agentId) {
    try {
        // Show loading state
        const button = document.querySelector(`button[onclick="runAgentCycle('${agentId}')"]`);
        if (button) {
            button.disabled = true;
            button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Running...';
        }

        // Call API to run agent cycle
        const response = await fetch(`${AGENTS_ENDPOINT}/${agentId}/run`, {
            method: 'POST'
        });

        const result = await response.json();

        // Show result
        if (result.success) {
            showToast('Success', `Agent ${agentId} cycle executed successfully`, 'success');
        } else {
            showToast('Error', `Failed to run agent ${agentId}: ${result.message}`, 'danger');
        }

        // Refresh agent data
        await fetchAgentData();
    } catch (error) {
        console.error(`Error running agent cycle for ${agentId}:`, error);
        showToast('Error', `Failed to run agent ${agentId}: ${error.message}`, 'danger');
    } finally {
        // Reset button state
        const button = document.querySelector(`button[onclick="runAgentCycle('${agentId}')"]`);
        if (button) {
            button.disabled = false;
            button.textContent = 'Run';
        }
    }
}

/**
 * View agent details
 */
function viewAgentDetails(agentId) {
    // Find agent data
    const agent = agentData[agentId];
    if (!agent) {
        showToast('Error', `No data available for agent ${agentId}`, 'warning');
        return;
    }

    // Get the latest metrics
    const latestMetrics = agent.metrics[agent.metrics.length - 1];

    // Create modal content
    const modalContent = `
        <div class="modal fade" id="agentDetailsModal" tabindex="-1" aria-labelledby="agentDetailsModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="agentDetailsModalLabel">Agent Details: ${agentId}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <ul class="nav nav-tabs" id="agentDetailsTabs" role="tablist">
                            <li class="nav-item" role="presentation">
                                <button class="nav-link active" id="metrics-tab" data-bs-toggle="tab" data-bs-target="#metrics" type="button" role="tab" aria-controls="metrics" aria-selected="true">Metrics</button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link" id="performance-tab" data-bs-toggle="tab" data-bs-target="#performance" type="button" role="tab" aria-controls="performance" aria-selected="false">Performance</button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link" id="config-tab" data-bs-toggle="tab" data-bs-target="#config" type="button" role="tab" aria-controls="config" aria-selected="false">Configuration</button>
                            </li>
                        </ul>
                        <div class="tab-content pt-3" id="agentDetailsTabContent">
                            <div class="tab-pane fade show active" id="metrics" role="tabpanel" aria-labelledby="metrics-tab">
                                <div class="table-responsive">
                                    <table class="table table-striped">
                                        <tbody>
                                            ${Object.entries(latestMetrics).map(([key, value]) => `
                                                <tr>
                                                    <th>${key.replace(/_/g, ' ')}</th>
                                                    <td>${typeof value === 'object' ? JSON.stringify(value) : value}</td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div class="tab-pane fade" id="performance" role="tabpanel" aria-labelledby="performance-tab">
                                <div class="chart-container" style="height: 300px;">
                                    <canvas id="agent-detail-chart"></canvas>
                                </div>
                            </div>
                            <div class="tab-pane fade" id="config" role="tabpanel" aria-labelledby="config-tab">
                                <div class="alert alert-info">
                                    Configuration details will be displayed here.
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Add modal to the document
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalContent;
    document.body.appendChild(modalContainer);

    // Initialize modal
    const modal = new bootstrap.Modal(document.getElementById('agentDetailsModal'));
    modal.show();

    // Initialize performance chart when the tab is shown
    document.getElementById('performance-tab').addEventListener('shown.bs.tab', function (e) {
        const ctx = document.getElementById('agent-detail-chart');
        if (!ctx) return;

        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: agent.timestamps,
                datasets: [{
                    label: 'Success Rate (%)',
                    data: agent.performance,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderWidth: 2,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    });

    // Clean up when modal is hidden
    document.getElementById('agentDetailsModal').addEventListener('hidden.bs.modal', function (e) {
        document.body.removeChild(modalContainer);
    });
}

/**
 * Show toast notification
 */
function showToast(title, message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }

    // Create toast element
    const toastId = `toast-${Date.now()}`;
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.id = toastId;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');

    // Create toast content
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <strong>${title}</strong>: ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;

    // Add toast to container
    toastContainer.appendChild(toast);

    // Initialize and show toast
    const bsToast = new bootstrap.Toast(toast, {
        autohide: true,
        delay: 5000
    });
    bsToast.show();

    // Remove toast after it's hidden
    toast.addEventListener('hidden.bs.toast', function () {
        toastContainer.removeChild(toast);
    });
}

    // Update cache hit rate chart
    if (metricsHistory.cache.length > 0) {
        // Create labels (timestamps)
        const labels = metricsHistory.cache.map(metric => {
            return new Date(metric.timestamp).toLocaleTimeString();
        });

        // Update chart data
        cacheHitChart.data.labels = labels;
        cacheHitChart.data.datasets[0].data = metricsHistory.cache.map(metric => (metric.memory_hit_rate || 0) * 100);
        cacheHitChart.data.datasets[1].data = metricsHistory.cache.map(metric => (metric.disk_hit_rate || 0) * 100);
        cacheHitChart.data.datasets[2].data = metricsHistory.cache.map(metric => (metric.distributed_hit_rate || 0) * 100);

        // Update chart
        cacheHitChart.update();
    }

    // Update cache size chart
    if (metricsHistory.cache.length > 0) {
        const latestMetrics = metricsHistory.cache[metricsHistory.cache.length - 1];

        // Update chart data
        cacheSizeChart.data.datasets[0].data = [
            latestMetrics.memory_size || 0,
            latestMetrics.disk_size || 0,
            latestMetrics.distributed && latestMetrics.distributed.used_memory || 0
        ];

        cacheSizeChart.data.datasets[1].data = [
            latestMetrics.memory_max_size || 0,
            latestMetrics.disk_max_size || 0,
            latestMetrics.distributed && latestMetrics.distributed.used_memory_peak || 0
        ];

        // Update chart
        cacheSizeChart.update();
    }
}
