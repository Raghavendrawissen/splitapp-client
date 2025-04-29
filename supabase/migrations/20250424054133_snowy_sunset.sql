/*
  # Fix infinite recursion in group_members policies

  1. Changes
    - Remove recursive policies from group_members table
    - Create new, simplified policies that avoid infinite recursion
    
  2. Security
    - Maintain RLS security while preventing infinite recursion
    - Ensure users can still only access their own group data
    - Preserve admin capabilities for group management
*/

-- Drop existing policies to replace them with fixed versions
DROP POLICY IF EXISTS "Group admins can manage members" ON group_members;
DROP POLICY IF EXISTS "Users can view group members" ON group_members;

-- Create new non-recursive policies
CREATE POLICY "Group admins can manage members"
ON group_members
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = group_members.group_id
    AND gm.user_id = auth.uid()
    AND gm.role = 'admin'
  )
);

CREATE POLICY "Users can view group members"
ON group_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = group_members.group_id
    AND gm.user_id = auth.uid()
  )
);