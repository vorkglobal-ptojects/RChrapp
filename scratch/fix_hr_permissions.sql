
-- Fix RLS for profiles table to allow HR managers to manage employees
DO $$ 
BEGIN
    -- Enable RLS
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies if they exist to avoid conflicts
    DROP POLICY IF EXISTS "Allow HR to manage profiles" ON profiles;
    DROP POLICY IF EXISTS "Allow HR to insert profiles" ON profiles;
    DROP POLICY IF EXISTS "Allow HR to update profiles" ON profiles;
    DROP POLICY IF EXISTS "Allow HR to delete profiles" ON profiles;

    -- Policy for HR to manage everything
    CREATE POLICY "Allow HR to manage profiles" 
    ON profiles 
    FOR ALL 
    TO authenticated 
    USING (
      (SELECT role FROM profiles WHERE id = auth.uid()) IN ('hr', 'owner', 'super')
    )
    WITH CHECK (
      (SELECT role FROM profiles WHERE id = auth.uid()) IN ('hr', 'owner', 'super')
    );

    -- Also ensure they can select
    DROP POLICY IF EXISTS "Allow users to read all profiles" ON profiles;
    CREATE POLICY "Allow users to read all profiles" 
    ON profiles 
    FOR SELECT 
    TO authenticated 
    USING (true);

END $$;
