import { supabase } from '../src/lib/supabase';

async function massUpdateLeaves() {
  const data = [
    {
      name: 'W.A. Chandima Dilrukshi',
      id: 'b627bda8-8e53-4d1a-b4fd-cde59e90f5c4',
      leaves: [
        { date: '2026-02-06', type: 'Annual', startTime: '13:00', endTime: '17:30', reason: 'Half Day Leave', amount: 0.5 },
        { date: '2026-02-26', type: 'Annual', startTime: '13:00', endTime: '17:30', reason: 'Half Day Leave', amount: 0.5 },
        { date: '2026-04-03', type: 'Short', startTime: '15:00', endTime: '17:30', reason: 'Short Leave', amount: 0.3125 }
      ]
    },
    {
      name: 'Rasika Priyangani',
      id: '93b4a5ec-faa5-429a-af29-6c00f04e7d3f',

      leaves: [
        { date: '2026-01-02', type: 'Annual', reason: 'Full Day Leave', amount: 1.0 },
        { date: '2026-01-22', type: 'Annual', startTime: '13:00', endTime: '17:30', reason: 'Half Day Leave', amount: 0.5 },
        { date: '2026-01-23', type: 'Short', startTime: '15:00', endTime: '17:30', reason: 'Short Leave', amount: 0.3125 },
        { date: '2026-01-24', type: 'Annual', reason: 'Full Day Leave', amount: 1.0 },
        { date: '2026-02-20', type: 'Annual', reason: 'Full Day Leave', amount: 1.0 },
        { date: '2026-02-27', type: 'Annual', startTime: '13:00', endTime: '17:30', reason: 'Half Day Leave', amount: 0.5 },
        { date: '2026-02-14', type: 'Annual', startTime: '13:00', endTime: '17:30', reason: 'Half Day Leave', amount: 0.5 },
        { date: '2026-03-26', type: 'Annual', startTime: '13:00', endTime: '17:30', reason: 'Half Day Leave', amount: 0.5 },
        { date: '2026-03-05', type: 'Annual', startTime: '13:00', endTime: '17:30', reason: 'Half Day Leave', amount: 0.5 },
        { date: '2026-04-04', type: 'Annual', reason: 'Full Day Leave', amount: 1.0 }
      ]
    },
    {
      name: 'Nadeesha Dihara',
      id: '6c61d6a5-3f00-4b04-a39d-448b8de72d6a',
      leaves: [
        { date: '2026-01-07', type: 'Annual', amount: 1.0 },
        { date: '2026-01-24', type: 'Annual', startTime: '13:00', endTime: '17:30', amount: 0.5 },
        { date: '2026-02-10', type: 'Annual', startTime: '13:00', endTime: '17:30', amount: 0.5 },
        { date: '2026-02-13', type: 'Annual', amount: 1.0 },
        { date: '2026-02-14', type: 'Annual', amount: 1.0 },
        { date: '2026-02-20', type: 'Annual', amount: 1.0 },
        { date: '2026-03-13', type: 'Annual', startTime: '13:00', endTime: '17:30', amount: 0.5 },
        { date: '2026-04-07', type: 'Annual', amount: 1.0 },
        { date: '2026-04-25', type: 'Annual', amount: 1.0 },
        { date: '2026-04-20', type: 'Annual', startTime: '13:00', endTime: '17:30', amount: 0.5 }
      ]
    },
    {
      name: 'Chathurika Madushani',
      id: '8ffc571e-f02c-4703-adcc-a66a889ff5c3',
      leaves: [
        { date: '2026-01-19', type: 'Annual', amount: 1.0 },
        { date: '2026-01-29', type: 'Annual', amount: 1.0 },
        { date: '2026-02-16', type: 'Short', startTime: '15:00', endTime: '17:30', amount: 0.3125 },
        { date: '2026-02-17', type: 'Annual', amount: 1.0 },
        { date: '2026-03-14', type: 'Annual', amount: 1.0 },
        { date: '2026-04-04', type: 'Annual', amount: 1.0 }
      ]
    },
    {
      name: 'Imashi Pramodya',
      id: '4abe7179-b0f6-41de-aec2-3b744339f89c',
      leaves: [
        { date: '2026-01-16', type: 'Annual', amount: 1.0 },
        { date: '2026-01-17', type: 'Annual', amount: 1.0 },
        { date: '2026-01-30', type: 'Annual', startTime: '13:00', endTime: '17:30', amount: 0.5 },
        { date: '2026-02-21', type: 'Short', startTime: '15:00', endTime: '17:30', amount: 0.3125 },
        { date: '2026-02-13', type: 'Annual', startTime: '13:00', endTime: '17:30', amount: 0.5 }
      ]
    },
    {
      name: 'Tharushi Sadumin',
      id: 'cc1e7ab3-7594-40b0-8b79-0a40cccb102d',
      leaves: [
        { date: '2026-01-21', type: 'Annual', startTime: '13:00', endTime: '17:30', amount: 0.5 },
        { date: '2026-01-27', type: 'Annual', amount: 1.0 },
        { date: '2026-01-28', type: 'Annual', amount: 1.0 },
        { date: '2026-01-29', type: 'Annual', amount: 1.0 },
        { date: '2026-01-30', type: 'Annual', amount: 1.0 },
        { date: '2026-01-31', type: 'Annual', amount: 1.0 },
        { date: '2026-02-02', type: 'Annual', startTime: '13:00', endTime: '17:30', amount: 0.5 },
        { date: '2026-02-03', type: 'Annual', startTime: '13:00', endTime: '17:30', amount: 0.5 },
        { date: '2026-04-03', type: 'Annual', amount: 1.0 },
        { date: '2026-04-07', type: 'Annual', amount: 1.0 }
      ]
    },
    {
      name: 'Lakshika Perera',
      id: '5eb7dbc7-6e87-4cd9-9f66-a23b0229e45e',
      leaves: [
        { date: '2026-01-20', type: 'Annual', startTime: '08:30', endTime: '13:00', amount: 0.5 },
        { date: '2026-02-07', type: 'Annual', amount: 1.0 }
      ]
    },
    {
      name: 'Tharushi Apsara',
      id: '961fa6ab-c47d-494c-8a2d-3b890da00400',
      leaves: [
        { date: '2026-02-06', type: 'Short', startTime: '15:00', endTime: '17:30', amount: 0.3125 }
      ]
    },
    {
      name: 'Dulki Isanka',
      id: 'f8183714-e3be-4186-8f6b-50ec81ca6c00',
      leaves: [
        { date: '2026-04-02', type: 'Annual', amount: 1.0 },
        { date: '2026-04-03', type: 'Annual', amount: 1.0 },
        { date: '2026-04-04', type: 'Annual', amount: 1.0 },
        { date: '2026-04-05', type: 'Annual', amount: 1.0 }
      ]
    }
  ];

  for (const user of data) {
    console.log(`Processing ${user.name}...`);

    // Insert leave requests
    const requests = user.leaves.map(l => ({
      user_id: user.id,
      leave_type: l.type,
      start_date: l.date,
      end_date: l.date,
      start_time: l.startTime || null,
      end_time: l.endTime || null,
      reason: l.reason || (l.amount === 1.0 ? 'Full Day Leave' : 'Half Day Leave'),
      status: 'Approved',
      created_at: new Date().toISOString()
    }));

    const { error: insErr } = await supabase.from('leave_requests').insert(requests);
    if (insErr) {
      console.error(`Error inserting leaves for ${user.name}:`, insErr);
      continue;
    }

    // Calculate new used_leaves
    let annual = 0;
    let short = 0;
    let sick = 0;
    let casual = 0;

    user.leaves.forEach(l => {
      if (l.type === 'Annual') annual += l.amount;
      if (l.type === 'Short') short += l.amount;
      if (l.type === 'Sick') sick += l.amount;
      if (l.type === 'Casual') casual += l.amount;
    });

    // Fetch current balance to add to it (in case they have existing leaves)
    const { data: prof } = await supabase.from('profiles').select('used_leaves').eq('id', user.id).single();
    if (prof && prof.used_leaves) {
      annual += (Number(prof.used_leaves.annual) || 0);
      short += (Number(prof.used_leaves.short) || 0);
      sick += (Number(prof.used_leaves.sick) || Number(prof.used_leaves.medical) || 0);
      casual += (Number(prof.used_leaves.casual) || 0);
    }

    const newUsed = { annual, short, sick, casual };
    const { error: updErr } = await supabase.from('profiles').update({ used_leaves: newUsed }).eq('id', user.id);

    if (updErr) {
      console.error(`Error updating balance for ${user.name}:`, updErr);
    } else {
      console.log(`Balance updated for ${user.name}:`, newUsed);
    }
  }
}

massUpdateLeaves();
