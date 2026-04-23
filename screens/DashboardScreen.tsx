import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { useStore } from '../store/useStore';
import { Card } from '../components/Card';
import { TransactionItem } from '../components/TransactionItem';
import { EditTransactionModal } from '../components/EditTransactionModal';
import { LineChart } from 'react-native-gifted-charts';
import { Wallet, TrendingUp, TrendingDown, LayoutDashboard, ChevronRight } from 'lucide-react-native';
import { format, isSameDay } from 'date-fns';
import { useRouter } from 'expo-router';
import { Alert, TouchableOpacity } from 'react-native';
import { Transaction } from '../db/schema';
import { useState } from 'react';

const { width } = Dimensions.get('window');

export const DashboardScreen = () => {
  const { transactions, budgets, isLoading, fetchTransactions, fetchBudgets, deleteTransaction } = useStore();
  const router = useRouter();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const handleDelete = (id: number) => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteTransaction(id) },
      ]
    );
  };

  const handleEdit = (tx: Transaction) => {
    setSelectedTransaction(tx);
    setEditModalVisible(true);
  };

  useEffect(() => {
    fetchTransactions();
    fetchBudgets();
  }, []);

  const stats = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      balance: income - expense,
      income,
      expense,
    };
  }, [transactions]);

  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d;
    });

    return last7Days.map((date) => {
      const dayTransactions = transactions.filter((t) => isSameDay(new Date(t.date), date));
      const amount = dayTransactions.reduce((sum, t) => {
        return t.type === 'income' ? sum + t.amount : sum - t.amount;
      }, 0);
      return {
        value: Math.max(0, amount), // For demo, show positive scale
        label: format(date, 'dd'),
      };
    });
  }, [transactions]);

  const currentBudget = useMemo(() => {
    const month = new Date().toISOString().slice(0, 7);
    return budgets.find((b) => b.month === month)?.amount || 0;
  }, [budgets]);

  const budgetProgress = useMemo(() => {
    if (currentBudget === 0) return 0;
    return Math.min(stats.expense / currentBudget, 1);
  }, [stats.expense, currentBudget]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchTransactions} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.appName}>Bbook</Text>
          <Text style={styles.greeting}>Welcome back, 👋</Text>
        </View>
        <View style={styles.avatarPlaceholder}>
          <LayoutDashboard color={Colors.primary} size={24} />
        </View>
      </View>

      <Card style={styles.balanceCard} glass>
        <Text style={styles.balanceLabel}>Total Balance</Text>
        <Text style={styles.balanceValue}>₹{stats.balance.toLocaleString()}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: '#dcfce7' }]}>
              <TrendingUp size={20} color={Colors.income} />
            </View>
            <View>
              <Text style={styles.statLabel}>Income</Text>
              <Text style={styles.statValue}>+₹{stats.income.toLocaleString()}</Text>
            </View>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: '#fee2e2' }]}>
              <TrendingDown size={20} color={Colors.expense} />
            </View>
            <View>
              <Text style={styles.statLabel}>Expense</Text>
              <Text style={styles.statValue}>-₹{stats.expense.toLocaleString()}</Text>
            </View>
          </View>
        </View>
      </Card>

      {currentBudget > 0 && (
        <Card style={styles.budgetCard}>
          <View style={styles.budgetHeader}>
            <Text style={styles.budgetTitle}>Monthly Budget</Text>
            <Text style={styles.budgetAmount}>
              ₹{stats.expense.toLocaleString()} / ₹{currentBudget.toLocaleString()}
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View 
              style={[
                styles.progressBarFill, 
                { 
                  width: `${budgetProgress * 100}%`,
                  backgroundColor: budgetProgress > 0.9 ? Colors.error : Colors.primary
                }
              ]} 
            />
          </View>
          <Text style={styles.budgetText}>
            {budgetProgress >= 1 
              ? "You've exceeded your budget!" 
              : `${((1 - budgetProgress) * 100).toFixed(0)}% remaining`}
          </Text>
        </Card>
      )}

      <Text style={styles.sectionTitle}>Weekly Activity</Text>
      <Card style={styles.chartCard}>
        <LineChart
          data={chartData}
          width={width - 100}
          height={180}
          thickness={3}
          color={Colors.primary}
          hideDataPoints
          noOfSections={4}
          yAxisColor="transparent"
          xAxisColor={Colors.border}
          yAxisTextStyle={{ color: Colors.textLight, fontSize: 10 }}
          xAxisLabelTextStyle={{ color: Colors.textLight, fontSize: 10 }}
          curved
          areaChart
          startFillColor={Colors.primary}
          endFillColor={Colors.primary}
          startOpacity={0.4}
          endOpacity={0.1}
        />
      </Card>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={() => router.push('/(tabs)/transactions')}
        >
          <Text style={styles.viewAllText}>View All</Text>
          <ChevronRight size={16} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {transactions.slice(0, 6).map((tx) => (
        <TransactionItem 
          key={tx.id} 
          transaction={tx} 
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
      ))}

      {transactions.length === 0 && (
        <View style={styles.emptyState}>
          <Wallet size={48} color={Colors.border} />
          <Text style={styles.emptyText}>No transactions yet. Add one to get started!</Text>
        </View>
      )}

      <EditTransactionModal
        visible={editModalVisible}
        transaction={selectedTransaction}
        onClose={() => {
          setEditModalVisible(false);
          setSelectedTransaction(null);
        }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    marginTop: Spacing.md,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
  },
  appName: {
    fontSize: 14,
    color: Colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
    marginBottom: 2,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  balanceCard: {
    backgroundColor: Colors.primary,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  balanceLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontWeight: '500',
  },
  balanceValue: {
    color: Colors.white,
    fontSize: 36,
    fontWeight: '800',
    marginVertical: Spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  statValue: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.xs,
  },
  viewAllText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
    marginRight: 2,
  },
  chartCard: {
    padding: Spacing.md,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    marginTop: Spacing.lg,
  },
  emptyText: {
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  budgetCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  budgetTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  budgetAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 5,
    overflow: 'hidden',
    marginVertical: Spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  budgetText: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
});
