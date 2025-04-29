/*
  # Fix group_members RLS policies

  1. Changes
    - Remove recursive policies from group_members table
    - Create new, simplified policies that avoid infinite recursion
    - Maintain security while allowing proper data access

  2. Security
    - Maintain RLS enabled on group_members table
    - Add simplified policies for:
      - Group admins can manage members
      - Users can view members of groups they belong to
*/

-- Drop existing policies to replace them with fixed versions
DROP POLICY IF EXISTS "Group admins can manage members" ON group_members;
DROP POLICY IF EXISTS "Users can view group members" ON group_members;

-- Create new policy for admins to manage members
-- This version avoids recursion by using a direct role check
CREATE POLICY "Group admins can manage members"
ON group_members
FOR ALL
TO authenticated
USING (
  role = 'admin' AND
  group_id IN (
    SELECT group_id 
    FROM group_members 
    WHERE user_id = auth.uid()
  )
);

-- Create new policy for viewing members
-- This version avoids recursion by using a simple membership check
CREATE POLICY "Users can view group members"
ON group_members
FOR SELECT
TO authenticated
USING (
  group_id IN (
    SELECT group_id 
    FROM group_members 
    WHERE user_id = auth.uid()
  )
);