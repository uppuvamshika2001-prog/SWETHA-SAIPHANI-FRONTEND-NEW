const { Jimp } = require('jimp');
const path = require('path');
const fs = require('fs');

const images = [
    'dr_sai_phani_chandra_v3.png',
    'dr_swetha_pendyala_v2.jpg',
    'dr_roshan_kumar_jaiswal_v2.png',
    'dr_hariprakash_v2.png'
];

async function processImages() {
    console.log('Starting processing...');
    for (const file of images) {
        try {
            const filePath = path.join(__dirname, 'public', file);
            if (!fs.existsSync(filePath)) {
                console.error(`File not found: ${filePath}`);
                continue;
            }
            console.log(`Reading ${filePath}...`);
            const image = await Jimp.read(filePath);
            const width = image.bitmap.width;
            const height = image.bitmap.height;
            console.log(`Image dimensions: ${width}x${height}`);

            // Crop bottom 60 pixels
            const cropAmount = 60;
            if (height > cropAmount) {
                // Jimp crop is x, y, w, h
                image.crop({ x: 0, y: 0, w: width, h: height - cropAmount });

                // Construct new filename: name_clean.ext
                const ext = path.extname(file);
                const name = path.basename(file, ext);
                const newFile = `${name}_clean${ext}`;
                const newPath = path.join(__dirname, 'public', newFile);

                console.log(`Writing to ${newPath}...`);
                await image.write(newPath); // write is often synchronous-ish or returns promise in newer jimp? 
                // In jimp v1, write returns promise? check usage. 
                // If write() takes a callback, I should wrap it or use writeAsync if available.
                // Checking previous output, Jimp.read was function.
            } else {
                console.log(`Skipping ${file}: Image too small`);
            }
        } catch (err) {
            console.error(`Error processing ${file}:`, err);
        }
    }
    console.log('All done.');
}

// In Jimp v1, write might be async or sync?
// I'll try write(path) and see. Or verify writeAsync existence.
// If Jimp definition is found, I'll assume write handles it.
processImages();
