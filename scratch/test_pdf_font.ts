import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const doc = new PDFDocument({ margin: 40, size: 'A4' });
const stream = fs.createWriteStream(path.join('scratch', 'test_font.pdf'));
doc.pipe(stream);

try {
  console.log('🔄 Attempting to register Nirmala.ttc...');
  // Pass the name of the font in the collection as the third argument
  doc.registerFont('SinhalaFont', 'C:\\Windows\\Fonts\\Nirmala.ttc', 'Nirmala UI');
  doc.font('SinhalaFont');
  
  doc.fontSize(16).text('Hello World! / ආයුබෝවන්!');
  doc.fontSize(12).text('ප්‍රෝෆයිල් යාවත්කාලීන කිරීමේ උපදෙස් මාලාව');
  doc.end();
  
  stream.on('finish', () => {
    console.log('✅ PDF test generated successfully!');
  });
} catch (err: any) {
  console.error('❌ Failed to register font:', err.message);
}
