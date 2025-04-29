import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Receipt, TrendingUp, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { getGroups, getExpenses } from '@/lib/api';

const stats = [
  { name: 'Total Groups', value: '0', icon: Users },
  { name: 'Active Expenses', value: '0', icon: Receipt },
  { name: 'Total Spent', value: '$0', icon: TrendingUp },
];

export function Dashboard() {
  const navigate = useNavigate();
  const { data: groups } = useQuery({ queryKey: ['groups'], queryFn: getGroups });
  const { data: expenses } = useQuery({ queryKey: ['expenses'], queryFn: getExpenses });

  const totalGroups = groups?.length || 0;
  const totalExpenses = expenses?.length || 0;
  const totalSpent = expenses?.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0;

  const updatedStats = [
    { ...stats[0], value: totalGroups.toString() },
    { ...stats[1], value: totalExpenses.toString() },
    { ...stats[2], value: `$${totalSpent.toFixed(2)}` },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-700">
          Track your expenses and group activities
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {updatedStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Icon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500">
                      {stat.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
        <div className="mt-4 overflow-hidden rounded-lg bg-white shadow">
          <div className="p-6">
            {expenses && expenses.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {expenses.slice(0, 5).map((expense) => (
                  <li key={expense.id} className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {expense.description}
                        </p>
                        <p className="text-sm text-gray-500">
                          {expense.groups?.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          ${Number(expense.amount).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-gray-500">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}