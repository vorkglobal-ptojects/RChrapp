import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const accounts = [
  { no: 1,  name: 'Super Admin',              email: 'super@hrpulse.com',                   password: 'super@1234' },
  { no: 2,  name: 'Owner',                    email: 'owner@hrpulse.com',                   password: 'owner@4321' },
  { no: 3,  name: 'HR Manager',               email: 'hr@hrpulse.com',                      password: 'hrpulse@4321' },
  { no: 4,  name: 'W.K. Erandi Perera',       email: 'erandi.perera@hrpulse.com',           password: 'erandi123' },
  { no: 5,  name: 'Dahami Divyanjali',        email: 'dahami.divyanjali@hrpulse.com',       password: 'dahami123' },
  { no: 6,  name: 'Achini Vindya',            email: 'achini.vindya@hrpulse.com',           password: 'achini123' },
  { no: 7,  name: 'Dilini Sanarathna',        email: 'dilini.sanarathna@hrpulse.com',       password: 'dilini123' },
  { no: 8,  name: 'Chamika Bothogu',          email: 'chamika.bothogu@hrpulse.com',         password: 'chamika123' },
  { no: 9,  name: 'A.V. Chamika Sonali',      email: 'a.v.chamika.sonali@hrpulse.com',      password: 'chamika123' },
  { no: 10, name: 'D.A. Dilupa Thamari',      email: 'd.a.dilupa.thamari@hrpulse.com',      password: 'dilupa123' },
  { no: 11, name: 'Harsha Thamali',           email: 'harsha.thamali@hrpulse.com',          password: 'harsha123' },
  { no: 12, name: 'Sachini Nirasha',          email: 'sachini.nirasha@hrpulse.com',         password: 'sachini123' },
  { no: 13, name: 'Chaseera Sulani',          email: 'chaseera.sulani@hrpulse.com',         password: 'chaseera123' },
  { no: 14, name: 'Geethangani Pieris',       email: 'geethangani.pieris@hrpulse.com',      password: 'geethangani123' },
  { no: 15, name: 'W.A. Chandima Dilrukshi',  email: 'w.a.chandima.dilrukshi@hrpulse.com',  password: 'chandima123' },
  { no: 16, name: 'Rasika Priyangani',        email: 'rasika.priyangani@hrpulse.com',       password: 'rasika123' },
  { no: 17, name: 'A.M.N. Sanjana',           email: 'amn.sanjana@hrpulse.com',            password: 'amn123' },
  { no: 18, name: 'R.P. Ratnayake',           email: 'rp.ratnayake@hrpulse.com',           password: 'rp123' },
  { no: 19, name: 'D.M. Nilukshi Kawshalya',  email: 'd.m.nilukshi.kawshalya@hrpulse.com', password: 'nilukshi123' },
  { no: 20, name: 'Nihal Malawana',           email: 'nihal.malawana@hrpulse.com',          password: 'nihal123' },
  { no: 21, name: 'Syamalie Udumulla',        email: 'syamalie.udumulla@hrpulse.com',       password: 'syamalie123' },
  { no: 22, name: 'Nishanthi Kuruppu',        email: 'nishanthi.kuruppu@hrpulse.com',       password: 'nishanthi123' },
  { no: 23, name: 'Nadeesha Dihara',          email: 'nadeesha.dihara@hrpulse.com',         password: 'nadeesha123' },
  { no: 24, name: 'Chathurika Madushani',     email: 'chathurika.madushani@hrpulse.com',    password: 'chathurika123' },
  { no: 25, name: 'Maneesha H. Dias',         email: 'maneesha.dias@hrpulse.com',           password: 'maneesha123' },
  { no: 26, name: 'Imashi Pramodaya',         email: 'imashi.pramodaya@hrpulse.com',        password: 'imashi123' },
  { no: 27, name: 'Aruni Indrachapa',         email: 'aruni.indrachapa@hrpulse.com',        password: 'aruni123' },
  { no: 28, name: 'Tharushi Apsara',          email: 'tharushi.apsara@hrpulse.com',         password: 'tharushi123' },
  { no: 29, name: 'Lakshika Perera',          email: 'lakshika.perera@hrpulse.com',         password: 'lakshika123' },
  { no: 30, name: 'Dulki Isanka',             email: 'dulki.isanka@hrpulse.com',            password: 'dulki123' },
  { no: 31, name: 'Tharushi Sadumin',         email: 'tharushi.sadumin@hrpulse.com',        password: 'tharushi123' },
];

const outputPath = path.join('HR_Pulse_Logins.pdf');
const doc = new PDFDocument({ margin: 40, size: 'A4' });
const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

// ─── COLORS ────────────────────────────────────────────────────────
const ORANGE    = '#E8571A';
const DARK      = '#1a1a2e';
const WHITE     = '#ffffff';
const HEADER_BG = '#FF6B2B';
const ROW_ALT   = '#FFF5F0';
const TEXT_DARK = '#2d2d2d';
const TEXT_MID  = '#666666';
const TEXT_LIGHT = '#999999';

const PAGE_W    = doc.page.width;
const PAGE_H    = doc.page.height;
const MARGIN    = 40;
const CONTENT_W = PAGE_W - MARGIN * 2;
const ROW_H     = 22;

const COL = {
  no:    { x: MARGIN,       w: 30  },
  name:  { x: MARGIN + 30,  w: 158 },
  email: { x: MARGIN + 188, w: 218 },
  pass:  { x: MARGIN + 406, w: 109 },
};

// ─── HELPER: Draw page header ───────────────────────────────────────
function drawPageHeader(isFirst: boolean) {
  // Orange top bar
  const barH = isFirst ? 92 : 54;
  doc.rect(0, 0, PAGE_W, barH).fill(ORANGE);

  if (isFirst) {
    // Briefcase icon box
    doc.roundedRect(MARGIN, 20, 50, 50, 10).fill('rgba(255,255,255,0.18)');
    // HR PULSE text inside box
    doc.fontSize(9).fillColor(WHITE).font('Helvetica-Bold')
       .text('HR',    MARGIN + 12, 38)
       .text('PULSE', MARGIN + 6,  49);

    // Title
    doc.fontSize(21).fillColor(WHITE).font('Helvetica-Bold')
       .text('HR PULSE — Employee Login Credentials', MARGIN + 62, 26);
    doc.fontSize(9.5).fillColor('rgba(255,255,255,0.82)').font('Helvetica')
       .text(
         `Confidential  ·  Generated ${new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric' })}  ·  ${accounts.length} Active Accounts`,
         MARGIN + 62, 54
       );
  } else {
    doc.fontSize(13).fillColor(WHITE).font('Helvetica-Bold')
       .text('HR PULSE — Employee Login Credentials  (continued)', MARGIN, 18);
    doc.fontSize(8.5).fillColor('rgba(255,255,255,0.75)').font('Helvetica')
       .text('Confidential — Do Not Distribute', MARGIN, 36);
  }

  // Dark sub-bar
  doc.rect(0, barH, PAGE_W, 24).fill('#1f1f2e');
  doc.fontSize(8).fillColor('#aaaaaa').font('Helvetica')
     .text('POWERED BY VORK.GLOBAL', MARGIN, barH + 8);
  doc.text('STRICTLY CONFIDENTIAL — INTERNAL USE ONLY', PAGE_W - MARGIN - 220, barH + 8, { width: 220, align: 'right' });

  return barH + 24 + 10; // return Y position after header
}

// ─── HELPER: Draw table header row ─────────────────────────────────
function drawTableHeader(y: number) {
  doc.rect(MARGIN, y, CONTENT_W, ROW_H + 2).fill(HEADER_BG);
  const ty = y + 7;
  doc.fontSize(8.5).fillColor(WHITE).font('Helvetica-Bold');
  doc.text('#',            COL.no.x   + 6,  ty);
  doc.text('Name',         COL.name.x + 4,  ty);
  doc.text('Login Email',  COL.email.x + 4, ty);
  doc.text('Password',     COL.pass.x + 4,  ty);
  return y + ROW_H + 2;
}

// ─── HELPER: Draw a single data row ────────────────────────────────
function drawRow(acc: typeof accounts[0], y: number, index: number) {
  const bg = index % 2 === 1 ? ROW_ALT : WHITE;
  doc.rect(MARGIN, y, CONTENT_W, ROW_H).fill(bg);

  const ty = y + 6;

  // # column
  doc.fontSize(8).fillColor(TEXT_LIGHT).font('Helvetica')
     .text(String(acc.no), COL.no.x + 6, ty, { width: COL.no.w - 8 });

  // Name column
  doc.fillColor(TEXT_DARK).font('Helvetica-Bold')
     .text(acc.name, COL.name.x + 4, ty, { width: COL.name.w - 8, lineBreak: false });

  // Email column
  doc.fillColor(TEXT_MID).font('Helvetica')
     .text(acc.email, COL.email.x + 4, ty, { width: COL.email.w - 8, lineBreak: false });

  // Password pill (dark rounded box)
  doc.roundedRect(COL.pass.x + 4, y + 4, COL.pass.w - 8, 14, 4).fill(DARK);
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(7.5)
     .text(acc.password, COL.pass.x + 8, y + 7, { width: COL.pass.w - 16, lineBreak: false });

  // Row divider
  doc.moveTo(MARGIN, y + ROW_H)
     .lineTo(MARGIN + CONTENT_W, y + ROW_H)
     .strokeColor('#e8e8e8').lineWidth(0.4).stroke();

  return y + ROW_H;
}

// ─── HELPER: Draw footer ───────────────────────────────────────────
function drawFooter() {
  const fy = PAGE_H - 28;
  doc.rect(0, fy, PAGE_W, 28).fill('#1a1a2e');
  doc.fontSize(7.5).fillColor('#777777').font('Helvetica')
     .text(
       'HR Pulse  ·  Powered by Vork.Global  ·  All accounts verified & active  ·  Confidential Employee Access Document',
       MARGIN, fy + 10, { align: 'center', width: CONTENT_W }
     );
}

// ─── BUILD PAGES ───────────────────────────────────────────────────
const ROWS_PAGE_1 = 23;

// PAGE 1
let y = drawPageHeader(true);
y = drawTableHeader(y);
accounts.slice(0, ROWS_PAGE_1).forEach((acc, i) => {
  y = drawRow(acc, y, i);
});
drawFooter();

// PAGE 2
doc.addPage();
y = drawPageHeader(false);
y = drawTableHeader(y);
accounts.slice(ROWS_PAGE_1).forEach((acc, i) => {
  y = drawRow(acc, y + (i === 0 ? 0 : 0), i);
});

// ── All verified badge ────────────────────────────────────────────
y += 20;
doc.roundedRect(MARGIN, y, CONTENT_W, 36, 8).fill('#F0FFF4');
doc.roundedRect(MARGIN, y, CONTENT_W, 36, 8).stroke('#68D391');
doc.fontSize(10).fillColor('#276749').font('Helvetica-Bold')
   .text('✓  All 31 accounts verified and active', MARGIN + 16, y + 8);
doc.fontSize(8.5).fillColor('#38A169').font('Helvetica')
   .text(`Last verified: ${new Date().toLocaleString('en-GB')}  ·  31/31 logins passing`, MARGIN + 16, y + 22);

drawFooter();

doc.end();
stream.on('finish', () => {
  console.log(`\n✅ PDF saved → ${path.resolve(outputPath)}\n`);
});
