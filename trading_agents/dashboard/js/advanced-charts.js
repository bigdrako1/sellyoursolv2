/**
 * Advanced Charts for Trading Agents Dashboard
 *
 * This script provides enhanced visualization capabilities for the trading agents dashboard:
 * - Interactive performance charts with zooming and panning
 * - Strategy backtesting visualization
 * - Agent performance comparison
 * - Real-time metrics visualization
 */

// Chart configuration
const CHART_COLORS = {
  blue: 'rgba(54, 162, 235, 1)',
  blueTransparent: 'rgba(54, 162, 235, 0.2)',
  green: 'rgba(75, 192, 192, 1)',
  greenTransparent: 'rgba(75, 192, 192, 0.2)',
  red: 'rgba(255, 99, 132, 1)',
  redTransparent: 'rgba(255, 99, 132, 0.2)',
  orange: 'rgba(255, 159, 64, 1)',
  orangeTransparent: 'rgba(255, 159, 64, 0.2)',
  purple: 'rgba(153, 102, 255, 1)',
  purpleTransparent: 'rgba(153, 102, 255, 0.2)',
  grey: 'rgba(201, 203, 207, 1)',
  greyTransparent: 'rgba(201, 203, 207, 0.2)'
};

// Chart objects
let agentPerformanceChart = null;
let strategyBacktestChart = null;
let cachePerformanceChart = null;
let realTimeMetricsChart = null;

/**
 * Initialize advanced charts
 */
function initAdvancedCharts() {
  initAgentPerformanceChart();
  initCachePerformanceChart();
  initRealTimeMetricsChart();
}

/**
 * Initialize agent performance comparison chart
 */
function initAgentPerformanceChart() {
  const ctx = document.getElementById('agent-performance-chart');
  if (!ctx) return;

  agentPerformanceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: []
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
          text: 'Agent Performance Comparison'
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
            text: 'Time'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Performance (%)'
          }
        }
      }
    }
  });
}

/**
 * Initialize cache performance chart
 */
function initCachePerformanceChart() {
  const ctx = document.getElementById('cache-performance-chart');
  if (!ctx) return;

  cachePerformanceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Memory Hit Rate',
          data: [],
          borderColor: CHART_COLORS.blue,
          backgroundColor: CHART_COLORS.blueTransparent,
          borderWidth: 2,
          tension: 0.1
        },
        {
          label: 'Disk Hit Rate',
          data: [],
          borderColor: CHART_COLORS.green,
          backgroundColor: CHART_COLORS.greenTransparent,
          borderWidth: 2,
          tension: 0.1
        },
        {
          label: 'Distributed Hit Rate',
          data: [],
          borderColor: CHART_COLORS.purple,
          backgroundColor: CHART_COLORS.purpleTransparent,
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
          text: 'Cache Performance'
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
            text: 'Time'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Hit Rate (%)'
          },
          min: 0,
          max: 100
        }
      }
    }
  });
}

/**
 * Initialize real-time metrics chart
 */
function initRealTimeMetricsChart() {
  const ctx = document.getElementById('real-time-metrics-chart');
  if (!ctx) return;

  realTimeMetricsChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'API Requests',
          data: [],
          borderColor: CHART_COLORS.blue,
          backgroundColor: CHART_COLORS.blueTransparent,
          borderWidth: 2,
          tension: 0.1,
          yAxisID: 'y'
        },
        {
          label: 'Error Rate',
          data: [],
          borderColor: CHART_COLORS.red,
          backgroundColor: CHART_COLORS.redTransparent,
          borderWidth: 2,
          tension: 0.1,
          yAxisID: 'y1'
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
          text: 'Real-Time API Metrics'
        },
        tooltip: {
          enabled: true,
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Time'
          }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'Requests'
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'Error Rate (%)'
          },
          min: 0,
          max: 100,
          grid: {
            drawOnChartArea: false
          }
        }
      }
    }
  });
}

/**
 * Update agent performance chart with new data
 */
function updateAgentPerformanceChart(agentData) {
  if (!agentPerformanceChart || !agentData) return;

  // Clear existing datasets
  agentPerformanceChart.data.datasets = [];
  
  // Add dataset for each agent
  Object.keys(agentData).forEach((agentId, index) => {
    const colorIndex = index % Object.keys(CHART_COLORS).length;
    const colorKey = Object.keys(CHART_COLORS)[colorIndex];
    
    agentPerformanceChart.data.datasets.push({
      label: agentId,
      data: agentData[agentId].performance,
      borderColor: CHART_COLORS[colorKey],
      backgroundColor: CHART_COLORS[colorKey + 'Transparent'] || CHART_COLORS[colorKey],
      borderWidth: 2,
      tension: 0.1
    });
  });
  
  // Update labels (timestamps)
  if (Object.keys(agentData).length > 0) {
    const firstAgentId = Object.keys(agentData)[0];
    agentPerformanceChart.data.labels = agentData[firstAgentId].timestamps;
  }
  
  // Update chart
  agentPerformanceChart.update();
}

/**
 * Update cache performance chart with new data
 */
function updateCachePerformanceChart(cacheData) {
  if (!cachePerformanceChart || !cacheData || !cacheData.length) return;
  
  // Extract timestamps and hit rates
  const timestamps = cacheData.map(metric => {
    return new Date(metric.timestamp).toLocaleTimeString();
  });
  
  const memoryHitRates = cacheData.map(metric => {
    if (metric.advanced_cache) {
      return metric.advanced_cache.memory_hit_rate * 100;
    }
    return null;
  });
  
  const diskHitRates = cacheData.map(metric => {
    if (metric.advanced_cache) {
      return metric.advanced_cache.disk_hit_rate * 100;
    }
    return null;
  });
  
  const distributedHitRates = cacheData.map(metric => {
    if (metric.advanced_cache && metric.advanced_cache.distributed_hit_rate !== undefined) {
      return metric.advanced_cache.distributed_hit_rate * 100;
    }
    return null;
  });
  
  // Update chart data
  cachePerformanceChart.data.labels = timestamps;
  cachePerformanceChart.data.datasets[0].data = memoryHitRates;
  cachePerformanceChart.data.datasets[1].data = diskHitRates;
  cachePerformanceChart.data.datasets[2].data = distributedHitRates;
  
  // Update chart
  cachePerformanceChart.update();
}

/**
 * Update real-time metrics chart with new data
 */
function updateRealTimeMetricsChart(httpData) {
  if (!realTimeMetricsChart || !httpData || !httpData.length) return;
  
  // Extract timestamps and metrics
  const timestamps = httpData.map(metric => {
    return new Date(metric.timestamp).toLocaleTimeString();
  });
  
  const requests = httpData.map(metric => metric.requests || 0);
  const errorRates = httpData.map(metric => (metric.error_rate || 0) * 100);
  
  // Update chart data
  realTimeMetricsChart.data.labels = timestamps;
  realTimeMetricsChart.data.datasets[0].data = requests;
  realTimeMetricsChart.data.datasets[1].data = errorRates;
  
  // Update chart
  realTimeMetricsChart.update();
}

// Export functions
window.advancedCharts = {
  initAdvancedCharts,
  updateAgentPerformanceChart,
  updateCachePerformanceChart,
  updateRealTimeMetricsChart
};
