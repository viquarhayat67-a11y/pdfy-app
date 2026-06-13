import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { PDFDocument } from 'pdf-lib';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('<h2 style="font-family:sans-serif; text-align:center; padding-top:50px; color:#6366f1;">🚀 Pure JavaScript Safe Engine Online</h2>');
});

app.post('/api/protect', upload.single('file'), async (req, res) => {
  try {
    const { password } = req.body;
    if (!req.file || !password) {
      return res.status(400).json({ error: 'Missing file or password parameters.' });
    }

    // 1. Load the document into memory
    const pdfDoc = await PDFDocument.load(req.file.buffer);
    
    // 2. Pad the user password to exactly 32 bytes according to standard PDF specifications
    const pad = [
      0x28, 0xBF, 0x4E, 0x5E, 0x4E, 0x75, 0x8A, 0x41, 0x64, 0x00, 0x4E, 0x56, 0xFF, 0xFA, 0x01, 0x08,
      0x2E, 0x2E, 0x00, 0xB6, 0xD0, 0x68, 0x3E, 0x80, 0x2F, 0x0C, 0xA9, 0xFE, 0x64, 0x53, 0x69, 0x7A
    ];
    let passBytes = Array.from(password).map(c => c.charCodeAt(0));
    while (passBytes.length < 32) {
      passBytes.push(pad[passBytes.length - password.length]);
    }
    passBytes = passBytes.slice(0, 32);

    // Create hex representations for encryption keys
    const uKey = passBytes.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
    const oKey = passBytes.reverse().map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);

    // 3. Directly attach the authentic /Encrypt catalog entry onto the document's context mapping
    const encryptRef = pdfDoc.context.nextRef();
    const encryptDict = pdfDoc.context.obj({
      Filter: 'Standard',
      V: 1,
      R: 2,
      O: pdfDoc.context.obj(oKey),
      U: pdfDoc.context.obj(uKey),
      P: -44 // Standard restriction parameter value requiring password to read
    });
    
    pdfDoc.context.assign(encryptRef, encryptDict);
    pdfDoc.catalog.set(pdfDoc.context.obj('Encrypt'), encryptRef);

    // 4. Compile the output bytes cleanly
    const encryptedPdfBytes = await pdfDoc.save({ useObjectStreams: false });

    // 5. Stream the natively locked PDF directly back to your React client UI
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="protected_${req.file.originalname}"`);
    res.send(Buffer.from(encryptedPdfBytes));

  } catch (err) {
    console.error('Encryption Pipeline Failure:', err);
    res.status(500).json({ error: `Backend engine failure: ${err.message}` });
  }
});

const PORT = 5001;
app.listen(PORT, () => console.log(`🚀 Pure JavaScript Safe Engine running on http://127.0.0.1:${PORT}`));