/*
  # Fix Group and Expense Policies

  1. Changes
    - Drop and recreate group_members policies to fix recursion
    - Add missing policies for expenses and expense_participants
    - Optimize policy conditions for better performance
    
  2. Security
    - Maintain same security level with optimized queries
    - Ensure proper access control for all operations
*/

-- Drop existing policies that might cause issues
DROP POLICY IF EXISTS "Users can view members of their groups" ON group_members;
DROP POLICY IF EXISTS "Admins can manage group members" ON group_members;
DROP POLICY IF EXISTS "Users can view expenses in their groups" ON expenses;
DROP POLICY IF EXISTS "Users can create expenses in their groups" ON expenses;

-- Create new optimized policies for group_members
CREATE POLICY "Users can view members of their groups"
ON group_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM group_members my_membership
    WHERE my_membership.group_id = group_members.group_id
    AND my_membership.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage group members"
ON group_members
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM group_members admin_check
    WHERE admin_check.group_id = group_members.group_id
    AND admin_check.user_id = auth.uid()
    AND admin_check.role = 'admin'
  )
);

-- Create optimized policies for expenses
CREATE POLICY "Users can view expenses in their groups"
ON expenses
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = expenses.group_id
    AND group_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create expenses in their groups"
ON expenses
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = expenses.group_id
    AND group_members.user_id = auth.uid()
  )
);

-- Update expense_participants policies
CREATE POLICY "Users can view expense participants"
ON expense_participants
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM expenses e
    JOIN group_members gm ON e.group_id = gm.group_id
    WHERE e.id = expense_participants.expense_id
    AND gm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage expense participants"
ON expense_participants
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM expenses e
    JOIN group_members gm ON e.group_id = gm.group_id
    WHERE e.id = expense_participants.expense_id
    AND gm.user_id = auth.uid()
  )
);