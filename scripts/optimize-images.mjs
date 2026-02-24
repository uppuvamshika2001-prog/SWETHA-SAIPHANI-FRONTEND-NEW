/**
 * Image Optimization Script
 * Converts all relevant public images to WebP format with multiple responsive sizes.
 * Generates: small (480w), medium (800w), large (1200w) variants.
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '..', 'public');
const optimizedDir = path.resolve(publicDir, 'optimized');

// Ensure output directory exists
if (!fs.existsSync(optimizedDir)) {
  fs.mkdirSync(optimizedDir, { recursive: true });
}

// Images used on the homepage and their target qualities
const imageConfigs = [
  // Hero carousel doctor images
  { src: 'dr_sai_phani_chandra_v2.png', quality: 75, maxWidth: 800 },
  { src: 'dr_swetha_pendyala_v2.jpg', quality: 75, maxWidth: 800 },
  { src: 'dr_roshan_kumar_jaiswal_v2.png', quality: 75, maxWidth: 800 },
  { src: 'dr_hariprakash_v2.png', quality: 75, maxWidth: 800 },
  { src: 'dr_ravikanti_nagaraju.jpg', quality: 75, maxWidth: 800 },

  // Doctor cards (DoctorsSection)
  { src: 'dr_swetha_pendyala_v2_clean.jpg', quality: 75, maxWidth: 600 },
  { src: 'dr_sai_phani_chandra_v3_clean.png', quality: 75, maxWidth: 600 },
  { src: 'dr_roshan_kumar_jaiswal_v2_clean.png', quality: 75, maxWidth: 600 },
  { src: 'dr_hariprakash_v2_clean.png', quality: 75, maxWidth: 600 },
  { src: 'dr_ravikanti_nagaraju.jpg', quality: 75, maxWidth: 600 },
  { src: 'dr_mahesh_gudelli.jpg', quality: 75, maxWidth: 600 },
  { src: 'dr_navya_sri.jpg', quality: 75, maxWidth: 600 },
  { src: 'dr_sneha_sagar.jpg', quality: 75, maxWidth: 600 },
  { src: 'dr_t_dheeraj.jpg', quality: 75, maxWidth: 600 },

  // About section
  { src: 'advanced-medical-care.jpg', quality: 75, maxWidth: 800 },

  // Logo (used in navbar and footer)
  { src: 'swetha-saiphani-logo.png', quality: 80, maxWidth: 200 },

  // Footer partner banner
  { src: 'images/resonira-partner.jpeg', quality: 70, maxWidth: 1400 },

  // About dialog images
  { src: 'hero-patient-room.png', quality: 70, maxWidth: 800 },
];

// Responsive breakpoints
const sizes = [
  { suffix: '-sm', width: 480 },
  { suffix: '-md', width: 800 },
  { suffix: '-lg', width: 1200 },
];

async function optimizeImage(config) {
  const srcPath = path.resolve(publicDir, config.src);
  if (!fs.existsSync(srcPath)) {
    console.warn(`⚠️  Skipping (not found): ${config.src}`);
    return;
  }

  const baseName = path.basename(config.src, path.extname(config.src));
  const image = sharp(srcPath);
  const metadata = await image.metadata();
  const origWidth = metadata.width || config.maxWidth;
  const origHeight = metadata.height || 600;

  console.log(`\n📷 Processing: ${config.src} (${origWidth}x${origHeight})`);

  // Generate a single optimized version (capped to maxWidth)
  const targetWidth = Math.min(origWidth, config.maxWidth);
  const outName = `${baseName}.webp`;
  const outPath = path.resolve(optimizedDir, outName);

  await sharp(srcPath)
    .resize(targetWidth, null, { withoutEnlargement: true })
    .webp({ quality: config.quality, effort: 6 })
    .toFile(outPath);

  const origSize = fs.statSync(srcPath).size;
  const newSize = fs.statSync(outPath).size;
  const savings = Math.round((1 - newSize / origSize) * 100);

  console.log(`   ✅ ${outName}: ${Math.round(newSize / 1024)}KB (saved ${savings}%)`);

  // Generate responsive sizes
  for (const size of sizes) {
    const responsiveName = `${baseName}${size.suffix}.webp`;
    const responsivePath = path.resolve(optimizedDir, responsiveName);

    await sharp(srcPath)
      .resize(size.width, null, { withoutEnlargement: true })
      .webp({ quality: config.quality, effort: 6 })
      .toFile(responsivePath);

    const rSize = fs.statSync(responsivePath).size;
    console.log(`   📐 ${responsiveName}: ${Math.round(rSize / 1024)}KB (${size.width}w)`);
  }
}

async function main() {
  console.log('🚀 Starting image optimization...\n');
  console.log(`Input directory: ${publicDir}`);
  console.log(`Output directory: ${optimizedDir}\n`);

  // De-duplicate configs (same src)
  const uniqueConfigs = [];
  const seen = new Set();
  for (const config of imageConfigs) {
    if (!seen.has(config.src)) {
      seen.add(config.src);
      uniqueConfigs.push(config);
    }
  }

  for (const config of uniqueConfigs) {
    try {
      await optimizeImage(config);
    } catch (err) {
      console.error(`❌ Error processing ${config.src}: ${err.message}`);
    }
  }

  // Summary
  console.log('\n\n📊 Optimization Summary:');
  const optimizedFiles = fs.readdirSync(optimizedDir);
  let totalSize = 0;
  for (const f of optimizedFiles) {
    totalSize += fs.statSync(path.join(optimizedDir, f)).size;
  }
  console.log(`   Total optimized files: ${optimizedFiles.length}`);
  console.log(`   Total optimized size: ${Math.round(totalSize / 1024)}KB`);
  console.log('\n✨ Done!');
}

main().catch(console.error);
