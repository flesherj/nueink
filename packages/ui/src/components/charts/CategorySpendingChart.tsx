import React, { useRef, useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { SVGRenderer, SvgChart } from '@wuba/react-native-echarts';
import type { EChartsOption } from 'echarts';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import {
  GridComponent,
  LegendComponent,
  MarkPointComponent,
  MarkLineComponent,
  TooltipComponent,
  DataZoomComponent,
} from 'echarts/components';
import type { CategoryTimelineData } from '@nueink/core';

// Register required ECharts components
echarts.use([
  SVGRenderer,
  GridComponent,
  LegendComponent,
  LineChart,
  MarkPointComponent,
  MarkLineComponent,
  TooltipComponent,
  DataZoomComponent,
]);

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 48; // Account for padding
const chartHeight = 200;

export interface CategorySpendingChartProps {
  /** The timeline data to display (array for multiple categories) */
  data: CategoryTimelineData[];
  /** Whether to show budget line overlay (if budget exists) */
  showBudget?: boolean;
  /** Optional custom height for the chart */
  height?: number;
  /** Time period being displayed (affects x-axis formatting) */
  timePeriod?: 'week' | 'month' | 'quarter' | 'year';
}

/**
 * CategorySpendingChart - Displays cumulative spending timeline for multiple categories
 *
 * Shows where a transaction fits in the month's spending pattern with:
 * - Cumulative spending line charts (one per category)
 * - Highlighted current transaction on each line
 * - Color-coded lines matching category allocation
 * - Legend showing category names
 * - Context text (transaction number, date, budget percentage)
 * - Optional budget threshold lines
 *
 * @example
 * ```tsx
 * <CategorySpendingChart
 *   data={[timelineData1, timelineData2]}
 *   showBudget={true}
 * />
 * ```
 */
export const CategorySpendingChart: React.FC<CategorySpendingChartProps> = ({
  data,
  showBudget = false,
  height = chartHeight,
  timePeriod = 'month',
}) => {
  const theme = useTheme();
  const chartRef = useRef<any>(null);

  // Color palette matching category allocation section
  const getCategoryColor = (category: string, index: number): string => {
    if (category === 'Uncategorized') {
      return 'rgba(128, 128, 128, 0.9)';
    }
    const colors = [
      'rgba(103, 80, 164, 0.9)',   // Purple
      'rgba(142, 68, 173, 0.9)',   // Dark purple
      'rgba(155, 89, 182, 0.9)',   // Light purple
      'rgba(52, 152, 219, 0.9)',   // Blue
      'rgba(46, 204, 113, 0.9)',   // Green
      'rgba(241, 196, 15, 0.9)',   // Yellow
      'rgba(230, 126, 34, 0.9)',   // Orange
      'rgba(231, 76, 60, 0.9)',    // Red
    ];
    return colors[index % colors.length];
  };

  // Build chart option
  const chartOption = useMemo((): EChartsOption => {
    if (data.length === 0) {
      return {};
    }

    // Create a series for each category
    const series = data.map((categoryData, index) => {
      // Prepare data for ECharts (handle both Date objects and ISO date strings)
      // Filter out any invalid data points with NaN values
      const validDataPoints = categoryData.dataPoints.filter(p => {
        const date = typeof p.date === 'string' ? new Date(p.date) : p.date;
        const timestamp = date.getTime();
        const amount = p.cumulativeAmount;
        return !isNaN(timestamp) && !isNaN(amount) && amount !== undefined && amount !== null;
      });

      const dates = validDataPoints.map(p => {
        const date = typeof p.date === 'string' ? new Date(p.date) : p.date;
        return date.getTime();
      });
      const amounts = validDataPoints.map(p => p.cumulativeAmount);

      const categoryColor = getCategoryColor(categoryData.category, index);

      // Find highlighted point and calculate daily total
      const highlightPoint = categoryData.highlightIndex >= 0
        ? (() => {
            const currentCumulative = amounts[categoryData.highlightIndex];
            const previousCumulative = categoryData.highlightIndex > 0
              ? amounts[categoryData.highlightIndex - 1]
              : 0;
            // Calculate total spent on this day (includes all transactions on this date)
            const dailyTotal = currentCumulative - previousCumulative;

            return {
              coord: [
                dates[categoryData.highlightIndex],
                amounts[categoryData.highlightIndex]
              ],
              name: 'Current',
              value: dailyTotal, // Show in tooltip when tapped
              symbol: 'circle',
              symbolSize: 7,  // Same size as regular dots
              itemStyle: {
                // Use gold/amber color for highlighted transaction - visually distinct
                color: '#FDB022',
                borderColor: '#F59E0B',
                borderWidth: 2,
              },
              label: {
                show: false, // No permanent label - use tooltip like other transactions
              },
            };
          })()
        : null;

      return {
        name: categoryData.category,
        type: 'line' as const,
        data: dates.map((date, idx) => [date, amounts[idx]]),
        smooth: true,
        symbol: 'circle',
        symbolSize: 7,
        lineStyle: {
          color: categoryColor,
          width: 2,
        },
        itemStyle: {
          color: categoryColor,
        },
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: `${categoryColor.replace('0.9)', '0.2)')}`, // 20% opacity
              },
              {
                offset: 1,
                color: `${categoryColor.replace('0.9)', '0.05)')}`, // 5% opacity
              },
            ],
          },
        },
        markPoint: highlightPoint
          ? {
              data: [highlightPoint],
            }
          : undefined,
        markLine:
          showBudget && categoryData.budgetAmount
            ? {
                silent: true,
                lineStyle: {
                  color: theme.colors.error,
                  type: 'dashed' as const,
                  width: 2,
                },
                data: [
                  {
                    yAxis: categoryData.budgetAmount,
                    label: {
                      formatter: `${categoryData.category} Budget`,
                      position: 'end' as const,
                      color: theme.colors.error,
                    },
                  },
                ],
              }
            : undefined,
      };
    });

    const option: EChartsOption = {
      tooltip: {
        show: true,
        trigger: 'item',
        triggerOn: 'click',  // Use click for mobile instead of mousemove
        formatter: (params: any) => {
          if (params.componentType === 'series' && params.data) {
            const [timestamp, cumulativeAmount] = params.data;
            const date = new Date(timestamp);
            const formattedDate = date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });

            // Find the data point to get merchant name and individual transaction amount
            const categoryData = data.find(d => d.category === params.seriesName);
            const dataPoint = categoryData?.dataPoints.find(
              p => new Date(p.date).getTime() === timestamp
            );
            const merchantName = dataPoint?.merchantName || 'Unknown';
            const individualAmount = dataPoint?.amount || 0;

            const formattedIndividual = `$${(individualAmount / 100).toFixed(2)}`;
            const formattedCumulative = `$${(cumulativeAmount / 100).toFixed(2)}`;

            // Show individual transaction amount and cumulative total
            return `${merchantName}\n${formattedDate}\nAmount: ${formattedIndividual}\nTotal: ${formattedCumulative}`;
          }
          return '';
        },
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        borderColor: '#666',
        borderWidth: 1,
        textStyle: {
          color: '#FFFFFF',
          fontSize: 12,
        },
        padding: [8, 12],
        confine: true,  // Keep tooltip within chart area
      },
      dataZoom: [
        {
          type: 'inside',  // Enable pinch-to-zoom and pan gestures
          xAxisIndex: 0,
          zoomOnMouseWheel: 'ctrl',  // Require ctrl for mouse wheel zoom (desktop)
          moveOnMouseMove: true,     // Allow panning
          preventDefaultMouseMove: false,
        },
        {
          type: 'slider',  // Visual slider control for zoom
          xAxisIndex: 0,
          start: 0,        // Start at 0% (show all data initially)
          end: 100,        // End at 100%
          height: 20,
          bottom: 35,      // Position above legend
          fillerColor: 'rgba(103, 80, 164, 0.2)',
          borderColor: 'rgba(103, 80, 164, 0.5)',
          handleStyle: {
            color: 'rgba(103, 80, 164, 0.9)',
            borderColor: 'rgba(103, 80, 164, 1)',
          },
          textStyle: {
            color: theme.colors.onSurfaceVariant,
            fontSize: 10,
          },
          showDataShadow: false,  // Disable data shadow to prevent NaN errors
        },
      ],
      legend: {
        data: data.map(d => d.category),
        bottom: 0,
        textStyle: {
          color: theme.colors.onSurface,
          fontSize: 11,
        },
      },
      grid: {
        left: 50,
        right: 20,
        top: 40,
        bottom: 90,  // Increased to make room for slider + legend
      },
      xAxis: {
        type: 'time',
        min: (() => {
          if (!data[0]?.periodStart) return undefined;
          const time = new Date(data[0].periodStart).getTime();
          return !isNaN(time) ? time : undefined;
        })(),
        max: (() => {
          if (!data[0]?.periodEnd) return undefined;
          const time = new Date(data[0].periodEnd).getTime();
          return !isNaN(time) ? time : undefined;
        })(),
        // For quarter/year, set minimum interval to 1 month to avoid duplicate labels
        minInterval: (timePeriod === 'quarter' || timePeriod === 'year')
          ? 30 * 24 * 60 * 60 * 1000  // ~30 days in milliseconds
          : undefined,
        axisLabel: {
          formatter: (value: number) => {
            const date = new Date(value);
            // Different formatting based on time period
            if (timePeriod === 'week' || timePeriod === 'month') {
              // Show day of month for week/month views
              return date.getDate().toString();
            } else {
              // Show abbreviated month for quarter/year views
              const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              return monthNames[date.getMonth()];
            }
          },
          color: theme.colors.onSurfaceVariant,
          fontSize: 10,
        },
        axisLine: {
          lineStyle: {
            color: theme.colors.outline,
          },
        },
        splitLine: {
          show: false,
        },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => {
            // Format as currency
            return `$${(value / 100).toFixed(0)}`;
          },
          color: theme.colors.onSurfaceVariant,
          fontSize: 10,
        },
        axisLine: {
          show: false,
        },
        splitLine: {
          lineStyle: {
            color: theme.colors.surfaceVariant,
            type: 'dashed',
          },
        },
      },
      series,
    };

    return option;
  }, [data, theme, showBudget, timePeriod]);

  // Initialize chart
  useEffect(() => {
    let chart: any;
    if (chartRef.current) {
      chart = echarts.init(chartRef.current, 'light', {
        renderer: 'svg',
        width: chartWidth,
        height: height,
      });
      chart.setOption(chartOption);
    }

    return () => chart?.dispose();
  }, [chartOption, height]);

  // Generate context text
  const contextText = useMemo(() => {
    if (data.length === 0) {
      return '';
    }

    // Use first category's data for date/transaction info
    const firstCategory = data[0];
    if (firstCategory.highlightIndex < 0) {
      const totalSpent = data.reduce((sum, cat) => sum + cat.totalSpent, 0);
      const totalTransactions = data.reduce((sum, cat) => sum + cat.transactionCount, 0);
      return `${totalTransactions} transactions, $${(totalSpent / 100).toFixed(2)} spent`;
    }

    const date = typeof firstCategory.dataPoints[firstCategory.highlightIndex].date === 'string'
      ? new Date(firstCategory.dataPoints[firstCategory.highlightIndex].date)
      : firstCategory.dataPoints[firstCategory.highlightIndex].date;
    const dayOfMonth = date.getDate();
    const transactionNumber = firstCategory.highlightIndex + 1;

    let text = `Transaction #${transactionNumber} of ${firstCategory.transactionCount}, Day ${dayOfMonth}`;

    // Add budget info if available for first category
    if (firstCategory.budgetAmount && firstCategory.budgetPercentage !== undefined) {
      text += `, ${Math.round(firstCategory.budgetPercentage)}% of ${firstCategory.category} budget`;
    }

    return text;
  }, [data]);

  // Calculate total spent across all categories
  const totalSpent = useMemo(() => {
    return data.reduce((sum, cat) => sum + cat.totalSpent, 0);
  }, [data]);

  // Generate header title
  const headerTitle = useMemo(() => {
    if (data.length === 0) return 'Spending';
    if (data.length === 1) return `${data[0].category} Spending`;
    return 'Category Spending';
  }, [data]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="titleSmall" style={styles.title}>
          {headerTitle}
        </Text>
        <Text variant="bodyMedium" style={styles.amount}>
          ${(totalSpent / 100).toFixed(2)}
        </Text>
      </View>

      <SvgChart ref={chartRef} />

      {contextText && (
        <Text variant="bodySmall" style={styles.contextText}>
          {contextText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  title: {
    fontWeight: '600',
  },
  amount: {
    fontWeight: '700',
  },
  contextText: {
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.7,
    fontStyle: 'italic',
  },
});
