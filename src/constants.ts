import { UserProfile, Holiday } from './types';

export const MOCK_EMPLOYEES_DATA = [
  { branch: 'Borella', name: 'Dahami Divyanjali', joinDate: '2024-06-05', salaryA: 27000, salaryB: 30000, epf: 2400, advances: 0, cover: 0, intensive: 1000, travelling: 4550, net: 30150, role: 'employee' },
  { branch: 'Borella', name: 'Achini Vindya', joinDate: '2024-02-22', salaryA: 30000, salaryB: 30000, epf: 2400, advances: 0, cover: 0, intensive: 2000, travelling: 3180, net: 32780, role: 'employee' },
  { branch: 'Kahathuduwa', name: 'Dilini Sanarathna', joinDate: '2026-03-04', salaryA: 35000, salaryB: 0, epf: 0, advances: 0, cover: 0, intensive: 0, travelling: 2880, net: 37880, role: 'employee' },
  { branch: 'Dematagoda', name: 'Chamilka Botheju', joinDate: '2002-08-02', salaryA: 32000, salaryB: 30000, epf: 2400, advances: 0, cover: 0, intensive: 8000, travelling: 0, net: 37600, role: 'employee' },
  { branch: 'Dematagoda', name: 'A.V. Chamika Sonali', joinDate: '2026-01-12', salaryA: 27000, salaryB: 30000, epf: 2400, advances: 0, cover: 0, intensive: 0, travelling: 3360, net: 27960, role: 'employee' },
  { branch: 'Homagama', name: 'D.A. Dilupa Thamari', joinDate: '2002-09-01', salaryA: 29000, salaryB: 30000, epf: 2400, advances: 0, cover: 0, intensive: 8000, travelling: 0, net: 34600, role: 'employee' },
  { branch: 'Homagama', name: 'Harsha Thamali', joinDate: '2017-09-01', salaryA: 27000, salaryB: 30000, epf: 2400, advances: 28100, cover: 0, intensive: 3500, travelling: 0, net: 0, role: 'employee' },
  { branch: 'Kadawatha', name: 'Sachini Nirasha', joinDate: '2022-07-01', salaryA: 30000, salaryB: 30000, epf: 2400, advances: 0, cover: 0, intensive: 1500, travelling: 0, net: 29100, role: 'employee' },
  { branch: 'Kadawatha', name: 'Chaseera Sulani', joinDate: '2024-03-12', salaryA: 27000, salaryB: 30000, epf: 2400, advances: 0, cover: 0, intensive: 500, travelling: 0, net: 25100, role: 'employee' },
  { branch: 'Kiribathgoda', name: 'Geethangani Pieris', joinDate: '2019-01-09', salaryA: 30000, salaryB: 30000, epf: 2400, advances: 0, cover: 0, intensive: 3000, travelling: 3900, net: 24500, role: 'employee' },
  { branch: 'Kiribathgoda', name: 'W.K. Erandi Perera', joinDate: '2026-02-03', salaryA: 27000, salaryB: 30000, epf: 2400, advances: 0, cover: 0, intensive: 0, travelling: 1440, net: 26040, role: 'employee' },
  { branch: 'Kottawa', name: 'W.A. Chandima Dilrukishi', joinDate: '2015-01-06', salaryA: 28000, salaryB: 30000, epf: 2400, advances: 0, cover: 0, intensive: 5000, travelling: 0, net: 30600, role: 'employee' },
  { branch: 'Kottawa', name: 'Rasika Priyangani', joinDate: '2017-02-07', salaryA: 34000, salaryB: 30000, epf: 2400, advances: 0, cover: 0, intensive: 4000, travelling: 1000, net: 36600, role: 'employee' },
  { branch: 'Office', name: 'A.M.N. Sanjana', joinDate: '1997-03-01', salaryA: 29750, salaryB: 30000, epf: 2400, advances: 0, cover: 0, intensive: 8000, travelling: 0, net: 35350, role: 'employee' },
  { branch: 'Office', name: 'R.P. Ratnayake', joinDate: '1992-01-01', salaryA: 27500, salaryB: 0, epf: 0, advances: 0, cover: 0, intensive: 0, travelling: 0, net: 27500, role: 'employee' },
  { branch: 'Office', name: 'Nihal Malawana', joinDate: '1992-01-01', salaryA: 34500, salaryB: 0, epf: 0, advances: 0, cover: 0, intensive: 0, travelling: 10780, net: 45280, role: 'employee' },
  { branch: 'Office', name: 'Syamalie Udumulla (P/T)', joinDate: '2000-01-01', salaryA: 11000, salaryB: 0, epf: 0, advances: 0, cover: 0, intensive: 0, travelling: 0, net: 11000, role: 'employee' },
  { branch: 'Office', name: 'Nishanthi Kuruppu', joinDate: '1997-07-10', salaryA: 33200, salaryB: 30000, epf: 2400, advances: 0, cover: 0, intensive: 8000, travelling: 2000, net: 40800, role: 'employee' },
  { branch: 'Office', name: 'Nadeesha Dilhara', joinDate: '2022-11-10', salaryA: 38000, salaryB: 30000, epf: 2400, advances: 0, cover: 0, intensive: 1500, travelling: 1875, net: 38975, role: 'employee' },
  { branch: 'Homagama', name: 'Chathurika Madushani', joinDate: '2026-01-12', salaryA: 27000, salaryB: 30000, epf: 2400, advances: 0, cover: 0, intensive: 0, travelling: 2990, net: 27590, role: 'employee' },
  { branch: 'Panadura', name: 'Maneesha H. Dias', joinDate: '2016-01-25', salaryA: 35000, salaryB: 30000, epf: 2400, advances: 0, cover: 0, intensive: 4500, travelling: 1620, net: 38720, role: 'employee' },
  { branch: 'Panadura', name: 'Imashi Pramodaya', joinDate: '2025-11-26', salaryA: 27000, salaryB: 30000, epf: 2400, advances: 0, cover: 0, intensive: 0, travelling: 2025, net: 26625, role: 'employee' },
  { branch: 'W2', name: 'Aruni Indrachapa', joinDate: '2022-11-03', salaryA: 27000, salaryB: 30000, epf: 2400, advances: 0, cover: 0, intensive: 1000, travelling: 0, net: 25600, role: 'employee' },
  { branch: 'Office', name: 'Tharushi Sadurnin', joinDate: '2025-12-09', salaryA: 27000, salaryB: 30000, epf: 2400, advances: 0, cover: 0, intensive: 0, travelling: 3000, net: 27600, role: 'employee' },
  { branch: 'W3', name: 'Lakshika Perera', joinDate: '2017-09-01', salaryA: 27000, salaryB: 30000, epf: 2400, advances: 0, cover: 0, intensive: 3500, travelling: 2000, net: 30100, role: 'employee' },
  { branch: 'W3', name: 'Tharushi Apsara', joinDate: '2025-07-22', salaryA: 27000, salaryB: 30000, epf: 2400, advances: 0, cover: 0, intensive: 0, travelling: 0, net: 24600, role: 'employee' },
  { branch: 'W4', name: 'D.M. Nilukshi Kawshalya', joinDate: '2013-01-07', salaryA: 29000, salaryB: 30000, epf: 2400, advances: 0, cover: 0, intensive: 5500, travelling: 4650, net: 36750, role: 'employee' },
  { branch: 'W3', name: 'Dulki Isanka', joinDate: '2022-04-04', salaryA: 27000, salaryB: 30000, epf: 2400, advances: 0, cover: 0, intensive: 1500, travelling: 0, net: 26100, role: 'employee' }
];

export const HOLIDAYS: Holiday[] = [
  { id: '1', date: '2026-01-01', title: 'New Year\'s Day', type: 'Public' },
  { id: '2', date: '2026-01-14', title: 'Tamil Thai Pongal Day', type: 'Public' },
  { id: '3', date: '2026-02-04', title: 'Independence Day', type: 'Public' },
  { id: '4', date: '2026-04-13', title: 'Sinhala & Tamil New Year Eve', type: 'Public' },
  { id: '5', date: '2026-04-14', title: 'Sinhala & Tamil New Year Day', type: 'Public' },
  { id: '6', date: '2026-05-01', title: 'May Day', type: 'Public' },
  { id: '7', date: '2026-12-25', title: 'Christmas Day', type: 'Public' },
];
