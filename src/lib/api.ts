import { supabase } from './supabase';
import type { Database } from '@/types/supabase';

type Tables = Database['public']['Tables'];
type Group = Tables['groups']['Row'];
type Expense = Tables['expenses']['Row'];

export async function getGroups() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data: groups, error } = await supabase
    .from('groups')
    .select(`
      *,
      group_members!inner (
        user_id,
        role
      )
    `)
    .eq('group_members.user_id', user.id);

  if (error) throw error;
  return groups as Group[];
}

export async function getGroupMembers(groupId: string) {
  const { data: members, error } = await supabase
    .from('group_members')
    .select(`
      user_id,
      role,
      profiles!inner (
        full_name
      )
    `)
    .eq('group_id', groupId);

  if (error) throw error;
  return members;
}

export async function createGroup(name: string, description?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Start a transaction by using single queries
  // 1. Create the group
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert({ 
      name, 
      description,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (groupError) throw groupError;

  // 2. Add the creator as an admin member
  const { error: memberError } = await supabase
    .from('group_members')
    .insert({
      group_id: group.id,
      user_id: user.id,
      role: 'admin'
    });

  if (memberError) {
    // If adding member fails, we should ideally delete the group
    await supabase.from('groups').delete().eq('id', group.id);
    throw memberError;
  }

  return group;
}

export async function getExpenses() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data: expenses, error } = await supabase
    .from('expenses')
    .select(`
      *,
      groups (
        name
      ),
      profiles!paid_by (
        full_name
      ),
      expense_participants (
        user_id,
        share_amount,
        profiles (
          full_name
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return expenses as (Expense & {
    groups: { name: string } | null;
    profiles: { full_name: string | null } | null;
    expense_participants: {
      user_id: string;
      share_amount: number;
      profiles: { full_name: string | null };
    }[];
  })[];
}

export async function createExpense(data: {
  groupId: string;
  description: string;
  amount: number;
  participants: { userId: string; shareAmount: number }[];
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Verify user is a member of the group
  const { data: membership, error: membershipError } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', data.groupId)
    .eq('user_id', user.id)
    .single();

  if (membershipError || !membership) {
    throw new Error('You must be a member of the group to create expenses');
  }

  // Create the expense
  const { data: expense, error: expenseError } = await supabase
    .from('expenses')
    .insert({
      group_id: data.groupId,
      description: data.description,
      amount: data.amount,
      paid_by: user.id,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (expenseError) throw expenseError;

  // Add expense participants
  const { error: participantsError } = await supabase
    .from('expense_participants')
    .insert(
      data.participants.map(p => ({
        expense_id: expense.id,
        user_id: p.userId,
        share_amount: p.shareAmount
      }))
    );

  if (participantsError) {
    // If adding participants fails, delete the expense
    await supabase.from('expenses').delete().eq('id', expense.id);
    throw participantsError;
  }

  return expense;
}

export async function updateProfile(data: {
  fullName?: string;
  avatarUrl?: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: data.fullName,
      avatar_url: data.avatarUrl,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id);

  if (error) throw error;

  // Update auth metadata
  await supabase.auth.updateUser({
    data: { full_name: data.fullName }
  });
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`
  });

  if (error) throw error;
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (error) throw error;
}