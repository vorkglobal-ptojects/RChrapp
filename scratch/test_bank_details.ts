import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function testBankAndIdentityDetails() {
  console.log('🧪 Starting Expanded Database Mapping Test...\n');

  // 1. Fetch any profile
  const { data: profiles, error: selectErr } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);

  if (selectErr) {
    console.error('❌ Failed to select profile:', selectErr.message);
    process.exit(1);
  }

  if (!profiles || profiles.length === 0) {
    console.log('⚠️ No profiles found in the database to test.');
    return;
  }

  const testProfile = profiles[0];
  console.log(`📋 Selected Profile: ${testProfile.name} (${testProfile.id})`);

  // 2. Try to update bank and identity details
  const updateData = {
    bank_name: 'Antigravity Test Bank',
    bank_branch: 'Main Branch',
    account_no: '9876543210',
    account_holder_name: 'Antigravity Tester',
    nic: '199512345V',
    nickname: 'AgTester'
  };

  console.log('🔄 Attempting to update bank details, NIC, and nickname...');
  const { error: updateErr } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', testProfile.id);

  if (updateErr) {
    if (updateErr.message.includes('column') && updateErr.message.includes('does not exist')) {
      console.log('\n❌ UPDATE FAILED: Database columns do not exist yet!');
      console.log('👉 Please remember to run the SQL migration in your Supabase Dashboard SQL Editor:');
      console.log(`
        ALTER TABLE public.profiles 
        ADD COLUMN IF NOT EXISTS nic TEXT,
        ADD COLUMN IF NOT EXISTS nickname TEXT;
      `);
    } else {
      console.error('❌ Update failed with unexpected error:', updateErr.message);
    }
    return;
  }

  console.log('✅ Update successful!');

  // 3. Fetch again and verify
  const { data: refetched, error: fetchErr } = await supabase
    .from('profiles')
    .select('bank_name, bank_branch, account_no, account_holder_name, nic, nickname')
    .eq('id', testProfile.id)
    .single();

  if (fetchErr) {
    console.error('❌ Failed to re-fetch profile:', fetchErr.message);
    return;
  }

  console.log('\n🔍 Verifying re-fetched database values:');
  console.log('   Bank Name:', refetched.bank_name);
  console.log('   Bank Branch:', refetched.bank_branch);
  console.log('   Account Number:', refetched.account_no);
  console.log('   Account Holder:', refetched.account_holder_name);
  console.log('   NIC Number:', refetched.nic);
  console.log('   Nick Name:', refetched.nickname);

  if (
    refetched.bank_name === updateData.bank_name &&
    refetched.bank_branch === updateData.bank_branch &&
    refetched.account_no === updateData.account_no &&
    refetched.account_holder_name === updateData.account_holder_name &&
    refetched.nic === updateData.nic &&
    refetched.nickname === updateData.nickname
  ) {
    console.log('\n🎉 SUCCESS: Database mapping and persistence tests passed flawlessly!');
  } else {
    console.log('\n⚠️ WARNING: Values fetched do not match the values written.');
  }

  // 4. Cleanup (restore original values)
  console.log('\n🧹 Cleaning up test values...');
  await supabase
    .from('profiles')
    .update({
      bank_name: testProfile.bank_name,
      bank_branch: testProfile.bank_branch,
      account_no: testProfile.account_no,
      account_holder_name: testProfile.account_holder_name,
      nic: testProfile.nic,
      nickname: testProfile.nickname
    })
    .eq('id', testProfile.id);
  console.log('✅ Cleanup complete.');
}

testBankAndIdentityDetails().catch(console.error);
