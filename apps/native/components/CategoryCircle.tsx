import { useState, useRef, useCallback, useMemo, memo } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput as RNTextInput } from 'react';
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
  onCategorySelect: (category: string) => void;
  onAmountChange: (category: string, amount: number) => void;
  formatAmount: (amount: number, currency: string) => string;
  getAvailableForCategory: (category: string) => number;
  editingCategory: string | null;
  editAmountInput: string;
  onStartEdit: (category: string, amount: number) => void;
  onSaveEdit: () => void;
  setEditAmountInput: (value: string) => void;
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
    onCategorySelect,
    onAmountChange,
    formatAmount,
    getAvailableForCategory,
    editingCategory,
    editAmountInput,
    onStartEdit,
    onSaveEdit,
    setEditAmountInput,
  }) => {
    const theme = useTheme();

    // Local drag state - updates without re-rendering parent
    const [dragAmount, setDragAmount] = useState<number | null>(null);

    // Refs for gesture handling
    const lastAngleRef = useRef<number | undefined>(undefined);
    const isSelectedRef = useRef(amount !== undefined && amount > 0);

    // Use drag amount if dragging, otherwise use committed amount
    const displayAmount = dragAmount ?? amount;
    const isSelected = displayAmount !== undefined && displayAmount > 0;

    // Memoize constants
    const circleSize = 100;
    const circleRadius = 42;
    const strokeWidth = 3;
    const handleSize = 8;

    // Memoize colors
    const trackColor = 'rgba(103, 80, 164, 0.4)';
    const progressColor = '#6750A4';
    const handleColor = '#6750A4';
    const handleStrokeColor = '#FFFFFF';

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
      .minDistance(0)
      .onStart(() => {
        lastAngleRef.current = undefined;
        isSelectedRef.current = amount !== undefined && amount > 0;
        setDragAmount(amount ?? 0);
      })
      .onUpdate((event) => {
        let newAngle = calculateAngleFromTouch(event.x, event.y);

        // Handle angle wrapping (prevent jumps from 359° to 0°)
        const lastAngle = lastAngleRef.current;
        if (lastAngle !== undefined) {
          const angleDelta = newAngle - lastAngle;
          if (angleDelta < -180) {
            newAngle = 360; // Snap to max
          } else if (angleDelta > 180) {
            newAngle = 0; // Snap to min
          }
        }

        lastAngleRef.current = newAngle;

        // Calculate new amount based on angle and available
        const availableForThisCategory = getAvailableForCategory(category);
        const totalTransaction = Math.abs(transactionAmount);

        // Snap to 100% when close to full circle
        let newAmount: number;
        if (newAngle > 350) {
          newAmount = availableForThisCategory;
        } else {
          const percentage = newAngle / 360;
          newAmount = Math.round(percentage * availableForThisCategory);
        }

        setDragAmount(newAmount);

        // Track selection state
        if (newAmount <= 100) {
          isSelectedRef.current = false;
        } else {
          isSelectedRef.current = true;
        }
      })
      .onEnd(() => {
        // Commit the final amount to parent
        if (dragAmount !== null) {
          if (dragAmount <= 100) {
            // Deselect if below threshold
            const wasSelected = amount !== undefined && amount > 0;
            if (wasSelected) {
              onCategorySelect(category);
            }
          } else {
            // Update or add category
            const wasSelected = amount !== undefined && amount > 0;
            if (!wasSelected) {
              onCategorySelect(category);
            }
            onAmountChange(category, dragAmount);
          }
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
            />

            {/* Center button */}
            <TouchableOpacity
              style={[
                styles.centerButton,
                { backgroundColor: theme.colors.surface },
                isSelected && styles.centerButtonSelected,
              ]}
              onPress={() => onCategorySelect(category)}
              activeOpacity={0.7}
            >
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
            </TouchableOpacity>

            {/* Drag handle */}
            {isSelected && (
              <CircularDragHandle
                size={circleSize}
                radius={circleRadius}
                angle={angle}
                handleSize={handleSize}
                handleColor={handleColor}
                handleStrokeColor={handleStrokeColor}
                handleStrokeWidth={strokeWidth}
              />
            )}
          </View>
        </GestureDetector>

        {/* Category label */}
        <Text variant="bodySmall" style={styles.label}>
          {category.split(': ')[1] || category}
        </Text>
      </View>
    );
  },
  (prevProps, nextProps) => {
    // Smart comparison: only re-render if necessary props changed
    return (
      prevProps.amount === nextProps.amount &&
      prevProps.editingCategory === nextProps.editingCategory &&
      prevProps.editAmountInput === nextProps.editAmountInput &&
      prevProps.category === nextProps.category
    );
  }
);

CategoryCircle.displayName = 'CategoryCircle';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    overflow: 'visible',
  },
  circleContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  centerButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  centerButtonSelected: {
    borderWidth: 3,
    borderColor: 'rgba(103, 80, 164, 0.9)',
  },
  emoji: {
    fontSize: 28,
  },
  amountTouchable: {
    position: 'absolute',
    bottom: 4,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  amount: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(103, 80, 164, 1)',
    textAlign: 'center',
    marginTop: 2,
  },
  amountInput: {
    position: 'absolute',
    bottom: 4,
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
