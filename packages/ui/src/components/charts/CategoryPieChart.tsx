import React, { useRef, useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from 'react-native-paper';
import { SVGRenderer, SvgChart } from '@wuba/react-native-echarts';
import type { EChartsOption } from 'echarts';
import * as echarts from 'echarts/core';
import { PieChart } from 'echarts/charts';
import {
  LegendComponent,
  TooltipComponent,
} from 'echarts/components';
import type { CategorySpending } from '@nueink/core';

// Register required ECharts components
echarts.use([
  SVGRenderer,
  PieChart,
  LegendComponent,
  TooltipComponent,
]);

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 48; // Account for padding
const chartHeight = 320; // Increased to accommodate bottom legend

export interface CategoryPieChartProps {
  /** Category spending data to display */
  data: CategorySpending[];
  /** Optional custom height for the chart */
  height?: number;
  /** Number of top categories to show (rest grouped as "Other") */
  topN?: number;
}

/**
 * CategoryPieChart - Displays spending breakdown by category as a pie chart
 *
 * Shows spending distribution across categories with:
 * - Color-coded pie slices
 * - Percentage labels
 * - Interactive tooltips with amounts
 * - Optional grouping of smaller categories as "Other"
 *
 * @example
 * ```tsx
 * <CategoryPieChart
 *   data={analysis.spendingByCategory}
 *   topN={7}
 * />
 * ```
 */
export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({
  data,
  height = chartHeight,
  topN = 7,
}) => {
  const theme = useTheme();
  const chartRef = useRef<any>(null);

  // Color palette for categories
  const categoryColors = [
    '#6750A4', // Purple
    '#8E44AD', // Dark purple
    '#9B59B6', // Light purple
    '#3498DB', // Blue
    '#2ECC71', // Green
    '#F1C40F', // Yellow
    '#E67E22', // Orange
    '#E74C3C', // Red
    '#95A5A6', // Gray (for "Other")
  ];

  // Build chart option
  const chartOption = useMemo((): EChartsOption => {
    if (data.length === 0) {
      return {};
    }

    // Group smaller categories as "Other" if we have more than topN categories
    let chartData: Array<{ name: string; value: number }>;
    if (data.length > topN) {
      const topCategories = data.slice(0, topN);
      const otherCategories = data.slice(topN);
      const otherTotal = otherCategories.reduce((sum, cat) => sum + cat.amount, 0);

      chartData = [
        ...topCategories.map(cat => ({
          name: cat.category,
          value: cat.amount / 100, // Convert cents to dollars
        })),
        {
          name: 'Other',
          value: otherTotal / 100,
        },
      ];
    } else {
      chartData = data.map(cat => ({
        name: cat.category,
        value: cat.amount / 100,
      }));
    }

    const option: EChartsOption = {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const value = params.value as number;
          const percent = params.percent as number;
          return `${params.name}\n$${value.toFixed(2)} (${percent.toFixed(1)}%)`;
        },
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        borderColor: '#666',
        borderWidth: 1,
        textStyle: {
          color: '#FFFFFF',
          fontSize: 12,
        },
        padding: [8, 12],
      },
      legend: {
        orient: 'horizontal',
        bottom: 0,
        left: 'center',
        textStyle: {
          color: theme.colors.onSurface,
          fontSize: 10,
        },
        itemGap: 12,
        itemWidth: 12,
        itemHeight: 12,
        formatter: (name: string) => {
          // Truncate long category names for horizontal layout
          return name.length > 15 ? name.substring(0, 13) + '...' : name;
        },
      },
      series: [
        {
          type: 'pie',
          radius: ['35%', '60%'], // Smaller donut chart
          center: ['50%', '35%'], // Center horizontally, shift up more for bottom legend
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 8,
            borderColor: theme.colors.surface,
            borderWidth: 2,
          },
          label: {
            show: true,
            position: 'outside',
            formatter: '{d}%', // Show percentage
            fontSize: 11,
            color: theme.colors.onSurface,
          },
          labelLine: {
            show: true,
            length: 10,
            length2: 10,
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 13,
              fontWeight: 'bold',
            },
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
          data: chartData,
          color: categoryColors,
        },
      ],
    };

    return option;
  }, [data, theme, topN]);

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

  if (data.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <SvgChart ref={chartRef} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});
