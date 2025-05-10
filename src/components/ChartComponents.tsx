import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Export all chart components
const ChartComponents = {
  // Line Chart Component
  LineChartComponent: ({ 
    data, 
    width = '100%', 
    height = 300, 
    dataKey = 'value', 
    xAxisDataKey = 'name',
    stroke = '#8884d8',
    margin = { top: 5, right: 30, left: 20, bottom: 5 }
  }) => (
    <ResponsiveContainer width={width} height={height}>
      <LineChart
        data={data}
        margin={margin}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
        <XAxis dataKey={xAxisDataKey} stroke="#888" />
        <YAxis stroke="#888" />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#222', 
            borderColor: '#444',
            color: '#fff'
          }} 
        />
        <Legend />
        <Line type="monotone" dataKey={dataKey} stroke={stroke} activeDot={{ r: 8 }} />
      </LineChart>
    </ResponsiveContainer>
  ),

  // Area Chart Component
  AreaChartComponent: ({ 
    data, 
    width = '100%', 
    height = 300, 
    dataKey = 'value', 
    xAxisDataKey = 'name',
    fill = '#8884d8',
    stroke = '#8884d8',
    margin = { top: 5, right: 30, left: 20, bottom: 5 }
  }) => (
    <ResponsiveContainer width={width} height={height}>
      <AreaChart
        data={data}
        margin={margin}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
        <XAxis dataKey={xAxisDataKey} stroke="#888" />
        <YAxis stroke="#888" />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#222', 
            borderColor: '#444',
            color: '#fff'
          }} 
        />
        <Legend />
        <Area type="monotone" dataKey={dataKey} stroke={stroke} fill={fill} />
      </AreaChart>
    </ResponsiveContainer>
  ),

  // Bar Chart Component
  BarChartComponent: ({ 
    data, 
    width = '100%', 
    height = 300, 
    dataKey = 'value', 
    xAxisDataKey = 'name',
    fill = '#8884d8',
    margin = { top: 5, right: 30, left: 20, bottom: 5 }
  }) => (
    <ResponsiveContainer width={width} height={height}>
      <BarChart
        data={data}
        margin={margin}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
        <XAxis dataKey={xAxisDataKey} stroke="#888" />
        <YAxis stroke="#888" />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#222', 
            borderColor: '#444',
            color: '#fff'
          }} 
        />
        <Legend />
        <Bar dataKey={dataKey} fill={fill} />
      </BarChart>
    </ResponsiveContainer>
  ),

  // Pie Chart Component
  PieChartComponent: ({ 
    data, 
    width = '100%', 
    height = 300, 
    dataKey = 'value', 
    nameKey = 'name',
    colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'],
    margin = { top: 5, right: 30, left: 20, bottom: 5 }
  }) => (
    <ResponsiveContainer width={width} height={height}>
      <PieChart margin={margin}>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey={dataKey}
          nameKey={nameKey}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#222', 
            borderColor: '#444',
            color: '#fff'
          }} 
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  ),
};

export default ChartComponents;
