import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const employees = [
  { name: "Dahami Divyanjali", email: "dahami.divyanjali@hrpulse.com", branch: "Borella", joinDate: "2024-06-05" },
  { name: "Achini Vindya", email: "achini.vindya@hrpulse.com", branch: "Borella", joinDate: "2024-02-22" },
  { name: "Dilini Sanarathna", email: "dilini.sanarathna@hrpulse.com", branch: "Dehiwela", joinDate: "2026-03-04" },
  { name: "Chamilka Botheju", email: "chamilka.botheju@hrpulse.com", branch: "Dematogoda", joinDate: "2022-08-02" },
  { name: "A.V. Chamika Sonali", email: "chamika.sonali@hrpulse.com", branch: "Dematogoda", joinDate: "2026-01-12" },
  { name: "D.A. Dilupa Thamari", email: "dilupa.thamari@hrpulse.com", branch: "Homagama", joinDate: "2002-09-01" },
  { name: "Harsha Thamali", email: "harsha.thamali@hrpulse.com", branch: "Homagama", joinDate: "2017-09-01" },
  { name: "Sachini Nirasha", email: "sachini.nirasha@hrpulse.com", branch: "Kadawatha", joinDate: "2022-07-01" },
  { name: "Chaseera Sulani", email: "chaseera.sulani@hrpulse.com", branch: "Kadawatha", joinDate: "2024-03-12" },
  { name: "Geethangani Pieris", email: "geethangani.pieris@hrpulse.com", branch: "Kiribathgoda", joinDate: "2019-01-09" },
  { name: "W.K. Erandathi Perera", email: "erandathi.perera@hrpulse.com", branch: "Kiribathgoda", joinDate: "2026-02-03" },
  { name: "W.A. Chandima Dilrukishi", email: "chandima.dilrukishi@hrpulse.com", branch: "Kottawa", joinDate: "2015-01-06" },
  { name: "Rasika Priyangani", email: "rasika.priyangani@hrpulse.com", branch: "Kottawa", joinDate: "2017-02-07" },
  { name: "A.M.N. Sanjana", email: "amn.sanjana@hrpulse.com", branch: "Office", joinDate: "1997-03-01" },
  { name: "R.P. Ratnayake", email: "rp.ratnayake@hrpulse.com", branch: "Office", joinDate: "1992-01-01" },
  { name: "Nihal Malawana", email: "nihal.malawana@hrpulse.com", branch: "Office", joinDate: "1992-01-01" },
  { name: "Syamalie Udumulla", email: "syamalie.udumulla@hrpulse.com", branch: "Office", joinDate: "2000-01-01" },
  { name: "Nishanthi Kuruppu", email: "nishanthi.kuruppu@hrpulse.com", branch: "Office", joinDate: "1997-07-10" },
  { name: "Nadeesha Dilhara", email: "nadeesha.dilhara@hrpulse.com", branch: "Office", joinDate: "2022-11-10" },
  { name: "Chathurika Madushani", email: "chathurika.madushani@hrpulse.com", branch: "Office", joinDate: "2022-11-10" },
  { name: "Maneesha H. Dias", email: "maneesha.dias@hrpulse.com", branch: "Panadura", joinDate: "2026-01-12" },
  { name: "Imashi Pramodaya", email: "imashi.pramodaya@hrpulse.com", branch: "Panadura", joinDate: "2016-01-25" },
  { name: "Aruni Indrachapa", email: "aruni.indrachapa@hrpulse.com", branch: "W2", joinDate: "2025-11-26" },
  { name: "Tharushi Sadumini", email: "tharushi.sadumini@hrpulse.com", branch: "W2", joinDate: "2022-11-03" },
  { name: "Lakshika Perera", email: "lakshika.perera@hrpulse.com", branch: "W3", joinDate: "2025-12-09" },
  { name: "Tharushi Apsara", email: "tharushi.apsara@hrpulse.com", branch: "W3", joinDate: "2017-09-01" },
  { name: "D.M. Nilukshi Kawshalya", email: "nilukshi.kawshalya@hrpulse.com", branch: "W4", joinDate: "2025-07-22" },
  { name: "Dulki Isanka", email: "dulki.isanka@hrpulse.com", branch: "W4", joinDate: "2013-04-07" }
];

const admins = [
  { email: 'super@hrpulse.com', role: 'super', name: 'Super Admin' },
  { email: 'hr@hrpulse.com', role: 'hr', name: 'HR Manager' },
  { email: 'owner@hrpulse.com', role: 'owner', name: 'Executive Owner' }
];

async function run() {
  const { data: allProfiles } = await supabase.from('profiles').select('*');
  if (!allProfiles) return;

  const canonicalMap = new Map<string, string>(); // email -> canonical ID
  const emailToId = new Map<string, string>();

  // First pass: Find existing profiles for canonical emails
  for (const emp of employees) {
    const match = allProfiles.find(p => p.email.toLowerCase().replace(/[.\s-]/g, '') === emp.email.toLowerCase().replace(/[.\s-]/g, ''));
    if (match) {
      canonicalMap.set(emp.email, match.id);
      console.log(`Matched canonical: ${emp.name} -> ${match.id}`);
    } else {
      console.log(`No profile found for canonical: ${emp.name} (${emp.email})`);
    }
  }

  // Handle admins
  for (const admin of admins) {
    const match = allProfiles.find(p => p.email === admin.email);
    if (match) canonicalMap.set(admin.email, match.id);
  }

  // Second pass: Identify duplicates and redirects
  const redirects = new Map<string, string>(); // oldId -> newId
  for (const p of allProfiles) {
    const pEmailNorm = p.email.toLowerCase().replace(/[.\s-]/g, '');
    const canonicalEmp = employees.find(e => e.email.toLowerCase().replace(/[.\s-]/g, '') === pEmailNorm);
    const canonicalAdmin = admins.find(a => a.email.toLowerCase().replace(/[.\s-]/g, '') === pEmailNorm);
    
    const canonicalEmail = canonicalEmp?.email || canonicalAdmin?.email;
    if (canonicalEmail) {
      const canonicalId = canonicalMap.get(canonicalEmail);
      if (canonicalId && canonicalId !== p.id) {
        console.log(`Redirecting duplicate: ${p.email} (${p.id}) -> ${canonicalId}`);
        redirects.set(p.id, canonicalId);
      }
    } else {
      console.log(`Unknown profile found (will be deleted if no data): ${p.email} (${p.id})`);
    }
  }

  // Redirect data in linked tables
  const tables = ['attendance', 'leave_requests', 'payroll', 'performance', 'tasks'];
  for (const [oldId, newId] of redirects.entries()) {
    for (const table of tables) {
      const { error } = await supabase.from(table).update({ user_id: newId }).eq('user_id', oldId);
      if (error) console.error(`Failed to redirect ${table} records for ${oldId}`, error);
    }
    // Handle approved_by in leave_requests
    await supabase.from('leave_requests').update({ approved_by: newId }).eq('approved_by', oldId);
  }

  // Update canonical profiles with correct data
  for (const emp of employees) {
    const id = canonicalMap.get(emp.email);
    if (id) {
      await supabase.from('profiles').update({
        name: emp.name,
        branch: emp.branch,
        join_date: emp.joinDate,
        email: emp.email // ensure email is exact
      }).eq('id', id);
    }
  }

  // Delete redundant profiles
  const allCanonicalIds = new Set(canonicalMap.values());
  const toDelete = allProfiles.filter(p => !allCanonicalIds.has(p.id)).map(p => p.id);
  if (toDelete.length > 0) {
    console.log(`Deleting ${toDelete.length} redundant profiles`);
    await supabase.from('profiles').delete().in('id', toDelete);
  }

  console.log('Consolidation complete.');
}

run();
