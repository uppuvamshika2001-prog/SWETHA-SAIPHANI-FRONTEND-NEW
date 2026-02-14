const Jimp = require('jimp');
const path = require('path');

const images = [
    'dr_sai_phani_chandra_v3.png',
    'dr_swetha_pendyala_v2.jpg',
    'dr_roshan_kumar_jaiswal_v2.png',
    'dr_hariprakash_v2.png'
];

async function processImages() {
    for (const file of images) {
        try {
            const filePath = path.join(__dirname, 'public', file);
            console.log(`Reading ${filePath}...`);
            const image = await Jimp.read(filePath);
            const width = image.bitmap.width;
            const height = image.bitmap.height;

            // Crop bottom 60 pixels to be safe (watermark is usually in the bottom 40-50px)
            const cropAmount = 60;
            if (height > cropAmount) {
                image.crop(0, 0, width, height - cropAmount);

                const newFile = file.replace(/(\.[\w\d_-]+)$/i, '_clean$1');
                const newPath = path.join(__dirname, 'public', newFile);

                await image.writeAsync(newPath);
                console.log(`Processed ${file} -> ${newFile}`);
            } else {
                console.log(`Skipping ${file}: Image too small`);
            }
        } catch (err) {
            console.error(`Error processing ${file}:`, err);
        }
    }
}

processImages();
