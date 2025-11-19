import { memo } from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

interface CircularProgressRingProps {
  size: number;
  strokeWidth: number;
  progress: number; // 0 to 1
  trackColor: string;
  progressColor: string;
}

/**
 * Pure SVG circular progress ring
 * Heavily memoized for performance - only re-renders when props actually change
 */
export const CircularProgressRing = memo<CircularProgressRingProps>(
  ({ size, strokeWidth, progress, trackColor, progressColor }) => {
    const center = size / 2;
    const radius = center - strokeWidth / 2;
    const circumference = 2 * Math.PI * radius;

    // Calculate arc path for progress
    const angle = progress * 360;

    // Helper to convert polar to cartesian coordinates
    const polarToCartesian = (angleInDegrees: number): { x: number; y: number } => {
      const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
      return {
        x: center + radius * Math.cos(angleInRadians),
        y: center + radius * Math.sin(angleInRadians),
      };
    };

    const createArcPath = (endAngle: number): string => {
      if (endAngle <= 0) return '';
      if (endAngle >= 360) {
        // Full circle - use two arcs to avoid rendering issues
        const halfway = polarToCartesian(180);
        const end = polarToCartesian(359.99); // Almost full circle
        return [
          'M', center, center - radius,
          'A', radius, radius, 0, 0, 1, halfway.x, halfway.y,
          'A', radius, radius, 0, 0, 1, end.x, end.y,
        ].join(' ');
      }

      const start = polarToCartesian(0);
      const end = polarToCartesian(endAngle);
      const largeArcFlag = endAngle > 180 ? 1 : 0;

      return [
        'M', start.x, start.y,
        'A', radius, radius, 0, largeArcFlag, 1, end.x, end.y,
      ].join(' ');
    };

    const arcPath = createArcPath(angle);

    return (
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        {/* Background track */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress arc */}
        {progress > 0 && (
          <Path
            d={arcPath}
            stroke={progressColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
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
