# HR Pulse — Complete Supabase Backup

Generated on: 2026-11-09

## Contents of this Archive

1. **`supabase_backup_complete.json`**:
   - **Auth Users**: 39 user accounts with credentials, UUIDs, roles, and metadata
   - **Profiles**: 26 employee profiles (including salon branches and IT Team)
   - **Attendance**: 2,907 historical check-in / check-out records
   - **Attendance Tickets**: 17 attendance adjustment tickets
   - **Leave Requests**: 204 historical leave requests
   - **Advance Requests**: 24 salary advance records
   - **Payroll**: 169 monthly payroll records (including March 2026)
   - **Tasks & Performance**: schema-ready tables

2. **`storage/`**:
   - `avatars/`: 12 profile picture files organized by user UUID
   - `branding/`: System logo and assets

3. **`schema.sql`**:
   - The PostgreSQL DDL schema with all tables, constraints, foreign keys, triggers, and Row Level Security (RLS) policies.

4. **`restore_to_new_supabase.ts`**:
   - Automated TypeScript restoration script to restore all users, data tables, and storage objects into the new Supabase project in one click.

---

## How to Restore to a New Supabase Project

### Step 1: Initialize Database Schema
1. Open the [Supabase Dashboard](https://supabase.com/dashboard) of your new account.
2. Select your newly created project.
3. Open **SQL Editor** from the left navigation menu.
4. Paste the full contents of `schema.sql` and click **Run**.

### Step 2: Configure Environment Variables
In your project `.env` file (or as shell environment variables):
```env
NEW_SUPABASE_URL=https://your-new-project-ref.supabase.co
NEW_SUPABASE_SERVICE_ROLE_KEY=your-new-service-role-key
```

### Step 3: Run the Restoration Script
Execute:
```bash
npx tsx restore_to_new_supabase.ts
```
The script will:
- Re-create all 39 Auth login accounts with their preserved IDs and credentials
- Batch insert all profiles, payroll, attendance, leaves, and tickets
- Upload all avatar photos and branding images to the storage buckets
