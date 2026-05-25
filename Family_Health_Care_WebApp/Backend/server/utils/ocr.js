import { createWorker } from 'tesseract.js';

export async function extractText(filePath) {
  let worker;
  try {
    worker = createWorker();
    
    // Set a 10-second timeout for OCR
    const ocrPromise = (async () => {
      await worker.load();
      await worker.loadLanguage('eng');
      await worker.initialize('eng');
      const { data } = await worker.recognize(filePath);
      return (data?.text || '').trim();
    })();
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('OCR timeout after 10 seconds')), 10000)
    );
    
    const text = await Promise.race([ocrPromise, timeoutPromise]);
    return text;
  } catch (err) {
    console.error('OCR extractText error:', err.message);
    return ''; // Return empty string but don't fail the upload
  } finally {
    try {
      if (worker) await worker.terminate();
    } catch (e) {
      // ignore
    }
  }
}

export default { extractText };
