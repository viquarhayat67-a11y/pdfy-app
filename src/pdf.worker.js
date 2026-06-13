import { PDFDocument, PDFRawStream, PDFName, PDFNumber } from 'pdf-lib';
import pako from 'pako';

self.onmessage = async (e) => {
  const { action, fileBuffer } = e.data;

  if (action === 'compress') {
    try {
      self.postMessage({ status: '⏳ Background thread parsing binary data maps...' });
      
      // Explicitly load the document bytes into the local context instance
      const pdfDoc = await PDFDocument.load(fileBuffer);
      const indirectObjects = pdfDoc.context.enumerateIndirectObjects();
      let compressedStreamsCount = 0;

      // Use native PDFName instantiators to safely query the dictionary keys without crashing the compiler
      const filterKey = PDFName.of('Filter');
      const lengthKey = PDFName.of('Length');
      const flateDecodeValue = PDFName.of('FlateDecode');

      indirectObjects.forEach(([ref, object]) => {
        // Validate if the object is an instance of a raw stream block
        if (object instanceof PDFRawStream) {
          const dict = object.dict;
          const hasFilter = dict.get(filterKey);
          
          // Only compress if the stream doesn't already have a filter compression layer applied
          if (!hasFilter) {
            try {
              const uncompressedData = object.contents;
              const compressedData = pako.deflate(uncompressedData);
              
              // Apply the compressed byte properties back into the document layout map safely
              object.contents = compressedData;
              dict.set(filterKey, flateDecodeValue);
              dict.set(lengthKey, PDFNumber.of(compressedData.length));
              compressedStreamsCount++;
            } catch (err) {
              // Skip streams that are structurally locked or encrypted
            }
          }
        }
      });

      self.postMessage({ status: `⚡ Deflated ${compressedStreamsCount} data streams. Compiling object dictionary pools...` });
      
      const compressedBytes = await pdfDoc.save({
        useObjectStreams: true,
        addUnreferencedObjectsToOriginalPool: false,
        objectsPerStream: 500
      });

      // Transfer the cleaned ArrayBuffer payload back to the main UI thread window loop
      self.postMessage({ 
        success: true, 
        resultBuffer: compressedBytes 
      }, [compressedBytes.buffer]);

    } catch (err) {
      self.postMessage({ success: false, error: err.message });
    }
  }
};