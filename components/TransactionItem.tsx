import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, BorderRadius, Spacing, Shadows } from '../constants/theme';
import { Transaction } from '../db/schema';
import { format } from 'date-fns';
import { ArrowUpRight, ArrowDownLeft, Trash2, Edit2 } from 'lucide-react-native';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { Swipeable } from 'react-native-gesture-handler';

interface TransactionItemProps {
  transaction: Transaction;
  onDelete?: (id: number) => void;
  onEdit?: (transaction: Transaction) => void;
}

export const TransactionItem = ({ transaction, onDelete, onEdit }: TransactionItemProps) => {
  const isIncome = transaction.type === 'income';

  const renderRightActions = () => (
    <View style={styles.actionsContainer}>
      <TouchableOpacity
        style={[styles.actionButton, styles.editButton]}
        onPress={() => onEdit?.(transaction)}
      >
        <Edit2 size={20} color={Colors.white} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionButton, styles.deleteButton]}
        onPress={() => onDelete?.(transaction.id)}
      >
        <Trash2 size={20} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );

  return (
    <Animated.View entering={FadeInRight} exiting={FadeOutLeft}>
      <Swipeable renderRightActions={renderRightActions}>
        <View style={styles.container}>
          <View style={[styles.iconContainer, { backgroundColor: isIncome ? '#dcfce7' : '#fee2e2' }]}>
            {isIncome ? (
              <ArrowDownLeft size={24} color={Colors.income} />
            ) : (
              <ArrowUpRight size={24} color={Colors.expense} />
            )}
          </View>
          <View style={styles.content}>
            <Text style={styles.title} numberOfLines={1}>{transaction.title}</Text>
            <Text style={styles.category}>{transaction.category} • {format(new Date(transaction.date), 'MMM dd, yyyy')}</Text>
          </View>
          <View style={styles.amountContainer}>
            <Text style={[styles.amount, { color: isIncome ? Colors.income : Colors.expense }]}>
              {isIncome ? '+' : '-'}₹{Math.abs(transaction.amount).toFixed(2)}
            </Text>
          </View>
        </View>
      </Swipeable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    ...Shadows.small,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  category: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
  },
  actionsContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
    height: '100%',
  },
  actionButton: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  editButton: {
    backgroundColor: Colors.primary,
  },
  deleteButton: {
    backgroundColor: Colors.error,
    borderTopRightRadius: BorderRadius.md,
    borderBottomRightRadius: BorderRadius.md,
  },
});
