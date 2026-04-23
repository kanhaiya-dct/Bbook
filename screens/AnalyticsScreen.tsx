import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { useStore } from '../store/useStore';
import { PieChart } from 'react-native-gifted-charts';
import { Card } from '../components/Card';

const { width } = Dimensions.get('window');

export const AnalyticsScreen = () => {
  const { transactions } = useStore();

  const categoryData = useMemo(() => {
    const expenses = transactions.filter((t) => t.type === 'expense');
    const categories: Record<string, number> = {};
    let total = 0;

    expenses.forEach((t) => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
      total += t.amount;
    });

    const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#f43f5e', '#64748b'];

    return Object.entries(categories).map(([name, value], index) => ({
      name,
      value,
      percentage: total > 0 ? (value / total) * 100 : 0,
      color: colors[index % colors.length],
      text: `${Math.round((value / total) * 100)}%`,
    })).sort((a, b) => b.value - a.value);
  }, [transactions]);

  const pieData = categoryData.map(c => ({
    value: c.value,
    color: c.color,
    text: c.text,
  }));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Expense Analytics</Text>

      <Card style={styles.chartCard}>
        <View style={styles.pieContainer}>
          {pieData.length > 0 ? (
            <PieChart
              data={pieData}
              donut
              showGradient
              sectionAutoFocus
              radius={width * 0.25}
              innerRadius={width * 0.15}
              innerCircleColor={Colors.white}
              centerLabelComponent={() => (
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 22, fontWeight: 'bold', color: Colors.text }}>
                    ₹{categoryData.reduce((acc, curr) => acc + curr.value, 0).toLocaleString()}
                  </Text>
                  <Text style={{ fontSize: 12, color: Colors.textLight }}>Total Spent</Text>
                </View>
              )}
            />
          ) : (
            <View style={styles.noData}>
              <Text style={styles.noDataText}>No expense data available</Text>
            </View>
          )}
        </View>

        <View style={styles.legendContainer}>
          {categoryData.map((item) => (
            <View key={item.name} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: item.color }]} />
              <Text style={styles.legendName}>{item.name}</Text>
              <Text style={styles.legendValue}>₹{item.value.toFixed(0)}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Text style={styles.sectionTitle}>Category Breakdown</Text>
      {categoryData.map((item) => (
        <Card key={item.name} style={styles.categoryCard}>
          <View style={styles.categoryInfo}>
            <View style={styles.categoryTitleRow}>
              <View style={[styles.dot, { backgroundColor: item.color }]} />
              <Text style={styles.categoryName}>{item.name}</Text>
            </View>
            <Text style={styles.categoryAmount}>₹{item.value.toLocaleString()}</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View 
              style={[
                styles.progressBarFill, 
                { width: `${item.percentage}%`, backgroundColor: item.color }
              ]} 
            />
          </View>
        </Card>
      ))}
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
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  chartCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  pieContainer: {
    marginVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noData: {
    height: 150,
    justifyContent: 'center',
  },
  noDataText: {
    color: Colors.textLight,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: Spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendName: {
    fontSize: 12,
    color: Colors.text,
    marginRight: 4,
  },
  legendValue: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textLight,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  categoryCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  categoryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  categoryAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
});
