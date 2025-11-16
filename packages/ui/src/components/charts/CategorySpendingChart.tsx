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
      const dates = categoryData.dataPoints.map(p => {
        const date = typeof p.date === 'string' ? new Date(p.date) : p.date;
        return date.getTime();
      });
      const amounts = categoryData.dataPoints.map(p => p.cumulativeAmount);

      const categoryColor = getCategoryColor(categoryData.category, index);

      // Find highlighted point
      const highlightPoint = categoryData.highlightIndex >= 0
        ? {
            coord: [
              dates[categoryData.highlightIndex],
              amounts[categoryData.highlightIndex]
            ],
            name: 'Current',
            value: amounts[categoryData.highlightIndex],
            symbol: 'circle',
            symbolSize: 14,
            itemStyle: {
              color: theme.colors.background,
              borderColor: categoryColor,
              borderWidth: 4,
            },
            label: {
              show: true,
              position: 'right' as const,
              offset: [15, 0],
              formatter: (params: any) => `$${(params.value / 100).toFixed(2)}`,
              color: '#FFFFFF',
              fontSize: 16,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              borderRadius: 6,
              padding: [6, 12],
            },
          }
        : null;

      return {
        name: categoryData.category,
        type: 'line' as const,
        data: dates.map((date, idx) => [date, amounts[idx]]),
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
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
        bottom: 60,
      },
      xAxis: {
        type: 'time',
        axisLabel: {
          formatter: (value: number) => {
            const date = new Date(value);
            return date.getDate().toString();
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
  }, [data, theme, showBudget]);

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
