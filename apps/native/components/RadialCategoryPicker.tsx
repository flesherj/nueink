import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput as RNTextInput,
  Animated,
} from 'react-native';
import { Text, Avatar, IconButton, useTheme } from 'react-native-paper';
import {
  CATEGORY_METADATA,
  getAllGroups,
  getCategoriesByGroup,
  getCategoryMetadata,
  type TransactionCategory,
} from '@nueink/core';
import { CategoryCircle } from './CategoryCircle';
import { getCategoryColorScheme } from '../constants/categoryColors';

/**
 * Individual radial category button with animated label
 */
interface RadialCategoryButtonProps {
  categoryMeta: { category: string; emoji: string };
  isSelected: boolean;
  selectedAmount?: number;
  animatedStyle: any;
  transactionAmount: number;
  transactionCurrency: string;
  uncategorizedAmount: number;
  editingCategory: string | null;
  editAmountInput: string;
  onCategorySelect: (category: string) => void;
  onAmountChange: (category: string, amount: number) => void;
  formatAmount: (amount: number, currency: string) => string;
  handleStartEditAmount: (category: string, amount: number) => void;
  handleSaveEditAmount: () => void;
  setEditAmountInput: (value: string) => void;
  theme: any;
}

const RadialCategoryButton: React.FC<RadialCategoryButtonProps> = ({
  categoryMeta,
  isSelected,
  selectedAmount,
  animatedStyle,
  transactionAmount,
  transactionCurrency,
  uncategorizedAmount,
  editingCategory,
  editAmountInput,
  onCategorySelect,
  onAmountChange,
  formatAmount,
  handleStartEditAmount,
  handleSaveEditAmount,
  setEditAmountInput,
  theme,
}) => {
  // Get color scheme for this category
  const colors = getCategoryColorScheme(categoryMeta.category);

  return (
    <Animated.View style={[styles.radialButton, animatedStyle]}>
      {isSelected ? (
        <CategoryCircle
          category={categoryMeta.category}
          emoji={categoryMeta.emoji}
          amount={selectedAmount}
          transactionAmount={transactionAmount}
          transactionCurrency={transactionCurrency}
          remainingUncategorized={uncategorizedAmount}
          onAmountChange={onAmountChange}
          formatAmount={formatAmount}
          editingCategory={editingCategory}
          editAmountInput={editAmountInput}
          onStartEdit={handleStartEditAmount}
          onSaveEdit={handleSaveEditAmount}
          setEditAmountInput={setEditAmountInput}
          handleColor={colors.handleColor}
          handleStrokeColor={colors.handleStrokeColor}
          progressColor={colors.progressColor}
          showLabel={false}
        />
      ) : (
        <TouchableOpacity
          style={[
            styles.categoryRadialButton,
            { backgroundColor: theme.colors.surface },
          ]}
          onPress={() => onCategorySelect(categoryMeta.category)}
          activeOpacity={0.7}
        >
          <Text style={styles.categoryEmojiSmall}>{categoryMeta.emoji}</Text>
        </TouchableOpacity>
      )}

      {/* Label - only show when not selected */}
      {!isSelected && (
        <Text style={styles.radialCategoryLabel} numberOfLines={2}>
          {categoryMeta.category.split(': ')[1] || categoryMeta.category}
        </Text>
      )}
    </Animated.View>
  );
};

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

  const categoryGroups = getAllGroups().filter(group => group !== 'Other');

  /**
   * Handle group button tap - expand/collapse radial menu or directly select single-item groups
   */
  const handleGroupTap = useCallback((groupName: string) => {
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
   * Handle category selection - toggle selection without collapsing radial menu
   */
  const handleCategorySelect = useCallback((category: string) => {
    // Just toggle the selection, keep radial menu open
    onCategorySelect(category);
  }, [onCategorySelect]);

  /**
   * Start editing amount for a category
   */
  const handleStartEditAmount = useCallback((category: string, amount: number) => {
    setEditingCategory(category);
    // Empty string for $0 so user can type immediately, otherwise show current amount
    setEditAmountInput(amount > 0 ? (amount / 100).toFixed(2) : '');
  }, []);

  /**
   * Save edited amount
   */
  const handleSaveEditAmount = useCallback(() => {
    if (!editingCategory) return;

    const dollarValue = parseFloat(editAmountInput);
    if (!isNaN(dollarValue) && dollarValue >= 0) {
      const centsValue = Math.round(dollarValue * 100);

      // Calculate max allowed: current category amount + remaining uncategorized
      const currentCategory = selectedCategories.find(c => c.category === editingCategory);
      const currentAmount = currentCategory?.amount || 0;
      const maxAllowed = currentAmount + uncategorizedAmount;

      // Clamp to max allowed to prevent over-allocation
      const clampedValue = Math.min(centsValue, maxAllowed);

      onAmountChange(editingCategory, clampedValue);
    }

    setEditingCategory(null);
    setEditAmountInput('');
  }, [editingCategory, editAmountInput, onAmountChange, selectedCategories, uncategorizedAmount]);

  // Get categories for expanded group
  const expandedCategories = expandedGroup ? getCategoriesByGroup(expandedGroup) : [];
  const baseRadius = 150; // Radius for radial layout (increased to prevent overlap)

  // Calculate uncategorized amount (memoized to prevent recalculation)
  const uncategorizedAmount = useMemo(() => getUncategorizedAmount(), [
    selectedCategories,
    transactionAmount,
  ]);
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
                (sel) => sel.amount > 0 && groupCategories.some((cat) => cat.category === sel.category)
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

            {/* Radial category circles */}
            {expandedCategories.map((categoryMeta, index) => {
              const selectedCategory = selectedCategories.find(
                (c) => c.category === categoryMeta.category
              );
              const isSelected = !!selectedCategory;

              // Position calculation for radial layout
              const position = calculateRadialPosition(index, expandedCategories.length, baseRadius);

              // Animated position for radial expansion
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
                <RadialCategoryButton
                  key={categoryMeta.category}
                  categoryMeta={categoryMeta}
                  isSelected={isSelected}
                  selectedAmount={selectedCategory?.amount}
                  animatedStyle={animatedStyle}
                  transactionAmount={transactionAmount}
                  transactionCurrency={transactionCurrency}
                  uncategorizedAmount={uncategorizedAmount}
                  editingCategory={editingCategory}
                  editAmountInput={editAmountInput}
                  onCategorySelect={handleCategorySelect}
                  onAmountChange={onAmountChange}
                  formatAmount={formatAmount}
                  handleStartEditAmount={handleStartEditAmount}
                  handleSaveEditAmount={handleSaveEditAmount}
                  setEditAmountInput={setEditAmountInput}
                  theme={theme}
                />
              );
            })}
          </View>
        )}
      </View>


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
    gap: 12,
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
  categoryEmojiSmall: {
    fontSize: 28,
  },
  radialCategoryLabel: {
    marginTop: 4,
    textAlign: 'center',
    fontSize: 10,
    maxWidth: 80,
    color: '#FFFFFF',
    fontWeight: '600',
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
});
