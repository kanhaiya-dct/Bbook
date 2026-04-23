import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as z from 'zod';
import { BorderRadius, Colors, Shadows, Spacing } from '../constants/theme';
import { Transaction } from '../db/schema';
import { useStore } from '../store/useStore';
import { Button } from './Button';
import { Input } from './Input';

import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react-native';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Amount must be positive'),
  category: z.string().min(1, 'Category is required'),
  date: z.date(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const CATEGORIES = ['Food', 'Travel', 'Shopping', 'Salary', 'Entertainment', 'Bills', 'Health', 'Others'];

interface EditTransactionModalProps {
  visible: boolean;
  transaction: Transaction | null;
  onClose: () => void;
}

export const EditTransactionModal = ({ visible, transaction, onClose }: EditTransactionModalProps) => {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { updateTransaction } = useStore();

  const { control, handleSubmit, formState: { errors, isSubmitting }, setValue, reset, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const selectedCategory = watch('category');
  const selectedDate = watch('date');

  useEffect(() => {
    if (transaction) {
      reset({
        title: transaction.title,
        amount: transaction.amount.toString(),
        category: transaction.category,
        date: new Date(transaction.date),
        notes: transaction.notes || '',
      });
      setType(transaction.type);
    }
  }, [transaction, reset]);

  const onSubmit = async (data: FormData) => {
    if (!transaction) return;

    await updateTransaction(transaction.id, {
      title: data.title,
      amount: parseFloat(data.amount),
      type: type,
      category: data.category,
      date: data.date,
      notes: data.notes,
    });

    onClose();
  };

  if (!transaction) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.modalContainer, { flex: 1 }]}
        >
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Edit Transaction</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[styles.typeButton, type === 'expense' && styles.activeExpense]}
                  onPress={() => setType('expense')}
                >
                  <Text style={[styles.typeText, type === 'expense' && styles.activeTypeText]}>Expense</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, type === 'income' && styles.activeIncome]}
                  onPress={() => setType('income')}
                >
                  <Text style={[styles.typeText, type === 'income' && styles.activeTypeText]}>Income</Text>
                </TouchableOpacity>
              </View>

              <Controller
                control={control}
                name="title"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Title"
                    placeholder="e.g. Grocery shopping"
                    value={value}
                    onChangeText={onChange}
                    error={errors.title?.message}
                  />
                )}
              />

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: Spacing.md }}>
                  <Controller
                    control={control}
                    name="amount"
                    render={({ field: { onChange, value } }) => (
                      <Input
                        label="Amount (₹)"
                        placeholder="0.00"
                        keyboardType="numeric"
                        value={value}
                        onChangeText={onChange}
                        error={errors.amount?.message}
                      />
                    )}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Date</Text>
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Calendar size={18} color={Colors.primary} style={{ marginRight: 8 }} />
                    <Text style={styles.dateText}>
                      {format(selectedDate || new Date(), 'MMM dd, yyyy')}
                    </Text>
                  </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker
                      value={selectedDate || new Date()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={(event, date) => {
                        setShowDatePicker(false);
                        if (date) setValue('date', date);
                      }}
                    />
                  )}
                </View>
              </View>

              <Text style={styles.label}>Category</Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map((cat) => (
                  <Controller
                    key={cat}
                    control={control}
                    name="category"
                    render={({ field: { value } }) => (
                      <TouchableOpacity
                        style={[
                          styles.categoryChip,
                          value === cat && styles.activeCategoryChip,
                        ]}
                        onPress={() => setValue('category', cat)}
                      >
                        <Text style={[
                          styles.categoryChipText,
                          value === cat && styles.activeCategoryChipText,
                        ]}>{cat}</Text>
                      </TouchableOpacity>
                    )}
                  />
                ))}
              </View>

              {selectedCategory === 'Others' && (
                <Controller
                  control={control}
                  name="notes"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label="Custom Category/Details"
                      placeholder="e.g. Gift from friend"
                      value={value}
                      onChangeText={onChange}
                    />
                  )}
                />
              )}

              {selectedCategory !== 'Others' && (
                <Controller
                  control={control}
                  name="notes"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label="Notes (Optional)"
                      placeholder="Any extra details..."
                      multiline
                      numberOfLines={3}
                      style={styles.textArea}
                      value={value}
                      onChangeText={onChange}
                    />
                  )}
                />
              )}
            </ScrollView>

            <View style={styles.footer}>
              <Button
                title="Update Transaction"
                onPress={handleSubmit(onSubmit)}
                loading={isSubmitting}
                style={styles.submitButton}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    maxHeight: '90%',
  },
  modalContent: {
    flex: 1,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.md,
    ...Shadows.medium,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
  },
  datePickerButton: {
    backgroundColor: Colors.white,
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  dateText: {
    fontSize: 14,
    color: Colors.text,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 20,
    flexGrow: 1,
  },
  footer: {
    padding: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  typeText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textLight,
  },
  activeExpense: {
    backgroundColor: Colors.expense,
  },
  activeIncome: {
    backgroundColor: Colors.income,
  },
  activeTypeText: {
    color: Colors.white,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: Spacing.sm,
    marginLeft: 4,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.md,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeCategoryChip: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    color: Colors.text,
  },
  activeCategoryChipText: {
    color: Colors.white,
    fontWeight: '600',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  submitButton: {
    marginTop: Spacing.lg,
  },
});
