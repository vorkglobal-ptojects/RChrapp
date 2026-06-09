import * as dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL as string;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function seedAttendance() {
  console.log('Fetching profiles...');
  const { data: profiles, error: profileErr } = await supabase.from('profiles').select('id, name');

  if (profileErr) {
    console.error('Error fetching profiles:', profileErr);
    return;
  }

  console.log(`Found ${profiles.length} profiles. Generating attendance for the past 30 days...`);

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today

  const recordsToInsert = [];

  for (const profile of profiles) {
    // Generate records for the past 30 days
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Skip Sundays
      if (date.getDay() === 0) continue;

      const dateStr = date.toISOString().split('T')[0];

      // Randomize check-in time between 08:00 AM and 09:15 AM
      // 10% chance of being late (after 09:10 AM)
      const isLateRandom = Math.random() < 0.1;
      let checkInHour = 8;
      let checkInMinute = Math.floor(Math.random() * 30); // 8:00 to 8:30
      
      if (isLateRandom) {
        checkInHour = 9;
        checkInMinute = 15 + Math.floor(Math.random() * 30); // 9:15 to 9:45
      } else {
        // Normal check-in (8:20 to 8:50)
        checkInHour = 8;
        checkInMinute = 20 + Math.floor(Math.random() * 30);
      }

      const checkInTime = new Date(`${dateStr}T${checkInHour.toString().padStart(2, '0')}:${checkInMinute.toString().padStart(2, '0')}:00+05:30`);
      
      // Randomize check-out time between 05:30 PM and 06:30 PM
      // 5% chance of early out (before 05:30 PM)
      const isEarlyRandom = Math.random() < 0.05;
      let checkOutHour = 17;
      let checkOutMinute = 30 + Math.floor(Math.random() * 30);
      
      if (isEarlyRandom) {
        checkOutHour = 16;
        checkOutMinute = 30 + Math.floor(Math.random() * 30); // 4:30 to 5:00
      } else {
        // Normal check-out (17:35 to 18:30)
        checkOutHour = 17;
        checkOutMinute = 35 + Math.floor(Math.random() * 55);
        if (checkOutMinute >= 60) {
          checkOutHour = 18;
          checkOutMinute -= 60;
        }
      }

      const checkOutTime = new Date(`${dateStr}T${checkOutHour.toString().padStart(2, '0')}:${checkOutMinute.toString().padStart(2, '0')}:00+05:30`);

      const isLate = checkInHour > 9 || (checkInHour === 9 && checkInMinute > 10);
      const isEarlyOut = checkOutHour < 17 || (checkOutHour === 17 && checkOutMinute < 30);

      recordsToInsert.push({
        user_id: profile.id,
        date: dateStr,
        check_in: checkInTime.toISOString(),
        check_out: checkOutTime.toISOString(),
        is_late: isLate,
        is_early_out: isEarlyOut
      });
    }
  }

  console.log(`Prepared ${recordsToInsert.length} records. Inserting into Supabase...`);

  // Insert in batches of 100
  const batchSize = 100;
  for (let i = 0; i < recordsToInsert.length; i += batchSize) {
    const batch = recordsToInsert.slice(i, i + batchSize);
    
    // We use ON CONFLICT DO NOTHING so we don't overwrite existing records
    const { error: insertErr } = await supabase
      .from('attendance')
      .upsert(batch, { onConflict: 'user_id, date', ignoreDuplicates: true });

    if (insertErr) {
      console.error(`Error inserting batch ${i / batchSize + 1}:`, insertErr);
    } else {
      console.log(`Inserted batch ${i / batchSize + 1} (${batch.length} records)`);
    }
  }

  console.log('Attendance seeding completed!');
}

seedAttendance();
