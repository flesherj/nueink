import { useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput as RNTextInput,
  Animated,
} from 'react-native';
import { Text, Avatar, IconButton, useTheme } from 'react-native-paper';
import Slider from '@react-native-community/slider';
import Svg, { Circle, Path } from 'react-native-svg';
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import {
  CATEGORY_METADATA,
  getAllGroups,
  getCategoriesByGroup,
  getCategoryMetadata,
  type TransactionCategory,
} from '@nueink/core';

interface RadialCategoryPickerProps {
  selectedCategories: Array<{ category: string; amount: number }>;
  onCategorySelect: (category: string) => void;
  onAmountChange: (category: string, amount: number) => void;
  onClearAll?: () => void;
  getUncategorizedAmount: () => number;
  transactionAmount: number;
  transactionCurrency: string;
  formatAmount: (amount: number, currency: string) => string;
}

interface CategoryCircleProps {
  category: string;
  emoji: string;
  amount: number | undefined;
  selectedCategories: Array<{ category: string; amount: number }>;
  transactionAmount: number;
  transactionCurrency: string;
  onCategorySelect: (category: string) => void;
  onAmountChange: (category: string, amount: number) => void;
  formatAmount: (amount: number, currency: string) => string;
  position: { x: number; y: number };
  animatedStyle: any;
  editingCategory: string | null;
  editAmountInput: string;
  onStartEdit: (category: string, amount: number) => void;
  onSaveEdit: () => void;
  setEditAmountInput: (value: string) => void;
}

/**
 * Individual category circle component
 * Uses local drag state to avoid re-rendering parent during drag
 */
const CategoryCircle: React.FC<CategoryCircleProps> = ({
  category,
  emoji,
  amount,
  selectedCategories,
  transactionAmount,
  transactionCurrency,
  onCategorySelect,
  onAmountChange,
  formatAmount,
  position,
  animatedStyle,
  editingCategory,
  editAmountInput,
  onStartEdit,
  onSaveEdit,
  setEditAmountInput,
}) => {
  const theme = useTheme();

  // Local state for drag amount (updates without re-rendering parent!)
  const [dragAmount, setDragAmount] = useState<number | null>(null);

  // Use drag amount if dragging, otherwise use committed amount
  const displayAmount = dragAmount ?? amount;

  const lastAngleRef = useRef<number | undefined>(undefined);
  const isSelectedRef = useRef(displayAmount !== undefined && displayAmount > 0);

  // Helper functions
  const polarToCartesian = (
    centerX: number,
    centerY: number,
    radius: number,
    angleInDegrees: number
  ) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const calculateAngleFromTouch = (touchX: number, touchY: number, centerX: number, centerY: number): number => {
    const deltaX = touchX - centerX;
    const deltaY = touchY - centerY;
    let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    angle = angle + 90;
    if (angle < 0) angle += 360;
    return angle;
  };

  const createArcPath = (
    centerX: number,
    centerY: number,
    radius: number,
    startAngle: number,
    endAngle: number
  ): string => {
    const start = polarToCartesian(centerX, centerY, radius, endAngle);
    const end = polarToCartesian(centerX, centerY, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return [
      'M', start.x, start.y,
      'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(' ');
  };

  // Create gesture - updates local state only, commits on end
  const gesture = Gesture.Pan()
    .minDistance(0)
    .onStart(() => {
      lastAngleRef.current = undefined;
      isSelectedRef.current = amount !== undefined && amount > 0;
      // Initialize drag with current amount (or 0 if not selected)
      setDragAmount(amount ?? 0);
    })
    .onUpdate((event) => {
      let angle = calculateAngleFromTouch(event.x, event.y, 50, 50);

      const lastAngle = lastAngleRef.current;
      if (lastAngle !== undefined) {
        const angleDelta = angle - lastAngle;
        if (angleDelta < -180) {
          angle = 360;
        } else if (angleDelta > 180) {
          angle = 0;
        }
      }

      lastAngleRef.current = angle;

      // Calculate available using current selectedCategories (from closure)
      const otherCategoriesTotal = selectedCategories
        .filter(c => c.category !== category)
        .reduce((sum, c) => sum + c.amount, 0);

      const totalTransaction = Math.abs(transactionAmount);
      const availableForThisCategory = totalTransaction - otherCategoriesTotal;
      const percentage = angle / 360;
      const newAmount = Math.round(percentage * availableForThisCategory);

      // Update local state only - no parent re-render!
      setDragAmount(newAmount);

      // Handle selection/deselection
      if (newAmount <= 100) {
        if (isSelectedRef.current) {
          isSelectedRef.current = false;
        }
      } else {
        if (!isSelectedRef.current) {
          isSelectedRef.current = true;
        }
      }
    })
    .onEnd(() => {
      // Commit the final amount to parent (single re-render)
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
      // Clear drag state
      setDragAmount(null);
    })
    .runOnJS(true);

  const isSelected = displayAmount !== undefined && displayAmount > 0;
  const currentAngle = isSelected ? (displayAmount / Math.abs(transactionAmount)) * 360 : 0;
  const handlePos = polarToCartesian(50, 50, 42, currentAngle);

  return (
    <Animated.View style={[styles.radialButton, animatedStyle]}>
      <GestureDetector gesture={gesture}>
        <View style={styles.categoryCircleContainer}>
          <Svg width={100} height={100} style={styles.circularProgressSvg}>
            <Circle
              cx={50}
              cy={50}
              r={42}
              stroke="rgba(103, 80, 164, 0.4)"
              strokeWidth={3}
              fill="none"
            />
            {isSelected && displayAmount > 0 && (
              <Path
                d={createArcPath(50, 50, 42, 0, currentAngle)}
                stroke="#6750A4"
                strokeWidth={3}
                fill="none"
                strokeLinecap="round"
              />
            )}
          </Svg>

          <TouchableOpacity
            style={[
              styles.categoryRadialButton,
              { backgroundColor: theme.colors.surface },
              isSelected && styles.categoryButtonSelected,
            ]}
            onPress={() => onCategorySelect(category)}
            activeOpacity={0.7}
          >
            <Text style={styles.categoryEmojiSmall}>{emoji}</Text>

            {isSelected && displayAmount && (
              editingCategory === category ? (
                <RNTextInput
                  value={editAmountInput}
                  onChangeText={setEditAmountInput}
                  keyboardType="decimal-pad"
                  autoFocus
                  onBlur={onSaveEdit}
                  onSubmitEditing={onSaveEdit}
                  style={styles.circularAmountInput}
                  placeholder="0.00"
                  selectTextOnFocus
                  placeholderTextColor="rgba(103, 80, 164, 0.4)"
                />
              ) : (
                <TouchableOpacity
                  onPress={() => onStartEdit(category, displayAmount)}
                  activeOpacity={0.7}
                  style={styles.circularAmountTouchable}
                >
                  <Text style={styles.circularAmount}>
                    {formatAmount(
                      transactionAmount < 0 ? -displayAmount : displayAmount,
                      transactionCurrency
                    ).replace(/[+\-]/, '')}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </TouchableOpacity>

          <Svg
            width={100}
            height={100}
            style={styles.circularProgressSvg}
            pointerEvents="none"
          >
            <Circle
              cx={handlePos.x}
              cy={handlePos.y}
              r={8}
              fill="#6750A4"
              stroke="#FFFFFF"
              strokeWidth={3}
            />
          </Svg>
        </View>
      </GestureDetector>
      <Text variant="bodySmall" style={styles.radialCategoryLabel}>
        {category.split(': ')[1] || category}
      </Text>
    </Animated.View>
  );
};

/**
 * Radial Category Picker
 *
 * Two-step category selection with radial expansion:
 * 1. Show category groups (Housing, Food, Transportation, etc.)
 * 2. Tap group → categories radiate outward in a circle
 * 3. Tap category → collapse and show with slider
 */
export const RadialCategoryPicker: React.FC<RadialCategoryPickerProps> = ({
  selectedCategories,
  onCategorySelect,
  onAmountChange,
  onClearAll,
  getUncategorizedAmount,
  transactionAmount,
  transactionCurrency,
  formatAmount,
}) => {
  const theme = useTheme();
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [groupButtonLayout, setGroupButtonLayout] = useState<{ x: number; y: number } | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editAmountInput, setEditAmountInput] = useState('');
  const radialAnimValue = useRef(new Animated.Value(0)).current;

  // Double-tap detection
  const lastTapRef = useRef<{ category: string; time: number } | null>(null);
  const DOUBLE_TAP_DELAY = 300; // milliseconds

  const categoryGroups = getAllGroups().filter(group => group !== 'Other');

  /**
   * Handle group button tap - expand/collapse radial menu or directly select single-item groups
   */
  const handleGroupTap = useCallback((groupName: string) => {
    const categories = getCategoriesByGroup(groupName);

    // If group has only 1 category, select it directly (skip radial expansion)
    if (categories.length === 1) {
      onCategorySelect(categories[0].category);
      return;
    }

    if (expandedGroup === groupName) {
      // Collapse
      Animated.timing(radialAnimValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setExpandedGroup(null);
      });
    } else {
      // Expand
      setExpandedGroup(groupName);
      Animated.spring(radialAnimValue, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  }, [expandedGroup, radialAnimValue, onCategorySelect]);

  /**
   * Calculate radial position for category buttons around a center point
   */
  const calculateRadialPosition = useCallback((index: number, total: number, radius: number) => {
    // Start from top (-90 degrees) and distribute evenly in a circle
    const startAngle = -Math.PI / 2;
    const angleStep = (2 * Math.PI) / total;
    const angle = startAngle + (angleStep * index);

    return {
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
    };
  }, []);

  /**
   * Handle category selection with double-tap detection
   * Single tap: Toggle selection
   * Double tap: Fill to uncategorized amount
   */
  const handleCategorySelect = useCallback((category: string) => {
    const now = Date.now();
    const lastTap = lastTapRef.current;

    // Check for double-tap
    if (
      lastTap &&
      lastTap.category === category &&
      now - lastTap.time < DOUBLE_TAP_DELAY
    ) {
      console.log('Double-tap detected! Filling category:', category);
      // Double-tap: Fill to uncategorized amount
      const uncategorized = getUncategorizedAmount();
      const selectedCategory = selectedCategories.find((c) => c.category === category);

      if (selectedCategory) {
        // Category already selected, fill to max (current + uncategorized)
        const newAmount = selectedCategory.amount + uncategorized;
        onAmountChange(category, newAmount);
      } else {
        // Category not selected yet, select and fill to full uncategorized
        onCategorySelect(category);
        // Need to wait for next render to update amount, use setTimeout
        setTimeout(() => {
          onAmountChange(category, uncategorized);
        }, 0);
      }

      // Reset last tap
      lastTapRef.current = null;
    } else {
      // Single tap: Toggle selection
      onCategorySelect(category);
      // Record this tap for double-tap detection
      lastTapRef.current = { category, time: now };
    }
  }, [onCategorySelect, onAmountChange, getUncategorizedAmount, selectedCategories]);

  /**
   * Start editing amount for a category
   */
  const handleStartEditAmount = useCallback((category: string, amount: number) => {
    setEditingCategory(category);
    setEditAmountInput((amount / 100).toFixed(2));
  }, []);

  /**
   * Save edited amount
   */
  const handleSaveEditAmount = useCallback(() => {
    if (!editingCategory) return;

    const dollarValue = parseFloat(editAmountInput);
    if (!isNaN(dollarValue) && dollarValue >= 0) {
      const centsValue = Math.round(dollarValue * 100);
      onAmountChange(editingCategory, centsValue);
    }

    setEditingCategory(null);
    setEditAmountInput('');
  }, [editingCategory, editAmountInput, onAmountChange]);

  // Get categories for expanded group
  const expandedCategories = expandedGroup ? getCategoriesByGroup(expandedGroup) : [];
  const baseRadius = 120; // Base radius for unselected categories
  const selectedRadius = 145; // Slightly larger radius for selected categories with sliders

  // Calculate uncategorized percentage for progress bar
  const uncategorizedAmount = getUncategorizedAmount();
  const totalAmount = Math.abs(transactionAmount);
  const uncategorizedPercentage = totalAmount > 0 ? (uncategorizedAmount / totalAmount) * 100 : 0;

  // Calculate allocation percentage for each group
  const getGroupAllocationPercentage = (groupName: string): number => {
    const groupCategories = getCategoriesByGroup(groupName);
    const groupTotal = selectedCategories
      .filter((sel) => groupCategories.some((cat) => cat.category === sel.category))
      .reduce((sum, sel) => sum + sel.amount, 0);
    return totalAmount > 0 ? (groupTotal / totalAmount) * 100 : 0;
  };

  return (
    <View style={styles.container}>
      {/* Top Progress Bar - Uncategorized Amount */}
      <TouchableOpacity
        onPress={onClearAll}
        disabled={selectedCategories.length === 0}
        activeOpacity={0.7}
        style={styles.progressBarContainer}
      >
        <View style={styles.progressBarHeader}>
          <Text variant="bodySmall" style={styles.progressBarLabel}>
            Uncategorized
          </Text>
          <Text variant="bodySmall" style={styles.progressBarAmount}>
            {formatAmount(uncategorizedAmount, transactionCurrency)}
          </Text>
        </View>
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${uncategorizedPercentage}%` }
            ]}
          />
        </View>
        {selectedCategories.length > 0 && (
          <Text variant="bodySmall" style={styles.progressBarHint}>
            Tap to clear all allocations
          </Text>
        )}
      </TouchableOpacity>

      {/* Category Selection Area - Group Grid or Radial Expansion */}
      <View style={styles.selectionArea}>
        {!expandedGroup ? (
          // Show category groups in a grid
          <View style={styles.groupGrid}>
            {categoryGroups.map((groupName) => {
              const firstCategoryInGroup = getCategoriesByGroup(groupName)[0];
              const groupCategories = getCategoriesByGroup(groupName);
              const selectedInGroup = selectedCategories.filter(
                (sel) => groupCategories.some((cat) => cat.category === sel.category)
              );
              const hasSelections = selectedInGroup.length > 0;

              // Calculate allocation percentage for this group
              const allocationPercentage = getGroupAllocationPercentage(groupName);

              return (
                <View key={groupName} style={styles.groupButtonContainer}>
                  {/* Circular progress ring */}
                  {allocationPercentage > 0 && (
                    <View style={styles.progressRingContainer}>
                      <View
                        style={[
                          styles.progressRing,
                          {
                            borderColor: 'rgba(103, 80, 164, 0.3)',
                            borderTopColor: allocationPercentage >= 12.5 ? 'rgba(103, 80, 164, 0.9)' : 'rgba(103, 80, 164, 0.3)',
                            borderRightColor: allocationPercentage >= 37.5 ? 'rgba(103, 80, 164, 0.9)' : 'rgba(103, 80, 164, 0.3)',
                            borderBottomColor: allocationPercentage >= 62.5 ? 'rgba(103, 80, 164, 0.9)' : 'rgba(103, 80, 164, 0.3)',
                            borderLeftColor: allocationPercentage >= 87.5 ? 'rgba(103, 80, 164, 0.9)' : 'rgba(103, 80, 164, 0.3)',
                            transform: [{ rotate: `${(allocationPercentage * 3.6)}deg` }],
                          }
                        ]}
                      />
                    </View>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.groupButton,
                      { backgroundColor: theme.colors.surface },
                      hasSelections && styles.groupButtonWithSelections,
                    ]}
                    onPress={() => handleGroupTap(groupName)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.groupEmoji}>{firstCategoryInGroup?.emoji || '📁'}</Text>
                    <Text variant="bodySmall" style={styles.groupName}>
                      {groupName}
                    </Text>
                  </TouchableOpacity>

                  {/* Selection indicators - mini emojis around the border */}
                  {selectedInGroup.map((selected, index) => {
                    const categoryMeta = getCategoryMetadata(selected.category as any);
                    // Position indicators around the circle at different angles
                    const angle = (index * 360) / Math.max(selectedInGroup.length, 3);
                    const radian = (angle * Math.PI) / 180;
                    const distance = 48; // Distance from center (adjusted for 110px button)
                    const x = Math.cos(radian) * distance;
                    const y = Math.sin(radian) * distance;

                    return (
                      <View
                        key={selected.category}
                        style={[
                          styles.selectionIndicator,
                          { transform: [{ translateX: x }, { translateY: y }] },
                        ]}
                      >
                        <Text style={styles.selectionIndicatorEmoji}>{categoryMeta.emoji}</Text>
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        ) : (
          // Radial expansion: categories in a circle
          <View style={styles.radialContainer}>
            {/* Center group button (what was tapped) */}
            <View style={styles.centerButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.centerGroupButton,
                  { backgroundColor: theme.colors.surface }
                ]}
                onPress={() => handleGroupTap(expandedGroup)}
                activeOpacity={0.7}
              >
                <Text style={styles.groupEmoji}>
                  {getCategoriesByGroup(expandedGroup)[0]?.emoji || '📁'}
                </Text>
                <Text variant="bodySmall" style={styles.groupName}>
                  {expandedGroup}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Radial category buttons */}
            {expandedCategories.map((categoryMeta, index) => {
              const selectedCategory = selectedCategories.find(
                (c) => c.category === categoryMeta.category
              );
              const isSelected = !!selectedCategory;

              // Use larger radius for selected categories to prevent overlap
              const effectiveRadius = isSelected ? selectedRadius : baseRadius;
              const position = calculateRadialPosition(index, expandedCategories.length, effectiveRadius);

              // Animated position
              const animatedStyle = {
                transform: [
                  {
                    translateX: radialAnimValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, position.x],
                    }),
                  },
                  {
                    translateY: radialAnimValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, position.y],
                    }),
                  },
                  {
                    scale: radialAnimValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 1],
                    }),
                  },
                ],
                opacity: radialAnimValue,
              };

              return (
                <CategoryCircle
                  key={categoryMeta.category}
                  category={categoryMeta.category}
                  emoji={categoryMeta.emoji}
                  amount={selectedCategory?.amount}
                  selectedCategories={selectedCategories}
                  transactionAmount={transactionAmount}
                  transactionCurrency={transactionCurrency}
                  onCategorySelect={handleCategorySelect}
                  onAmountChange={onAmountChange}
                  formatAmount={formatAmount}
                  position={position}
                  animatedStyle={animatedStyle}
                  editingCategory={editingCategory}
                  editAmountInput={editAmountInput}
                  onStartEdit={handleStartEditAmount}
                  onSaveEdit={handleSaveEditAmount}
                  setEditAmountInput={setEditAmountInput}
                />
              );
            })}
          </View>
        )}
      </View>


      {/* Remove old selected categories section */}
      {false && selectedCategories.length > 0 && (
        <View style={styles.selectedCategoriesSection}>
          <View style={styles.selectedCategoriesHeader}>
            <Text variant="titleSmall" style={styles.selectedCategoriesTitle}>
              Selected Categories
            </Text>
            <Text variant="bodySmall" style={styles.uncategorizedAmount}>
              Uncategorized: {formatAmount(getUncategorizedAmount(), transactionCurrency)}
            </Text>
          </View>

          {selectedCategories.map((selected) => {
            const categoryMeta = getCategoryMetadata(selected.category as any);

            return (
              <View key={selected.category} style={styles.selectedCategoryCard}>
                <View style={styles.selectedCategoryHeader}>
                  <View style={styles.selectedCategoryInfo}>
                    <Text style={styles.selectedCategoryEmoji}>{categoryMeta.emoji}</Text>
                    <Text variant="bodyMedium" style={styles.selectedCategoryName}>
                      {categoryMeta.category.split(': ')[1] || categoryMeta.category}
                    </Text>
                  </View>

                  {/* Editable amount */}
                  {editingCategory === selected.category ? (
                    <View style={styles.categoryAmountInputContainer}>
                      <RNTextInput
                        value={editAmountInput}
                        onChangeText={setEditAmountInput}
                        keyboardType="decimal-pad"
                        autoFocus
                        onBlur={handleSaveEditAmount}
                        onSubmitEditing={handleSaveEditAmount}
                        style={styles.categoryAmountInput}
                        placeholder="0.00"
                        selectTextOnFocus
                        placeholderTextColor="rgba(103, 80, 164, 0.4)"
                      />
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => handleStartEditAmount(selected.category, selected.amount)}
                      activeOpacity={0.7}
                    >
                      <Text variant="titleSmall" style={styles.selectedCategoryAmount}>
                        {formatAmount(
                          transactionAmount < 0 ? -selected.amount : selected.amount,
                          transactionCurrency
                        )}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Slider */}
                <View style={styles.categorySliderContainer}>
                  <Slider
                    style={styles.categorySlider}
                    minimumValue={0}
                    maximumValue={(selected.amount + getUncategorizedAmount()) / 100}
                    step={0.01}
                    value={selected.amount / 100}
                    onValueChange={(value) => {
                      const centsValue = Math.round(value * 100);
                      const currentUncategorized = getUncategorizedAmount();
                      const maxAllowed = selected.amount + currentUncategorized;
                      const clampedValue = Math.min(centsValue, maxAllowed);
                      onAmountChange(selected.category, clampedValue);
                    }}
                    minimumTrackTintColor="rgba(103, 80, 164, 0.9)"
                    maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
                    thumbTintColor="rgba(103, 80, 164, 1)"
                  />
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Progress bar styles
  progressBarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(103, 80, 164, 0.05)',
    borderRadius: 12,
    marginHorizontal: 8,
  },
  progressBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBarLabel: {
    fontWeight: '600',
    opacity: 0.7,
  },
  progressBarAmount: {
    fontWeight: '700',
    color: 'rgba(103, 80, 164, 1)',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: 'rgba(103, 80, 164, 0.9)',
    borderRadius: 4,
  },
  progressBarHint: {
    marginTop: 6,
    textAlign: 'center',
    opacity: 0.5,
    fontSize: 10,
  },
  // Progress ring styles
  progressRingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    pointerEvents: 'none', // Allow touches to pass through to button below
  },
  progressRing: {
    width: 118,
    height: 118,
    borderRadius: 59,
    borderWidth: 4,
    borderColor: 'rgba(103, 80, 164, 0.3)',
  },
  selectionArea: {
    minHeight: 400,
  },
  groupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 16,
  },
  groupButtonContainer: {
    position: 'relative',
    width: 110,
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupButton: {
    width: 110,
    height: 110,
    borderRadius: 55, // Perfect circle
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  groupButtonWithSelections: {
    borderWidth: 2,
    borderColor: 'rgba(103, 80, 164, 0.5)',
  },
  selectionIndicator: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(103, 80, 164, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  selectionIndicatorEmoji: {
    fontSize: 14,
  },
  groupEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  groupName: {
    textAlign: 'center',
    fontWeight: '500',
    fontSize: 11,
  },
  // Radial menu styles
  radialContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 500, // Increased to accommodate larger radius for selected items
  },
  centerButtonContainer: {
    position: 'absolute',
    zIndex: 10,
  },
  centerGroupButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  radialButton: {
    position: 'absolute',
    alignItems: 'center',
    overflow: 'visible',
  },
  categoryRadialButton: {
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
  categoryButtonSelected: {
    borderWidth: 3,
    borderColor: 'rgba(103, 80, 164, 0.9)',
  },
  categoryEmojiSmall: {
    fontSize: 28,
  },
  radialCategoryLabel: {
    marginTop: 4,
    textAlign: 'center',
    fontSize: 10,
    maxWidth: 80,
  },
  checkmarkSmall: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(103, 80, 164, 0.9)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Inline slider styles for radial menu
  radialSliderContainer: {
    marginTop: 8,
    width: 100,
    alignItems: 'center',
  },
  radialAmount: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(103, 80, 164, 1)',
    textAlign: 'center',
    marginBottom: 4,
  },
  radialAmountInput: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(103, 80, 164, 1)',
    textAlign: 'center',
    marginBottom: 4,
    minWidth: 60,
  },
  // Circular slider styles
  categoryCircleContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  circularProgressSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    pointerEvents: 'none', // Allow touches to pass through to gesture detector
  },
  circularAmount: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(103, 80, 164, 1)',
    textAlign: 'center',
    marginTop: 2,
  },
  circularAmountTouchable: {
    position: 'absolute',
    bottom: 4,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  circularAmountInput: {
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  categoryItemContainer: {
    width: '47%',
  },
  categoryItem: {
    borderRadius: 12,
    backgroundColor: 'rgba(103, 80, 164, 0.1)',
    overflow: 'hidden',
  },
  categoryItemSelected: {
    backgroundColor: 'rgba(103, 80, 164, 0.2)',
  },
  categoryButton: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  checkmark: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(103, 80, 164, 0.9)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryName: {
    textAlign: 'center',
    fontWeight: '500',
  },
  categoryAmount: {
    marginTop: 4,
    color: 'rgba(103, 80, 164, 1)',
    fontWeight: '600',
  },
  editableAmount: {
    textDecorationLine: 'underline',
  },
  categoryAmountInputContainer: {
    marginTop: 4,
  },
  categoryAmountInput: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(103, 80, 164, 1)',
    paddingVertical: 2,
  },
  categorySliderContainer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  categorySlider: {
    width: '100%',
    height: 40,
  },
  // Selected categories section styles
  selectedCategoriesSection: {
    marginTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  selectedCategoriesHeader: {
    marginBottom: 16,
  },
  selectedCategoriesTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  uncategorizedAmount: {
    opacity: 0.6,
  },
  selectedCategoryCard: {
    backgroundColor: 'rgba(103, 80, 164, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  selectedCategoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedCategoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedCategoryEmoji: {
    fontSize: 24,
  },
  selectedCategoryName: {
    fontWeight: '500',
  },
  selectedCategoryAmount: {
    fontWeight: '600',
    color: 'rgba(103, 80, 164, 1)',
  },
});
