import React, { useState } from 'react';
import { Plus, Receipt, Calendar, DollarSign, Users } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getExpenses, createExpense, getGroups } from '@/lib/api';
import { toast } from 'react-hot-toast';

export function Expenses() {
  const [showNewExpenseForm, setShowNewExpenseForm] = useState(false);
  const [newExpense, setNewExpense] = useState({
    groupId: '',
    description: '',
    amount: '',
    participants: [] as { userId: string; shareAmount: number }[],
  });

  const queryClient = useQueryClient();
  const { data: expenses } = useQuery({ queryKey: ['expenses'], queryFn: getExpenses });
  const { data: groups } = useQuery({ queryKey: ['groups'], queryFn: getGroups });

  const createExpenseMutation = useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setShowNewExpenseForm(false);
      setNewExpense({
        groupId: '',
        description: '',
        amount: '',
        participants: [],
      });
      toast.success('Expense added successfully');
    },
    onError: () => {
      toast.error('Failed to add expense');
    },
  });

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.groupId || !newExpense.description || !newExpense.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    createExpenseMutation.mutate({
      groupId: newExpense.groupId,
      description: newExpense.description,
      amount: parseFloat(newExpense.amount),
      participants: [{ userId: newExpense.groupId, shareAmount: parseFloat(newExpense.amount) }],
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Expenses</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track and manage your shared expenses
          </p>
        </div>
        <button
          onClick={() => setShowNewExpenseForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Expense
        </button>
      </div>

      {showNewExpenseForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Add New Expense</h3>
          <form onSubmit={handleCreateExpense} className="space-y-4">
            <div>
              <label htmlFor="group" className="block text-sm font-medium text-gray-700">
                Group
              </label>
              <select
                id="group"
                value={newExpense.groupId}
                onChange={(e) => setNewExpense({ ...newExpense, groupId: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              >
                <option value="">Select a group</option>
                {groups?.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <input
                type="text"
                id="description"
                value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                Amount
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  id="amount"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowNewExpenseForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createExpenseMutation.isPending}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {createExpenseMutation.isPending ? 'Adding...' : 'Add Expense'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="divide-y divide-gray-200">
          {expenses?.map((expense) => (
            <div key={expense.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">
                      {expense.description}
                    </h3>
                    <p className="text-lg font-semibold text-indigo-600">
                      ${Number(expense.amount).toFixed(2)}
                    </p>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <Receipt className="h-4 w-4 mr-2" />
                      {expense.groups?.name}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(expense.created_at || '').toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Paid by {expense.profiles?.full_name}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="h-4 w-4 mr-2" />
                      {expense.expense_participants?.length} participants
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {(!expenses || expenses.length === 0) && (
            <div className="p-6 text-center text-gray-500">No expenses found</div>
          )}
        </div>
      </div>
    </div>
  );
}