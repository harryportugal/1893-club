import { Jimp } from 'jimp';

async function main() {
  try {
    console.log('Loading ctafinal.png...');
    const image = await Jimp.read('public/ctafinal.png');

    console.log('Processing pixels to remove black background...');
    const width = image.bitmap.width;
    const height = image.bitmap.height;

    // Loop through every pixel
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (width * y + x) * 4;
        const r = image.bitmap.data[idx];
        const g = image.bitmap.data[idx + 1];
        const b = image.bitmap.data[idx + 2];

        // If the pixel is very dark (RGB < 25), make it fully transparent
        if (r < 25 && g < 25 && b < 25) {
          image.bitmap.data[idx + 3] = 0; // Alpha = 0
        }
      }
    }

    console.log('Saving processed image...');
    await image.write('public/ctafinal_transparent.png');
    console.log('Done! Saved to public/ctafinal_transparent.png');
  } catch (error) {
    console.error('Error processing image:', error);
  }
}

main();
