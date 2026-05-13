import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const outputPath = path.join('Profile_Update_Guidance.pdf');
const doc = new PDFDocument({ margin: 40, size: 'A4' });
const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

// Register Fonts
const fontReg = path.join('fonts', 'AbhayaLibre-Regular.ttf');
const fontBold = path.join('fonts', 'AbhayaLibre-Bold.ttf');

doc.registerFont('Sinhala', fontReg);
doc.registerFont('Sinhala-Bold', fontBold);

// COLORS & SETTINGS
const ORANGE = '#E8571A';
const DARK = '#1a1a2e';
const WHITE = '#ffffff';
const DIVIDER = '#e8e8e8';

const PAGE_W = doc.page.width;
const PAGE_H = doc.page.height;
const MARGIN = 40;
const CONTENT_W = PAGE_W - MARGIN * 2;

// Screenshot Paths
const brainDir = 'C:\\Users\\Aurum\\.gemini\\antigravity\\brain\\b5e2221e-ed71-4021-9fd1-02e414ac6013';
const imgStep1 = path.join(brainDir, 'step1_1778151011614.png');
const imgStep2 = path.join(brainDir, 'step2_1778151453152.png');

// ───────────────────────────────────────────────────────────────────
// PAGE 1: Big Centered HR PULSE & Step 1
// ───────────────────────────────────────────────────────────────────

let y = 60;

// Big Centered Title
doc.fontSize(44).fillColor(ORANGE).font('Helvetica-Bold')
   .text('HR PULSE', 0, y, { align: 'center', width: PAGE_W });

y += 55;

// Subtitle
doc.fontSize(14).fillColor(DARK).font('Helvetica-Bold')
   .text('PROFILE UPDATE GUIDANCE', 0, y, { align: 'center', width: PAGE_W });

y += 18;

doc.fontSize(13).fillColor('#666666').font('Sinhala-Bold')
   .text('ප්‍රෝෆයිල් යාවත්කාලීන කිරීමේ උපදෙස් මාලාව', 0, y, { align: 'center', width: PAGE_W });

y += 45;

// Horizontal Rule
doc.moveTo(MARGIN, y)
   .lineTo(PAGE_W - MARGIN, y)
   .strokeColor(ORANGE).lineWidth(2).stroke();

y += 25;

// STEP 1 HEADER
doc.fontSize(15).fillColor(DARK).font('Helvetica-Bold')
   .text('Step 1: Accessing Your Profile Page', MARGIN, y);
doc.fontSize(12).fillColor(ORANGE).font('Sinhala-Bold')
   .text('1 පියවර: ඔබගේ ප්‍රෝෆයිල් පිටුවට පිවිසීම', MARGIN, y + 18);

y += 40;

// Step 1 Instructions
doc.fontSize(10).fillColor('#333333').font('Helvetica')
   .text('Click on the Profile icon or sidebar navigation link to open your active employee profile dashboard.', MARGIN, y, { width: CONTENT_W });
doc.fontSize(9.5).fillColor('#666666').font('Sinhala')
   .text('ඔබගේ ප්‍රෝෆයිල් පිටුවට පිවිසීම සඳහා dashboard එකෙහි දකුණුපස ඉහළ කෙළවරේ ඇති ප්‍රෝෆයිල් අයිකනය හෝ Profile මෙනු එක ක්ලික් කරන්න.', MARGIN, y + 16, { width: CONTENT_W });

y += 48;

// Embed Step 1 Screenshot
if (fs.existsSync(imgStep1)) {
  doc.image(imgStep1, MARGIN + 12, y, { width: CONTENT_W - 24 });
} else {
  console.warn('⚠️ Screenshot 1 missing at:', imgStep1);
  doc.rect(MARGIN + 12, y, CONTENT_W - 24, 240).stroke('#ccc');
  doc.fontSize(10).fillColor('#999').text('[Screenshot 1 Placeholder]', MARGIN + 100, y + 100);
}

// ───────────────────────────────────────────────────────────────────
// PAGE 2: Step 2 & Note Box
// ───────────────────────────────────────────────────────────────────
doc.addPage();
y = 40;

// STEP 2 HEADER
doc.fontSize(15).fillColor(DARK).font('Helvetica-Bold')
   .text('Step 2: Updating Details via Unified Popup Modal', MARGIN, y);
doc.fontSize(12).fillColor(ORANGE).font('Sinhala-Bold')
   .text('2 පියවර: ප්‍රෝෆයිල් සහ බැංකු විස්තර යාවත්කාලීන කිරීම', MARGIN, y + 18);

y += 40;

// Step 2 Instructions
doc.fontSize(10).fillColor('#333333').font('Helvetica')
   .text('Click "Edit Profile" to open the single editor. Employees and HR can update First Name, Last Name, Nickname, NIC Number, and Bank details simultaneously in one screen.', MARGIN, y, { width: CONTENT_W });
doc.fontSize(9.5).fillColor('#666666').font('Sinhala')
   .text('"Edit Profile" ක්ලික් කර සංස්කරණ කවුළුව විවෘත කරන්න. එහිදී ඔබගේ පුද්ගලික තොරතුරු (මුල් නම, වාසගම, පටබැඳි නම, හැඳුනුම්පත් අංකය) සහ බැංකු ගිණුම් විස්තර එකවර සංස්කරණය කළ හැක.', MARGIN, y + 16, { width: CONTENT_W });

y += 50;

// Embed Step 2 Screenshot
if (fs.existsSync(imgStep2)) {
  doc.image(imgStep2, MARGIN + 12, y, { width: CONTENT_W - 24 });
} else {
  console.warn('⚠️ Screenshot 2 missing at:', imgStep2);
  doc.rect(MARGIN + 12, y, CONTENT_W - 24, 240).stroke('#ccc');
}

y += 245; // Adjust Y position after image

// Important Notice Box (Green Theme)
doc.roundedRect(MARGIN, y, CONTENT_W, 65, 6).fill('#F0FFF4');
doc.roundedRect(MARGIN, y, CONTENT_W, 65, 6).stroke('#68D391');

doc.fontSize(10).fillColor('#276749').font('Helvetica-Bold')
   .text('✓  IMPORTANT NOTICE  /  වැදගත් නිවේදනය', MARGIN + 15, y + 10);
doc.fontSize(8.5).fillColor('#276749').font('Helvetica')
   .text('Please double-check your account number and NIC. HR relies on this information for payroll calculations.', MARGIN + 15, y + 25, { width: CONTENT_W - 30 });
doc.fontSize(8).fillColor('#276749').font('Sinhala')
   .text('වැටුප් සකස් කිරීම සඳහා මෙම තොරතුරු සෘජුවම භාවිත කරන බැවින් බැංකු ගිණුම් අංකය සහ හැඳුනුම්පත් අංකය නිවැරදි බව නැවත පරීක්ෂා කරන්න.', MARGIN + 15, y + 38, { width: CONTENT_W - 30 });

doc.end();
stream.on('finish', () => {
  console.log(`\n✅ PDF saved with screenshots → ${path.resolve(outputPath)}\n`);
});
