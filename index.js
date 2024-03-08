const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

async function mergePages(pdfPath, outputFilePath, N) {
  if (N <= 0) {
    throw new Error('Number of pages to merge must be greater than 0.');
  }

  // Load the existing PDF
  const existingPdfBytes = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(existingPdfBytes);

  // Create a new PDF document
  const newPdfDoc = await PDFDocument.create();

  for (let i = 0; i < pdfDoc.getPageCount(); i += N) {
    let pageIndices = [];
    for (let j = 0; j < N && i + j < pdfDoc.getPageCount(); j++) {
      pageIndices.push(i + j);
    }
    console.log(`Merging page ${pageIndices.join(',')}`);

    // Embed all pages that will be merged into the new document
    const embeddedPages = await newPdfDoc.embedPdf(pdfDoc, pageIndices);

    // Calculate the width and height of the merged page
    let mergedWidth = 0;
    let maxHeight = 0;
    for (const page of embeddedPages) {
      const { width, height } = page;
      mergedWidth += width;
      maxHeight = Math.max(maxHeight, height);
    }

    // Create a new page in the new document with the calculated dimensions
    const newPage = newPdfDoc.addPage([mergedWidth, maxHeight]);

    // Draw each embedded page onto the new page
    let offsetX = 0;
    for (const embeddedPage of embeddedPages) {
      const { width, height } = embeddedPage;
      newPage.drawPage(embeddedPage, {
        x: offsetX,
        y: maxHeight - height, // Align to the top
        width,
        height,
      });
      offsetX += width; // Increment the offset for the next page
    }
  }

  // Save the new PDF with compression
  const newPdfBytes = await newPdfDoc.save({ useObjectStreams: true });
  fs.writeFileSync(outputFilePath, newPdfBytes);
  console.log(`Merged PDF saved as ${outputFilePath}`);
}

// Read command line arguments
const args = process.argv.slice(2); // Remove the first two elements

if (args.length < 3) {
  console.error('Usage: merge-pdf-pages <inputFilePath> <outputFilePath> <numberOfPagesToMerge>');
  process.exit(1);
}

const inputFilePath = args[0];
const outputFilePath = args[1];
const numberOfPagesToMerge = parseInt(args[2], 10);

if (isNaN(numberOfPagesToMerge) || numberOfPagesToMerge <= 0) {
  console.error('The number of pages to merge must be a positive integer.');
  process.exit(1);
}

// Replace 'your-pdf-file.pdf' with the path to your PDF file, and replace N with the number of pages to merge
mergePages(inputFilePath, outputFilePath, numberOfPagesToMerge).catch(err => console.error(err));