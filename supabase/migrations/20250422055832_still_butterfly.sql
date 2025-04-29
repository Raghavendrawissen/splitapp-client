/*
  # Initial Schema Setup for Mysplit

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `full_name` (text)
      - `avatar_url` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `groups`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `image_url` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `group_members`
      - `group_id` (uuid, references groups)
      - `user_id` (uuid, references profiles)
      - `role` (text)
      - `created_at` (timestamp)
    
    - `expenses`
      - `id` (uuid, primary key)
      - `group_id` (uuid, references groups)
      - `description` (text)
      - `amount` (decimal)
      - `paid_by` (uuid, references profiles)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `expense_participants`
      - `expense_id` (uuid, references expenses)
      - `user_id` (uuid, references profiles)
      - `share_amount` (decimal)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create groups table
CREATE TABLE groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Create group_members table
CREATE TABLE group_members (
  group_id uuid REFERENCES groups ON DELETE CASCADE,
  user_id uuid REFERENCES profiles ON DELETE CASCADE,
  role text DEFAULT 'member',
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Create expenses table
CREATE TABLE expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups ON DELETE CASCADE,
  description text NOT NULL,
  amount decimal NOT NULL,
  paid_by uuid REFERENCES profiles ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Create expense_participants table
CREATE TABLE expense_participants (
  expense_id uuid REFERENCES expenses ON DELETE CASCADE,
  user_id uuid REFERENCES profiles ON DELETE CASCADE,
  share_amount decimal NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (expense_id, user_id)
);

ALTER TABLE expense_participants ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for groups
CREATE POLICY "Users can view groups they are members of"
  ON groups
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create groups"
  ON groups
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Group members can update their groups"
  ON groups
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.id
      AND group_members.user_id = auth.uid()
      AND group_members.role = 'admin'
    )
  );

-- Add RLS policies for group_members
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

-- Add RLS policies for expenses
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

-- Add RLS policies for expense_participants
CREATE POLICY "Users can view expense participants in their groups"
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

CREATE POLICY "Users can manage expense participants in their expenses"
  ON expense_participants
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM expenses
      WHERE expenses.id = expense_participants.expense_id
      AND expenses.paid_by = auth.uid()
    )
  );

-- Create function to handle profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user profile creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();