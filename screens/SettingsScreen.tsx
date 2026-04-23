import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Bell, Download, Info, Shield, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, Switch, Platform } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Colors, Spacing } from '../constants/theme';
import { useStore } from '../store/useStore';
import { requestNotificationPermissions, scheduleDailyReminder, cancelAllNotifications } from '../utils/notifications';

export const SettingsScreen = () => {
  const { resetData, transactions, budgets, setBudget, notificationsEnabled, setNotificationsEnabled } = useStore();
  const [budgetAmount, setBudgetAmount] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleReset = () => {
    Alert.alert(
      'Reset All Data',
      'Are you sure you want to delete all transactions and budgets? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: async () => await resetData() },
      ]
    );
  };

  const handleSetBudget = async () => {
    if (!budgetAmount || isNaN(Number(budgetAmount))) {
      Alert.alert('Invalid Amount', 'Please enter a valid number');
      return;
    }
    setIsSaving(true);
    const month = new Date().toISOString().slice(0, 7); // YYYY-MM
    await setBudget(month, parseFloat(budgetAmount));
    setIsSaving(false);
    Alert.alert('Success', 'Monthly budget updated successfully');
    setBudgetAmount('');
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      // Create CSV content
      const headers = ['ID', 'Title', 'Amount', 'Type', 'Category', 'Date', 'Notes'];
      const rows = transactions.map(t => [
        t.id,
        t.title.replace(/,/g, ''), // Basic sanitization
        t.amount,
        t.type,
        t.category,
        new Date(t.date).toLocaleDateString(),
        (t.notes || '').replace(/,/g, '')
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      const fileUri = FileSystem.documentDirectory + 'bbook_transactions.csv';

      await FileSystem.writeAsStringAsync(fileUri, csvContent);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Success', 'CSV exported to ' + fileUri);
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>

      <Text style={styles.sectionTitle}>Budget Management</Text>
      <Card style={styles.card}>
        <Input
          label="Set Monthly Budget (₹)"
          placeholder="e.g. 2000"
          keyboardType="numeric"
          value={budgetAmount}
          onChangeText={setBudgetAmount}
        />
        <Button
          title="Update Budget"
          onPress={handleSetBudget}
          loading={isSaving}
        />
      </Card>

      <Text style={styles.sectionTitle}>Data Actions</Text>
      <Card style={styles.menuCard}>
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={handleExport}
          disabled={isExporting}
        >
          <View style={[styles.iconBox, { backgroundColor: '#e0e7ff' }]}>
            {isExporting ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Download size={20} color={Colors.primary} />
            )}
          </View>
          <Text style={styles.menuText}>Export Transactions (CSV)</Text>
          {isExporting && <Text style={styles.menuValue}>Exporting...</Text>}
        </TouchableOpacity>

        <View style={styles.separator} />

        <TouchableOpacity style={styles.menuItem} onPress={handleReset}>
          <View style={[styles.iconBox, { backgroundColor: '#fee2e2' }]}>
            <Trash2 size={20} color={Colors.error} />
          </View>
          <Text style={[styles.menuText, { color: Colors.error }]}>Reset All Data</Text>
        </TouchableOpacity>
      </Card>

      <Text style={styles.sectionTitle}>Preferences</Text>
      <Card style={styles.menuCard}>
        <View style={styles.menuItem}>
          <View style={[styles.iconBox, { backgroundColor: '#f1f5f9' }]}>
            <Bell size={20} color={Colors.text} />
          </View>
          <Text style={styles.menuText}>Daily Reminders</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={async (value) => {
              if (value) {
                const hasPermission = await requestNotificationPermissions();
                if (hasPermission) {
                  await scheduleDailyReminder();
                  setNotificationsEnabled(true);
                  Alert.alert('Notifications Enabled', 'Daily reminders scheduled for 8 PM');
                } else {
                  Alert.alert('Permission Denied', 'Please enable notifications in system settings');
                }
              } else {
                await cancelAllNotifications();
                setNotificationsEnabled(false);
                Alert.alert('Notifications Disabled', 'Daily reminders have been cancelled');
              }
            }}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={Platform.OS === 'ios' ? undefined : Colors.white}
          />
        </View>
        <View style={styles.separator} />
        <View style={styles.menuItem}>
          <View style={[styles.iconBox, { backgroundColor: '#f1f5f9' }]}>
            <Shield size={20} color={Colors.text} />
          </View>
          <Text style={styles.menuText}>Security</Text>
        </View>
      </Card>

      <Text style={styles.sectionTitle}>About</Text>
      <Card style={styles.menuCard}>
        <View style={styles.menuItem}>
          <View style={[styles.iconBox, { backgroundColor: '#f1f5f9' }]}>
            <Info size={20} color={Colors.text} />
          </View>
          <Text style={styles.menuText}>Version</Text>
          <Text style={styles.menuValue}>1.0.0</Text>
        </View>
      </Card>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Bbook Tracker • Built with Expo & Drizzle</Text>
      </View>
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textLight,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
    marginLeft: 4,
  },
  card: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  menuCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.lg,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  menuValue: {
    fontSize: 14,
    color: Colors.textLight,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginHorizontal: Spacing.lg,
  },
  footer: {
    marginTop: Spacing.lg,
    alignItems: 'center',
    paddingBottom: Spacing.xl,
  },
  footerText: {
    color: Colors.textLight,
    fontSize: 13,
    fontWeight: '500',
  },
});
