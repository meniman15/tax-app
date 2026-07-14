import { NextRequest, NextResponse } from 'next/server';
import { extractDocument } from '@/lib/engine/extractDocument';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const files = formData.getAll('files') as File[];
  if (!files || files.length === 0) {
    return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
  }

  const results = await Promise.all(
    files.map(async (file) => {
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        
        // Validate the file has actual content and is a real PDF (starts with %PDF magic bytes)
        if (buffer.length < 4) {
          throw new Error(`File "${file.name}" is empty or too small to be a valid document.`);
        }
        if (file.type === 'application/pdf') {
          const magic = buffer.slice(0, 4).toString('ascii');
          if (magic !== '%PDF') {
            throw new Error(`File "${file.name}" does not appear to be a valid PDF (missing %PDF header). Please ensure it is not corrupted.`);
          }
        }

        return await extractDocument(buffer, file.name);
      } catch (error: any) {
        console.error(`Extraction error for ${file.name}:`, error);
        return {
          file: file.name,
          classification: { documentType: 'ERROR', confidenceScore: 0, summary: error.message || 'Extraction failed' },
          data: null,
        };
      }
    })
  );

  return NextResponse.json({ results });
}
