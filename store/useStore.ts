import { create } from 'zustand';
import { Transaction, Budget } from '../db/schema';
import { db } from '../db/client';
import { desc, eq, sql } from 'drizzle-orm';
import { transactions, budgets } from '../db/schema';

interface AppState {
  transactions: Transaction[];
  budgets: Budget[];
  isLoading: boolean;
  notificationsEnabled: boolean;
  fetchTransactions: () => Promise<void>;
  fetchBudgets: () => Promise<void>;
  addTransaction: (tx: any) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;
  updateTransaction: (id: number, tx: any) => Promise<void>;
  setBudget: (month: string, amount: number) => Promise<void>;
  setNotificationsEnabled: (enabled: boolean) => void;
  resetData: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  transactions: [],
  budgets: [],
  isLoading: false,
  notificationsEnabled: false,

  setNotificationsEnabled: (enabled: boolean) => {
    set({ notificationsEnabled: enabled });
  },

  fetchTransactions: async () => {
    set({ isLoading: true });
    try {
      const data = await db.select().from(transactions).orderBy(desc(transactions.date));
      set({ transactions: data, isLoading: false });
    } catch (error) {
      console.error('Fetch transactions error:', error);
      set({ isLoading: false });
    }
  },

  fetchBudgets: async () => {
    try {
      const data = await db.select().from(budgets);
      set({ budgets: data });
    } catch (error) {
      console.error('Fetch budgets error:', error);
    }
  },

  addTransaction: async (tx) => {
    try {
      await db.insert(transactions).values(tx);
      await get().fetchTransactions();
    } catch (error) {
      console.error('Add transaction error:', error);
    }
  },

  deleteTransaction: async (id) => {
    try {
      await db.delete(transactions).where(eq(transactions.id, id));
      await get().fetchTransactions();
    } catch (error) {
      console.error('Delete transaction error:', error);
    }
  },

  updateTransaction: async (id, tx) => {
    try {
      await db.update(transactions).set(tx).where(eq(transactions.id, id));
      await get().fetchTransactions();
    } catch (error) {
      console.error('Update transaction error:', error);
    }
  },

  setBudget: async (month, amount) => {
    try {
      const existing = await db.select().from(budgets).where(eq(budgets.month, month)).limit(1);
      if (existing.length > 0) {
        await db.update(budgets).set({ amount }).where(eq(budgets.month, month));
      } else {
        await db.insert(budgets).values({ month, amount });
      }
      await get().fetchBudgets();
    } catch (error) {
      console.error('Set budget error:', error);
    }
  },

  resetData: async () => {
    try {
      await db.delete(transactions);
      await db.delete(budgets);
      set({ transactions: [], budgets: [] });
    } catch (error) {
      console.error('Reset data error:', error);
    }
  },
}));
