import { supabase } from '../src/lib/supabase';
import fs from 'fs';
import path from 'path';

async function uploadLogo() {
  const logoPath = path.resolve(__dirname, '../src/assets/logo.png');
  const fileBuffer = fs.readFileSync(logoPath);

  // 1. Create branding bucket if it doesn't exist
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.find(b => b.name === 'branding')) {
    await supabase.storage.createBucket('branding', { public: true });
    console.log('Created branding bucket');
  }

  // 2. Upload logo
  const { error } = await supabase.storage
    .from('branding')
    .upload('logo.png', fileBuffer, {
      upsert: true,
      contentType: 'image/png'
    });

  if (error) {
    console.error('Error uploading logo:', error);
  } else {
    const { data } = supabase.storage.from('branding').getPublicUrl('logo.png');
    console.log('Logo uploaded successfully! Public URL:', data.publicUrl);
  }
}

uploadLogo();
