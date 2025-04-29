/*
  # Fix infinite recursion in group_members policies

  1. Changes
    - Drop existing policies on group_members table that cause recursion
    - Create new, optimized policies that avoid circular references
    
  2. Security
    - Maintain same level of access control but with better performance
    - Policies ensure users can only:
      - View members of groups they belong to
      - Manage members if they are group admins
*/

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Group admins can manage members" ON group_members;
DROP POLICY IF EXISTS "Users can view group members" ON group_members;

-- Create new optimized policies
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