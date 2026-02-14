const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/data/mockData.ts');

try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    // We want to keep lines up to 737.
    // lines array is 0-indexed.
    // Line 737 in 1-based index is index 736.
    // So we slice from 0 to 737 (exclusive of 737 index? No, slice end is exclusive).
    // If we want 0..736, we slice(0, 737).

    if (lines.length > 737) {
        const newLines = lines.slice(0, 737);
        const newContent = newLines.join('\n');
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log('Successfully truncated mockData.ts');
    } else {
        console.log('File is not longer than 737 lines, no truncation needed.');
    }
} catch (err) {
    console.error('Error fixing file:', err);
    process.exit(1);
}
