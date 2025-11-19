import { memo } from 'react';
import Svg, { Circle } from 'react-native-svg';

interface CircularDragHandleProps {
  size: number;
  radius: number;
  angle: number; // 0 to 360
  handleSize: number;
  handleColor: string;
  handleStrokeColor: string;
  handleStrokeWidth: number;
}

/**
 * Pure SVG drag handle positioned at an angle on a circle
 * Heavily memoized for performance
 */
export const CircularDragHandle = memo<CircularDragHandleProps>(
  ({
    size,
    radius,
    angle,
    handleSize,
    handleColor,
    handleStrokeColor,
    handleStrokeWidth,
  }) => {
    const center = size / 2;

    // Convert angle to position on circle
    const angleInRadians = ((angle - 90) * Math.PI) / 180.0;
    const handleX = center + radius * Math.cos(angleInRadians);
    const handleY = center + radius * Math.sin(angleInRadians);

    return (
      <Svg
        width={size}
        height={size}
        style={{ position: 'absolute', pointerEvents: 'none' }}
      >
        <Circle
          cx={handleX}
          cy={handleY}
          r={handleSize}
          fill={handleColor}
          stroke={handleStrokeColor}
          strokeWidth={handleStrokeWidth}
        />
      </Svg>
    );
  },
  (prevProps, nextProps) => {
    // Round angle to nearest degree to avoid re-rendering on tiny changes
    const prevAngle = Math.round(prevProps.angle);
    const nextAngle = Math.round(nextProps.angle);

    return (
      prevProps.size === nextProps.size &&
      prevProps.radius === nextProps.radius &&
      prevAngle === nextAngle &&
      prevProps.handleSize === nextProps.handleSize &&
      prevProps.handleColor === nextProps.handleColor &&
      prevProps.handleStrokeColor === nextProps.handleStrokeColor &&
      prevProps.handleStrokeWidth === nextProps.handleStrokeWidth
    );
  }
);

CircularDragHandle.displayName = 'CircularDragHandle';
