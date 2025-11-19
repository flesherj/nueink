import { memo } from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

interface CircularProgressRingProps {
  size: number;
  strokeWidth: number;
  progress: number; // 0 to 1
  trackColor: string;
  progressColor: string;
  innerRadius?: number; // Optional inner radius for filled ring
}

/**
 * Pure SVG circular progress ring
 * Heavily memoized for performance - only re-renders when props actually change
 */
export const CircularProgressRing = memo<CircularProgressRingProps>(
  ({ size, strokeWidth, progress, trackColor, progressColor, innerRadius: customInnerRadius }) => {
    const center = size / 2;
    const outerRadius = center - strokeWidth / 2;
    const innerRadius = customInnerRadius ?? outerRadius - 10; // Default: 10px ring width

    // Calculate arc path for progress
    const angle = progress * 360;

    // Helper to convert polar to cartesian coordinates
    const polarToCartesian = (radius: number, angleInDegrees: number): { x: number; y: number } => {
      const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
      return {
        x: center + radius * Math.cos(angleInRadians),
        y: center + radius * Math.sin(angleInRadians),
      };
    };

    // Create filled ring segment path (donut slice)
    const createRingSegmentPath = (endAngle: number): string => {
      if (endAngle <= 0) return '';

      // Special case: full circle (use two semicircles to avoid arc issues at 360°)
      if (endAngle >= 359.9) {
        const outerStart = polarToCartesian(outerRadius, 0);
        const outerMid = polarToCartesian(outerRadius, 180);
        const innerMid = polarToCartesian(innerRadius, 180);
        const innerStart = polarToCartesian(innerRadius, 0);

        return [
          'M', outerStart.x, outerStart.y,
          'A', outerRadius, outerRadius, 0, 1, 1, outerMid.x, outerMid.y, // First half
          'A', outerRadius, outerRadius, 0, 1, 1, outerStart.x, outerStart.y, // Second half
          'L', innerStart.x, innerStart.y,
          'A', innerRadius, innerRadius, 0, 1, 0, innerMid.x, innerMid.y, // First half (reverse)
          'A', innerRadius, innerRadius, 0, 1, 0, innerStart.x, innerStart.y, // Second half (reverse)
          'Z',
        ].join(' ');
      }

      const largeArcFlag = endAngle > 180 ? 1 : 0;

      // Outer arc points
      const outerStart = polarToCartesian(outerRadius, 0);
      const outerEnd = polarToCartesian(outerRadius, endAngle);

      // Inner arc points (reverse direction)
      const innerEnd = polarToCartesian(innerRadius, endAngle);
      const innerStart = polarToCartesian(innerRadius, 0);

      // Create path: outer arc clockwise, then inner arc counter-clockwise
      return [
        'M', outerStart.x, outerStart.y, // Start at outer radius, 0°
        'A', outerRadius, outerRadius, 0, largeArcFlag, 1, outerEnd.x, outerEnd.y, // Outer arc
        'L', innerEnd.x, innerEnd.y, // Line to inner radius
        'A', innerRadius, innerRadius, 0, largeArcFlag, 0, innerStart.x, innerStart.y, // Inner arc (reverse)
        'Z', // Close path
      ].join(' ');
    };

    const ringPath = createRingSegmentPath(angle);

    return (
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        {/* Progress - filled ring segment only, no inner circle stroke */}
        {progress > 0 && (
          <Path
            d={ringPath}
            fill={progressColor}
            fillOpacity={0.9}
          />
        )}
      </Svg>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison: only re-render if values actually changed
    // Round progress to 2 decimal places to avoid re-rendering on tiny changes
    const prevProgress = Math.round(prevProps.progress * 100) / 100;
    const nextProgress = Math.round(nextProps.progress * 100) / 100;

    return (
      prevProps.size === nextProps.size &&
      prevProps.strokeWidth === nextProps.strokeWidth &&
      prevProgress === nextProgress &&
      prevProps.trackColor === nextProps.trackColor &&
      prevProps.progressColor === nextProps.progressColor
    );
  }
);

CircularProgressRing.displayName = 'CircularProgressRing';
