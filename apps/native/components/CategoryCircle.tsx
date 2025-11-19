import { useState, useRef, useCallback, useMemo, memo, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput as RNTextInput } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { CircularProgressRing } from './CircularProgressRing';
import { CircularDragHandle } from './CircularDragHandle';

interface CategoryCircleProps {
  category: string;
  emoji: string;
  amount: number | undefined;
  transactionAmount: number;
  transactionCurrency: string;
  remainingUncategorized: number; // Simple prop - how much is left to allocate
  onAmountChange: (category: string, amount: number) => void;
  formatAmount: (amount: number, currency: string) => string;
  editingCategory: string | null;
  editAmountInput: string;
  onStartEdit: (category: string, amount: number) => void;
  onSaveEdit: () => void;
  setEditAmountInput: (value: string) => void;
  handleColor?: string; // Optional override for drag handle inner color
  handleStrokeColor?: string; // Optional override for drag handle outer color
  progressColor?: string; // Optional override for progress ring fill color
}

/**
 * Optimized category circle with circular drag gesture
 *
 * Key optimizations:
 * - Local drag state (no parent re-renders during drag)
 * - Memoized calculations
 * - Separated SVG components with their own memo
 * - Minimal re-renders
 */
export const CategoryCircle = memo<CategoryCircleProps>(
  ({
    category,
    emoji,
    amount,
    transactionAmount,
    transactionCurrency,
    remainingUncategorized,
    onAmountChange,
    formatAmount,
    editingCategory,
    editAmountInput,
    onStartEdit,
    onSaveEdit,
    setEditAmountInput,
    handleColor: customHandleColor,
    handleStrokeColor: customHandleStrokeColor,
    progressColor: customProgressColor,
  }) => {
    const theme = useTheme();

    // Local drag state - updates without re-rendering parent
    const [dragAmount, setDragAmount] = useState<number | null>(null);

    // Refs for gesture handling
    const lastAngleRef = useRef<number | undefined>(undefined);
    const availableAtDragStartRef = useRef<number>(0);

    // Log when remainingUncategorized changes
    useEffect(() => {
      console.log(`[${category}] 📥 Received remainingUncategorized:`, {
        remainingUncategorized,
        currentAmount: amount,
        timestamp: Date.now()
      });
    }, [remainingUncategorized, category, amount]);

    // Use drag amount if dragging, otherwise use committed amount
    const displayAmount = dragAmount ?? amount;
    const isSelected = displayAmount !== undefined && displayAmount > 0;

    // Memoize constants - increased size to prevent clipping
    const circleSize = 136; // Size to accommodate drag handle at all positions
    const strokeWidth = 3;
    const handleSize = 8;

    // Calculate radii to match CircularProgressRing
    const center = circleSize / 2; // 68
    const outerRadius = center - strokeWidth / 2; // 66.5
    const innerRadius = 47; // Slightly smaller than button radius to overlap and eliminate gap
    const dragHandleRadius = (outerRadius + innerRadius) / 2; // 56.75 - sits in middle of ring

    // Memoize colors from theme
    const trackColor = 'rgba(103, 80, 164, 0.4)';
    const progressColor = customProgressColor ?? '#6750A4';
    const handleColor = customHandleColor ?? theme.colors.secondary; // Use custom or theme color
    const handleStrokeColor = customHandleStrokeColor ?? theme.colors.secondary; // Use custom or theme color

    // Calculate progress (0 to 1)
    const progress = useMemo(() => {
      if (!isSelected || !displayAmount) return 0;
      const total = Math.abs(transactionAmount);
      return total > 0 ? displayAmount / total : 0;
    }, [isSelected, displayAmount, transactionAmount]);

    // Calculate angle (0 to 360)
    const angle = useMemo(() => {
      return progress * 360;
    }, [progress]);

    /**
     * Calculate angle from touch coordinates
     */
    const calculateAngleFromTouch = useCallback(
      (touchX: number, touchY: number): number => {
        const centerX = circleSize / 2;
        const centerY = circleSize / 2;
        const deltaX = touchX - centerX;
        const deltaY = touchY - centerY;
        let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
        angle = angle + 90;
        if (angle < 0) angle += 360;
        return angle;
      },
      [circleSize]
    );

    /**
     * Pan gesture for circular dragging
     */
    const gesture = Gesture.Pan()
      .minDistance(5) // Small threshold to prevent accidental drags from taps
      .onStart(() => {
        // Calculate max available: current amount + remaining uncategorized
        // (freeing up current amount adds to remaining, so we can use both)
        availableAtDragStartRef.current = (amount ?? 0) + remainingUncategorized;
        console.log(`[${category}] 🎯 DRAG START:`, {
          currentAmount: amount,
          startAngle: angle,
          remainingUncategorized: remainingUncategorized,
          maxAvailable: availableAtDragStartRef.current,
          timestamp: Date.now()
        });
        lastAngleRef.current = undefined; // Let first touch set the angle naturally
        setDragAmount(amount ?? 0);
      })
      .onUpdate((event) => {
        let newAngle = calculateAngleFromTouch(event.x, event.y);
        const isFirstTouch = lastAngleRef.current === undefined;

        // Handle angle wrapping (prevent jumps from 359° to 0°)
        const lastAngle = lastAngleRef.current;
        if (lastAngle !== undefined) {
          const angleDelta = newAngle - lastAngle;
          if (angleDelta < -180) {
            console.log(`[${category}] ⚠️ Angle wrap: ${newAngle}° -> 360° (delta: ${angleDelta})`);
            newAngle = 360; // Snap to max
          } else if (angleDelta > 180) {
            console.log(`[${category}] ⚠️ Angle wrap: ${newAngle}° -> 0° (delta: ${angleDelta})`);
            newAngle = 0; // Snap to min
          }
        } else {
          // First touch - check if touching close to current handle position
          const currentAngle = angle; // Where the handle currently is
          const touchDelta = Math.abs(newAngle - currentAngle);
          const normalizedDelta = touchDelta > 180 ? 360 - touchDelta : touchDelta;

          console.log(`[${category}] 👆 FIRST TOUCH: angle=${newAngle.toFixed(1)}° (vs stored angle=${currentAngle.toFixed(1)}°) delta=${normalizedDelta.toFixed(1)}°`);

          // If touching within 30° of current handle, treat as "grabbing the handle" - no jump
          if (normalizedDelta < 30) {
            console.log(`[${category}] ✋ Close to handle - no jump`);
            newAngle = currentAngle; // Start from current position
          } else {
            console.log(`[${category}] 🎯 Far from handle - repositioning`);
          }
        }

        lastAngleRef.current = newAngle;

        // Use CACHED available amount - no recalculation every frame!
        const availableForThisCategory = availableAtDragStartRef.current;
        const totalTransaction = Math.abs(transactionAmount);

        // Calculate the max angle this category can reach based on available amount
        // This prevents dragging beyond what's visually represented
        const maxAngleForAvailable = (availableForThisCategory / totalTransaction) * 360;

        // Cap the angle to max available
        const cappedAngle = Math.min(newAngle, maxAngleForAvailable);

        // Calculate amount based on the TRANSACTION total (not available)
        // This keeps the visual and the amount in sync
        let newAmount: number;
        if (cappedAngle >= maxAngleForAvailable - 10) {
          // Snap to max when close
          newAmount = availableForThisCategory;
        } else {
          const percentage = cappedAngle / 360;
          newAmount = Math.round(percentage * totalTransaction);
        }

        setDragAmount(newAmount);
      })
      .onEnd(() => {
        // Commit the final amount to parent
        // Amount of 0 will automatically deselect (remove from array)
        // Amount > 0 will add/update the category
        console.log(`[${category}] ✅ DRAG END:`, {
          startAmount: amount,
          finalAmount: dragAmount,
          timestamp: Date.now()
        });
        if (dragAmount !== null) {
          onAmountChange(category, dragAmount);
        }
        setDragAmount(null);
      })
      .runOnJS(true);

    return (
      <View style={styles.container}>
        <GestureDetector gesture={gesture}>
          <View style={styles.circleContainer}>
            {/* Progress ring */}
            <CircularProgressRing
              size={circleSize}
              strokeWidth={strokeWidth}
              progress={progress}
              trackColor={trackColor}
              progressColor={progressColor}
              innerRadius={innerRadius}
            />

            {/* Center button */}
            <TouchableOpacity
              style={[
                styles.centerButton,
                { backgroundColor: theme.colors.surface },
                isSelected && styles.centerButtonSelected,
              ]}
              onPress={() => {
                console.log(`[${category}] Center button clicked - resetting to 0`);
                onAmountChange(category, 0);
              }} // Set to 0 to deselect
              activeOpacity={0.7}
            >
              <View style={styles.centerContent}>
                <Text style={styles.emoji}>{emoji}</Text>

                {/* Amount display */}
                {isSelected && displayAmount && (
                  editingCategory === category ? (
                    <RNTextInput
                      value={editAmountInput}
                      onChangeText={setEditAmountInput}
                      keyboardType="decimal-pad"
                      autoFocus
                      onBlur={onSaveEdit}
                      onSubmitEditing={onSaveEdit}
                      style={styles.amountInput}
                      placeholder="0.00"
                      selectTextOnFocus
                      placeholderTextColor="rgba(103, 80, 164, 0.4)"
                    />
                  ) : (
                    <TouchableOpacity
                      onPress={() => onStartEdit(category, displayAmount)}
                      activeOpacity={0.7}
                      style={styles.amountTouchable}
                    >
                      <Text style={styles.amount}>
                        {formatAmount(
                          transactionAmount < 0 ? -displayAmount : displayAmount,
                          transactionCurrency
                        ).replace(/[+\-]/, '')}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            </TouchableOpacity>

            {/* Drag handle - always visible, sits on outer edge */}
            <CircularDragHandle
              size={circleSize}
              radius={dragHandleRadius}
              angle={angle}
              handleSize={handleSize}
              handleColor={handleColor}
              handleStrokeColor={handleStrokeColor}
              handleStrokeWidth={strokeWidth}
            />
          </View>
        </GestureDetector>

        {/* Category label */}
        <Text variant="bodySmall" style={styles.label}>
          {category}
        </Text>
      </View>
    );
  },
  (prevProps, nextProps) => {
    // Smart comparison: only re-render if these specific props changed
    // We DO check remainingUncategorized - otherwise the gesture handler will have
    // a stale closure with the old value!
    return (
      prevProps.amount === nextProps.amount &&
      prevProps.editingCategory === nextProps.editingCategory &&
      prevProps.editAmountInput === nextProps.editAmountInput &&
      prevProps.category === nextProps.category &&
      prevProps.remainingUncategorized === nextProps.remainingUncategorized
    );
  }
);

CategoryCircle.displayName = 'CategoryCircle';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    overflow: 'visible',
  },
  circleContainer: {
    position: 'relative',
    width: 136, // Increased to prevent clipping the handle at all positions
    height: 136,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  centerButtonSelected: {
    borderWidth: 3,
    borderColor: 'rgba(103, 80, 164, 0.9)',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 28,
    marginBottom: 2,
  },
  amountTouchable: {
    alignItems: 'center',
  },
  amount: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(103, 80, 164, 1)',
    textAlign: 'center',
  },
  amountInput: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(103, 80, 164, 1)',
    textAlign: 'center',
    backgroundColor: 'rgba(103, 80, 164, 0.15)',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(103, 80, 164, 0.4)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 45,
    height: 16,
  },
  label: {
    marginTop: 4,
    textAlign: 'center',
    fontSize: 10,
    maxWidth: 80,
  },
});
