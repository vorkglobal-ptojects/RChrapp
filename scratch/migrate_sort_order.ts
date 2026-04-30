import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const EMPLOYEE_ORDER = [
  "Dahami Divyanjali",
  "Achini Vindya",
  "Dilini Sanarathna",
  "Chamilka Botheju",
  "A.V. Chamika Sonali",
  "D.A. Dilupa Thamari",
  "Harsha Thamali",
  "Sachini Nirasha",
  "Chaseera Sulani",
  "Geethangani Pieris",
  "W.K. Erandathi Perera",
  "W.A. Chandima Dilrukishi",
  "Rasika Priyangani",
  "A.M.N. Sanjana",
  "R.P. Ratnayake",
  "Nihal Malawana",
  "Syamalie Udumulla",
  "Nishanthi Kuruppu",
  "Nadeesha Dilhara",
  "Chathurika Madushani",
  "Maneesha H. Dias",
  "Imashi Pramodaya",
  "Aruni Indrachapa",
  "Tharushi Sadumini",
  "Lakshika Perera",
  "Tharushi Apsara",
  "D.M. Nilukshi Kawshalya",
  "Dilki Isanka"
];

async function migrateSortOrder() {
  console.log('Fetching profiles...');
  const { data: profiles, error: pError } = await supabase.from('profiles').select('id, name, role');
  if (pError) throw pError;

  console.log(`Found ${profiles.length} profiles.`);

  for (const p of profiles) {
    let order = 999;
    if (p.role === 'owner') order = -20;
    else if (p.role === 'super') order = -10;
    else if (p.role === 'hr') order = 0;
    else {
      const idx = EMPLOYEE_ORDER.indexOf(p.name);
      if (idx !== -1) order = idx + 1;
    }

    console.log(`Updating ${p.name} (${p.role}) -> sort_order: ${order}`);
    const { error: uError } = await supabase
      .from('profiles')
      .update({ sort_order: order })
      .eq('id', p.id);
    
    if (uError) console.error(`Failed to update ${p.name}`, uError);
  }

  console.log('Migration complete!');
}

migrateSortOrder();
