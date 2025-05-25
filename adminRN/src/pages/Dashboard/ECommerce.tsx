'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import {
  FaUsers,
  FaChartLine,
  FaDollarSign,
  FaGraduationCap,
  FaBookOpen,
  FaClipboardList,
  FaTrophy,
  FaChartPie,
  FaArrowUp,
  FaArrowDown,
  FaDownload,
  FaFilter,
  FaCog,
  FaBell,
  FaFileAlt,
  FaQuestionCircle,
  FaTicketAlt,
  FaCreditCard,
  FaShoppingCart,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaPlay,
  FaStop,
  FaRocket,
  FaStar,
  FaFire,
  FaLightbulb,
  FaGem,
  FaThumbsUp,
} from 'react-icons/fa';
import { GiTargetLaser } from 'react-icons/gi';
import AxiosHelper from '../../helper/AxiosHelper';

// Types
interface DashboardOverview {
  totalUsers: number;
  totalAdmins: number;
  totalExamPlans: number;
  totalTestSeries: number;
  totalExams: number;
  totalQuestions: number;
  totalNotes: number;
  totalCoupons: number;
  totalBatches: number;
  totalSubjects: number;
  totalChapters: number;
  totalTopics: number;
  totalSections: number;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  failedOrders: number;
  totalRevenue: number;
  totalPayments: number;
  successfulPayments: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  newUsersThisYear: number;
  ordersToday: number;
  ordersThisWeek: number;
  ordersThisMonth: number;
  ordersThisYear: number;
  revenueToday: number;
  revenueThisWeek: number;
  revenueThisMonth: number;
  revenueThisYear: number;
  freeNotes: number;
  paidNotes: number;
  freeTestSeries: number;
  paidTestSeries: number;
  activeCoupons: number;
  expiredCoupons: number;
  usedCoupons: number;
  completedExams: number;
  ongoingExams: number;
  abandonedExams: number;
  activePurchases: number;
  expiredPurchases: number;
  avgOrderValue: number;
  avgExamScore: number;
  avgTestSeriesDuration: number;
  conversionRate: number;
  userGrowthRate: number;
  revenueGrowthRate: number;
  examCompletionRate: number;
  paymentSuccessRate: number;
}

interface ChartData {
  userRegistrationTrend: Array<{
    _id: { year: number; month: number; day: number };
    count: number;
  }>;
  monthlyUserGrowth: Array<{
    _id: { year: number; month: number };
    count: number;
  }>;
  demographics: {
    state: Array<{ _id: string; count: number }>;
    device: Array<{ _id: string; count: number }>;
  };
  activityPattern: Array<{ _id: number; count: number }>;
  retention: Array<{ _id: string; count: number }>;
}

interface RevenueData {
  dailyRevenueTrend: Array<{
    _id: { year: number; month: number; day: number };
    revenue: number;
    orders: number;
    avgOrderValue: number;
  }>;
  monthlyRevenue: Array<{
    _id: { year: number; month: number };
    revenue: number;
    orders: number;
    avgOrderValue: number;
  }>;
  revenueByExamPlan: Array<{
    _id: string;
    name: string;
    revenue: number;
    orders: number;
    avgPrice: number;
  }>;
  paymentMethodAnalysis: Array<{
    _id: string;
    count: number;
    revenue: number;
    avgAmount: number;
  }>;
  orderStatusDistribution: Array<{
    _id: string;
    count: number;
    revenue: number;
  }>;
  couponAnalysis: Array<{
    _id: string;
    code: string;
    usageCount: number;
    totalDiscount: number;
    avgDiscount: number;
  }>;
}

interface ExamData {
  dailyExamParticipation: Array<{
    _id: { year: number; month: number; day: number };
    totalExams: number;
    completedExams: number;
    avgScore: number;
  }>;
  monthlyExamTrends: Array<{
    _id: { year: number; month: number };
    totalExams: number;
    completedExams: number;
    avgScore: number;
  }>;
  performanceByTestSeries: Array<{
    _id: string;
    name: string;
    totalAttempts: number;
    completedAttempts: number;
    avgScore: number;
    maxScore: number;
    minScore: number;
    completionRate: number;
  }>;
  scoreDistribution: Array<{
    _id: string;
    count: number;
    avgScore: number;
  }>;
  examStatusDistribution: Array<{
    _id: string;
    count: number;
    avgScore: number;
  }>;
}

interface ContentData {
  popularExamPlans: Array<{
    _id: string;
    name: string;
    price: number;
    purchases: number;
    revenue: number;
  }>;
  testSeriesEngagement: Array<{
    _id: string;
    title: string;
    totalQuestions: number;
    totalAttempts: number;
    completedExams: number;
    avgScore: number;
    completionRate: number;
    isFree: boolean;
  }>;
  notesAnalytics: Array<{
    _id: string;
    examPlanName: string;
    totalNotes: number;
    freeNotes: number;
    paidNotes: number;
  }>;
  subjectQuestionDistribution: Array<{
    _id: string;
    name: string;
    questionCount: number;
  }>;
}

// Chart Components
const LineChart: React.FC<{
  data: any[];
  title: string;
  color: string;
  yAxisLabel?: string;
  xAxisLabel?: string;
}> = ({ data, title, color, yAxisLabel = 'Value', xAxisLabel = 'Time' }) => {
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    label: string;
  } | null>(null);

  if (!data || data.length === 0) return null;

  const maxValue = Math.max(
    ...data.map((d) => d.count || d.revenue || d.totalExams || 0),
  );
  const chartHeight = 200;
  const chartWidth = 600;
  const padding = 50; // Increased padding for axis labels and ticks

  // Identify max and min points for annotations
  const maxPoint = data.reduce(
    (max, d) =>
      (d.count || d.revenue || d.totalExams || 0) >
      (max.count || max.revenue || max.totalExams || 0)
        ? d
        : max,
    data[0],
  );
  const minPoint = data.reduce(
    (min, d) =>
      (d.count || d.revenue || d.totalExams || 0) <
      (min.count || min.revenue || min.totalExams || 0)
        ? d
        : min,
    data[0],
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700 relative">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center">
        <FaChartLine className="mr-2 text-blue-500" />
        {title}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
        This graph shows {yAxisLabel.toLowerCase()} over{' '}
        {xAxisLabel.toLowerCase()}. Higher points indicate higher values, and
        lower points indicate lower values.
      </p>
      <div className="relative w-full">
        <svg
          viewBox={`0 0 ${chartWidth + padding * 2} ${
            chartHeight + padding * 2
          }`}
          preserveAspectRatio="none"
          className="w-full h-52"
        >
          <defs>
            <linearGradient
              id={`gradient-${color}`}
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Y-axis */}
          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={chartHeight + padding}
            stroke="#e5e7eb"
            strokeWidth="2"
          />
          <text
            x={padding - 10}
            y={padding - 10}
            textAnchor="end"
            fill="#4b5563"
            fontSize="12"
            transform={`rotate(-90, ${padding - 10}, ${padding - 10})`}
          >
            {yAxisLabel}
          </text>
          {[0, 25, 50, 75, 100].map((percent) => {
            const y = chartHeight + padding - (percent / 100) * chartHeight;
            const value = (maxValue * percent) / 100;
            return (
              <g key={percent}>
                <line
                  x1={padding}
                  y1={y}
                  x2={chartWidth + padding}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                  opacity="0.3"
                />
                <text
                  x={padding - 5}
                  y={y + 4}
                  textAnchor="end"
                  fill="#4b5563"
                  fontSize="10"
                >
                  {Math.round(value)}
                </text>
              </g>
            );
          })}

          {/* X-axis */}
          <line
            x1={padding}
            y1={chartHeight + padding}
            x2={chartWidth + padding}
            y2={chartHeight + padding}
            stroke="#e5e7eb"
            strokeWidth="2"
          />
          <text
            x={chartWidth + padding}
            y={chartHeight + padding + 20}
            textAnchor="end"
            fill="#4b5563"
            fontSize="12"
          >
            {xAxisLabel}
          </text>
          {data.map((d, i) => {
            const x = padding + (i / (data.length - 1)) * chartWidth;
            return (
              <g key={i}>
                <line
                  x1={x}
                  y1={chartHeight + padding}
                  x2={x}
                  y2={chartHeight + padding + 5}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={chartHeight + padding + 15}
                  textAnchor="middle"
                  fill="#4b5563"
                  fontSize="10"
                >
                  {d.month || d.label || `Point ${i + 1}`}
                </text>
              </g>
            );
          })}

          {/* Chart line */}
          <polyline
            fill={`url(#gradient-${color})`}
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={data
              .map((d, i) => {
                const x = padding + (i / (data.length - 1)) * chartWidth;
                const y =
                  chartHeight +
                  padding -
                  ((d.count || d.revenue || d.totalExams || 0) / maxValue) *
                    chartHeight;
                return `${x},${y}`;
              })
              .join(' ')}
          />

          {/* Data points */}
          {data.map((d, i) => {
            const value = d.count || d.revenue || d.totalExams || 0;
            const x = padding + (i / (data.length - 1)) * chartWidth;
            const y = chartHeight + padding - (value / maxValue) * chartHeight;
            const isMax = d === maxPoint;
            const isMin = d === minPoint;

            return (
              <g key={i}>
                <circle
                  cx={x}
                  cy={y}
                  r="5"
                  fill={color}
                  className="cursor-pointer"
                  onMouseEnter={() =>
                    setTooltip({
                      x,
                      y,
                      label: `${
                        d.month || d.label || `Point ${i + 1}`
                      }: ${value} ${yAxisLabel.toLowerCase()}`,
                    })
                  }
                  onMouseLeave={() => setTooltip(null)}
                />
                {/* Annotations for max and min points */}
                {(isMax || isMin) && (
                  <text
                    x={x}
                    y={y - 10}
                    textAnchor="middle"
                    fill="#4b5563"
                    fontSize="10"
                    fontWeight="bold"
                  >
                    {isMax ? `Peak: ${value}` : `Low: ${value}`}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute bg-black text-white text-xs px-2 py-1 rounded pointer-events-none z-10"
            style={{
              top: `${tooltip.y}px`,
              left: `${tooltip.x + padding}px`,
              transform: 'translate(-50%, -100%)',
              whiteSpace: 'nowrap',
            }}
          >
            {tooltip.label}
          </div>
        )}
      </div>
    </div>
  );
};

const PieChart: React.FC<{ data: any[]; title: string; colors: string[] }> = ({
  data,
  title,
  colors,
}) => {
  if (!data || data.length === 0) return null;

  const total = data.reduce(
    (sum, d) => sum + (d.count || d.revenue || d.questionCount || 0),
    0,
  );
  let currentAngle = 0;
  const radius = 80;
  const centerX = 100;
  const centerY = 100;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
        <FaChartPie className="mr-2 text-purple-500" />
        {title}
      </h3>
      <div className="flex items-center justify-between">
        <svg width="200" height="200" className="flex-shrink-0">
          {data.map((d, i) => {
            const value = d.count || d.revenue || d.questionCount || 0;
            const percentage = (value / total) * 100;
            const angle = (value / total) * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;

            const x1 =
              centerX + radius * Math.cos((startAngle * Math.PI) / 180);
            const y1 =
              centerY + radius * Math.sin((startAngle * Math.PI) / 180);
            const x2 = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
            const y2 = centerY + radius * Math.sin((endAngle * Math.PI) / 180);

            const largeArcFlag = angle > 180 ? 1 : 0;
            const pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

            currentAngle += angle;

            return (
              <path
                key={i}
                d={pathData}
                fill={colors[i % colors.length]}
                className="hover:opacity-80 transition-opacity duration-200"
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
              />
            );
          })}

          {/* Center circle */}
          <circle
            cx={centerX}
            cy={centerY}
            r="30"
            fill="white"
            className="dark:fill-gray-800"
          />
          <text
            x={centerX}
            y={centerY}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-sm font-bold fill-gray-900 dark:fill-white"
          >
            Total
          </text>
          <text
            x={centerX}
            y={centerY + 15}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs fill-gray-600 dark:fill-gray-300"
          >
            {total?.toLocaleString()}
          </text>
        </svg>

        <div className="flex-1 ml-6">
          {data.map((d, i) => (
            <div key={i} className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: colors[i % colors.length] }}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                  {d.name || 'Unknown'}
                </span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {(
                  ((d.count || d.revenue || d.questionCount || 0) / total) *
                  100
                ).toFixed(1)}
                %
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const BarChart: React.FC<{ data: any[]; title: string; color: string }> = ({
  data,
  title,
  color,
}) => {
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(
    ...data.map(
      (d) => d.count || d.revenue || d.totalAttempts || d.totalNotes || 0,
    ),
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
        <FaChartLine className="mr-2 text-green-500" />
        {title}
      </h3>
      <div className="space-y-3">
        {data.slice(0, 8).map((d, i) => {
          const value =
            d.count || d.revenue || d.totalAttempts || d.totalNotes || 0;
          const percentage = (value / maxValue) * 100;

          return (
            <div key={i} className="flex items-center">
              <div className="w-24 text-xs text-gray-600 dark:text-gray-400 truncate">
                {d.name || d.title || d.examPlanName || 'Unknown'}
              </div>
              <div className="flex-1 mx-3">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: color,
                      background: `linear-gradient(90deg, ${color}, ${color}dd)`,
                    }}
                  />
                </div>
              </div>
              <div className="w-16 text-xs font-semibold text-gray-900 dark:text-white text-right">
                {value?.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Metric Card Component
const MetricCard: React.FC<{
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  change?: number;
  changeType?: 'increase' | 'decrease';
  subtitle?: string;
  gradient?: boolean;
}> = ({
  title,
  value,
  icon,
  color,
  change,
  changeType,
  subtitle,
  gradient = false,
}) => {
  const formatValue = (val: number | string) => {
    if (typeof val === 'number') {
      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
      if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
      return val?.toLocaleString();
    }
    return val;
  };

  return (
    <div
      className={`
      relative overflow-hidden rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700
      ${
        gradient
          ? `bg-gradient-to-br from-blue-500 to-[#037196] text-white`
          : 'bg-white dark:bg-gray-800'
      }
      hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer
      group
    `}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute -right-4 -top-4 text-6xl">{icon}</div>
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div
            className={`
            p-3 rounded-xl 
            ${
              gradient
                ? 'bg-white bg-opacity-20'
                : `bg-${color}-100 dark:bg-${color}-900 dark:bg-opacity-30`
            }
          `}
          >
            <div
              className={`text-xl ${
                gradient
                  ? 'text-white'
                  : `text-${color}-600 dark:text-${color}-400`
              }`}
            >
              {icon}
            </div>
          </div>

          {change !== undefined && (
            <div
              className={`
              flex items-center px-2 py-1 rounded-full text-xs font-semibold
              ${
                changeType === 'increase'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }
            `}
            >
              {changeType === 'increase' ? (
                <FaArrowUp className="mr-1" />
              ) : (
                <FaArrowDown className="mr-1" />
              )}
              {Math.abs(change)}%
            </div>
          )}
        </div>

        <div className="space-y-1">
          <h3
            className={`
            text-sm font-medium 
            ${
              gradient
                ? 'text-white text-opacity-90'
                : 'text-gray-600 dark:text-gray-400'
            }
          `}
          >
            {title}
          </h3>
          <p
            className={`
            text-3xl font-bold 
            ${gradient ? 'text-white' : 'text-gray-900 dark:text-white'}
            group-hover:scale-110 transition-transform duration-300
          `}
          >
            {formatValue(value)}
          </p>
          {subtitle && (
            <p
              className={`
              text-xs 
              ${
                gradient
                  ? 'text-white text-opacity-75'
                  : 'text-gray-500 dark:text-gray-400'
              }
            `}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Dashboard Component
const ECommerce: React.FC = () => {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [userAnalytics, setUserAnalytics] = useState<ChartData | null>(null);
  const [revenueAnalytics, setRevenueAnalytics] = useState<RevenueData | null>(
    null,
  );
  const [examAnalytics, setExamAnalytics] = useState<ExamData | null>(null);
  const [contentAnalytics, setContentAnalytics] = useState<ContentData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();

    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);

      const [overviewRes, userRes, revenueRes, examRes, contentRes] =
        await Promise.all([
          AxiosHelper.getData('/analytics/overview'),
          AxiosHelper.getData('/analytics/users'),
          AxiosHelper.getData('/analytics/revenue'),
          AxiosHelper.getData('/analytics/exams'),
          AxiosHelper.getData('/analytics/content'),
        ]);
      console.log('overviewRes', overviewRes.data.data);
      console.log('userRes', userRes);
      console.log('revenueRes', revenueRes.data);
      console.log('examRes', examRes.data);
      console.log('contentRes', contentRes.data);

      console.log('overviewRes status ------>', overviewRes?.status);
      console.log('userRes status ------>', userRes?.status);
      console.log('revenueRes status ------>', revenueRes?.status);
      console.log('examRes status ------>', examRes?.status);
      console.log('contentRes status ------>', contentRes?.status);

      if (overviewRes?.status) setOverview(overviewRes.data.data);
      if (userRes?.status) setUserAnalytics(userRes.data.data);
      if (revenueRes?.status) setRevenueAnalytics(revenueRes.data.data);
      if (examRes?.status) setExamAnalytics(examRes.data.data);
      if (contentRes?.status) setContentAnalytics(contentRes.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <FaRocket className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-600 text-xl animate-pulse" />
          </div>
          <p className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-300">
            Loading Analytics Dashboard...
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Preparing your insights
          </p>
        </div>
      </div>
    );
  }

  const pieChartColors = [
    '#3B82F6',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#8B5CF6',
    '#06B6D4',
    '#84CC16',
    '#F97316',
    '#EC4899',
    '#6366F1',
  ];
  console.log('userAnalytics---->', userAnalytics);
  console.log('revenueAnalytics---->', revenueAnalytics);
  console.log('examAnalytics---->', examAnalytics);
  console.log('contentAnalytics---->', contentAnalytics);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                Dashboard
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={fetchDashboardData}
                disabled={refreshing}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
              >
                <FaRocket
                  className={`mr-2 ${refreshing ? 'animate-spin' : ''}`}
                />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: FaRocket },
              { id: 'revenue', name: 'Revenue', icon: FaDollarSign },
              { id: 'exams', name: 'Exams', icon: FaGraduationCap },
              { id: 'content', name: 'Content', icon: FaBookOpen },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                  ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }
                `}
              >
                <tab.icon className="mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {activeTab === 'overview' && overview && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Total Users"
                value={overview?.totalUsers}
                icon={<FaUsers />}
                color="blue"
                change={overview.userGrowthRate}
                changeType="increase"
                subtitle={`+${overview.newUsersToday} today`}
                gradient
              />
              <MetricCard
                title="Total Revenue"
                value={formatCurrency(overview.totalRevenue)}
                icon={<FaDollarSign />}
                color="green"
                change={overview.revenueGrowthRate}
                changeType="increase"
                subtitle={`${formatCurrency(overview.revenueToday)} today`}
                gradient
              />
              <MetricCard
                title="Total Orders"
                value={overview.completedOrders}
                icon={<FaShoppingCart />}
                color="purple"
                change={12.5}
                changeType="increase"
                subtitle={`${overview.ordersToday} today`}
                gradient
              />
              <MetricCard
                title="Conversion Rate"
                value={`${overview.conversionRate}%`}
                icon={<GiTargetLaser />}
                color="orange"
                change={2.3}
                changeType="increase"
                subtitle="Users to customers"
                gradient
              />
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <MetricCard
                title="Exam Plans"
                value={overview.totalExamPlans}
                icon={<FaGraduationCap />}
                color="blue"
              />
              <MetricCard
                title="Test Series"
                value={overview.totalTestSeries}
                icon={<FaClipboardList />}
                color="green"
              />
              <MetricCard
                title="Questions"
                value={overview.totalQuestions}
                icon={<FaQuestionCircle />}
                color="purple"
              />
              <MetricCard
                title="Notes"
                value={overview.totalNotes}
                icon={<FaFileAlt />}
                color="orange"
              />
              <MetricCard
                title="Active Coupons"
                value={overview.activeCoupons}
                icon={<FaTicketAlt />}
                color="pink"
              />
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Exam Completion Rate"
                value={`${overview.examCompletionRate}%`}
                icon={<FaCheckCircle />}
                color="green"
                change={5.2}
                changeType="increase"
              />
              <MetricCard
                title="Payment Success Rate"
                value={`${overview.paymentSuccessRate}%`}
                icon={<FaCreditCard />}
                color="blue"
                change={1.8}
                changeType="increase"
              />
              <MetricCard
                title="Avg Order Value"
                value={formatCurrency(overview.avgOrderValue)}
                icon={<FaDollarSign />}
                color="purple"
              />
              <MetricCard
                title="Avg Exam Score"
                value={`${overview?.avgExamScore?.toFixed(1)}%`}
                icon={<FaTrophy />}
                color="orange"
              />
            </div>

            {/* Status Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Order Status */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                  <FaShoppingCart className="mr-2 text-blue-500" />
                  Order Status
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FaCheckCircle className="text-green-500 mr-2" />
                      <span className="text-gray-700 dark:text-gray-300">
                        Completed
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {overview.completedOrders?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FaClock className="text-yellow-500 mr-2" />
                      <span className="text-gray-700 dark:text-gray-300">
                        Pending
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {overview.pendingOrders?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FaTimesCircle className="text-red-500 mr-2" />
                      <span className="text-gray-700 dark:text-gray-300">
                        Failed
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {overview.failedOrders?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Exam Status */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                  <FaGraduationCap className="mr-2 text-purple-500" />
                  Exam Status
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FaCheckCircle className="text-green-500 mr-2" />
                      <span className="text-gray-700 dark:text-gray-300">
                        Completed
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {overview.completedExams?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FaPlay className="text-blue-500 mr-2" />
                      <span className="text-gray-700 dark:text-gray-300">
                        Ongoing
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {overview.ongoingExams?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FaStop className="text-red-500 mr-2" />
                      <span className="text-gray-700 dark:text-gray-300">
                        Abandoned
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {overview.abandonedExams?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Content Status */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                  <FaBookOpen className="mr-2 text-green-500" />
                  Content Overview
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FaGem className="text-blue-500 mr-2" />
                      <span className="text-gray-700 dark:text-gray-300">
                        Free Notes
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {overview.freeNotes?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FaStar className="text-yellow-500 mr-2" />
                      <span className="text-gray-700 dark:text-gray-300">
                        Paid Notes
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {overview.paidNotes?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FaFire className="text-orange-500 mr-2" />
                      <span className="text-gray-700 dark:text-gray-300">
                        Test Series
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {overview.totalTestSeries?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'revenue' && revenueAnalytics && (
          <div className="space-y-6">
            {/* Revenue Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LineChart
                data={revenueAnalytics.dailyRevenueTrend}
                title="Daily Revenue Trend (Last 30 Days)"
                color="#10B981"
              />
              <LineChart
                data={revenueAnalytics.monthlyRevenue}
                title="Monthly Revenue (Last 12 Months)"
                color="#3B82F6"
              />
            </div>

            {/* Revenue Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PieChart
                data={revenueAnalytics.paymentMethodAnalysis}
                title="Revenue by Payment Method"
                colors={pieChartColors}
              />
              <PieChart
                data={revenueAnalytics.orderStatusDistribution}
                title="Revenue by Order Status"
                colors={['#10B981', '#F59E0B', '#EF4444']}
              />
            </div>

            {/* Top Performers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BarChart
                data={revenueAnalytics.revenueByExamPlan}
                title="Top Revenue Generating Exam Plans"
                color="#10B981"
              />
              <BarChart
                data={revenueAnalytics.couponAnalysis}
                title="Most Used Coupons"
                color="#F59E0B"
              />
            </div>
          </div>
        )}

        {activeTab === 'exams' && examAnalytics && (
          <div className="space-y-6">
            {/* Exam Participation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LineChart
                data={examAnalytics.dailyExamParticipation}
                title="Daily Exam Participation (Last 30 Days)"
                color="#8B5CF6"
              />
              <LineChart
                data={examAnalytics.monthlyExamTrends}
                title="Monthly Exam Trends (Last 12 Months)"
                color="#EC4899"
              />
            </div>

            {/* Performance Analysis */}
            {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PieChart data={examAnalytics.scoreDistribution} title="Score Distribution" colors={pieChartColors} />
              <PieChart
                data={examAnalytics.examStatusDistribution}
                title="Exam Status Distribution"
                colors={["#10B981", "#3B82F6", "#EF4444"]}
              />
            </div> */}

            {/* Test Series Performance */}
            <div className="grid grid-cols-1 gap-6">
              <BarChart
                data={examAnalytics.performanceByTestSeries}
                title="Performance by Test Series"
                color="#8B5CF6"
              />
            </div>
          </div>
        )}

        {activeTab === 'content' && contentAnalytics && (
          <div className="space-y-6">
            {/* Popular Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BarChart
                data={contentAnalytics.popularExamPlans}
                title="Most Popular Exam Plans"
                color="#3B82F6"
              />
              <BarChart
                data={contentAnalytics.testSeriesEngagement}
                title="Test Series Engagement"
                color="#10B981"
              />
            </div>

            {/* Content Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BarChart
                data={contentAnalytics.notesAnalytics}
                title="Notes by Exam Plan"
                color="#F59E0B"
              />
              <PieChart
                data={contentAnalytics.subjectQuestionDistribution}
                title="Questions by Subject"
                colors={pieChartColors}
              />
            </div>

            {/* Content Performance Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <FaLightbulb className="mr-2 text-yellow-500" />
                Top Performing Content
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Content
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Engagement
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Revenue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {contentAnalytics.popularExamPlans
                      .slice(0, 5)
                      .map((plan, index) => (
                        <tr
                          key={index}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <FaGraduationCap className="text-blue-500 mr-3" />
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {plan.name}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  Exam Plan
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {plan.purchases?.toLocaleString()} purchases
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">
                            {formatCurrency(plan.revenue)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              <FaThumbsUp className="mr-1" />
                              Active
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {new Date()?.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ECommerce;
