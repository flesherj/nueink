import React, { useRef, useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { SVGRenderer, SvgChart } from '@wuba/react-native-echarts';
import type { EChartsOption } from 'echarts';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import {
  GridComponent,
  MarkPointComponent,
  MarkLineComponent,
} from 'echarts/components';
import type { CategoryTimelineData } from '@nueink/core';

// Register required ECharts components
echarts.use([
  SVGRenderer,
  GridComponent,
  LineChart,
  MarkPointComponent,
  MarkLineComponent,
]);

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 48; // Account for padding
const chartHeight = 200;

export interface CategorySpendingChartProps {
  /** The timeline data to display */
  data: CategoryTimelineData;
  /** Whether to show budget line overlay (if budget exists) */
  showBudget?: boolean;
  /** Optional custom height for the chart */
  height?: number;
}

/**
 * CategorySpendingChart - Displays cumulative spending timeline for a category
 *
 * Shows where a transaction fits in the month's spending pattern with:
 * - Cumulative spending line chart
 * - Highlighted current transaction
 * - Context text (transaction number, date, budget percentage)
 * - Optional budget threshold line
 *
 * @example
 * ```tsx
 * <CategorySpendingChart
 *   data={timelineData}
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

  // Build chart option
  const chartOption = useMemo((): EChartsOption => {
    // Prepare data for ECharts
    const dates = data.dataPoints.map(p => p.date.getTime());
    const amounts = data.dataPoints.map(p => p.cumulativeAmount);

    // Find highlighted point
    const highlightPoint = data.highlightIndex >= 0
      ? {
          coord: [
            dates[data.highlightIndex],
            amounts[data.highlightIndex]
          ],
          name: 'Current',
          value: amounts[data.highlightIndex],
          symbol: 'pin',
          symbolSize: 50,
          itemStyle: {
            color: theme.colors.primary,
          },
        }
      : null;

    const option: EChartsOption = {
      grid: {
        left: 50,
        right: 20,
        top: 40,
        bottom: 30,
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
      series: [
        {
          name: data.category,
          type: 'line',
          data: dates.map((date, index) => [date, amounts[index]]),
          smooth: true,
          symbol: 'circle',
          symbolSize: 4,
          lineStyle: {
            color: theme.colors.primary,
            width: 2,
          },
          itemStyle: {
            color: theme.colors.primary,
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: `${theme.colors.primary}33`, // 20% opacity
                },
                {
                  offset: 1,
                  color: `${theme.colors.primary}11`, // 7% opacity
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
            showBudget && data.budgetAmount
              ? {
                  silent: true,
                  lineStyle: {
                    color: theme.colors.error,
                    type: 'dashed',
                    width: 2,
                  },
                  data: [
                    {
                      yAxis: data.budgetAmount,
                      label: {
                        formatter: 'Budget',
                        position: 'end',
                        color: theme.colors.error,
                      },
                    },
                  ],
                }
              : undefined,
        },
      ],
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
    if (data.highlightIndex < 0) {
      return `${data.transactionCount} transactions, $${(data.totalSpent / 100).toFixed(2)} spent`;
    }

    const dayOfMonth = data.dataPoints[data.highlightIndex].date.getDate();
    const transactionNumber = data.highlightIndex + 1;

    let text = `Transaction #${transactionNumber} of ${data.transactionCount}, Day ${dayOfMonth}`;

    if (data.budgetAmount && data.budgetPercentage !== undefined) {
      text += `, ${Math.round(data.budgetPercentage)}% of budget`;
    }

    return text;
  }, [data]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="titleSmall" style={styles.title}>
          {data.category} Spending
        </Text>
        <Text variant="bodyMedium" style={styles.amount}>
          ${(data.totalSpent / 100).toFixed(2)}
        </Text>
      </View>

      <SvgChart ref={chartRef} />

      <Text variant="bodySmall" style={styles.contextText}>
        {contextText}
      </Text>
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
