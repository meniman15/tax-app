import { NextRequest, NextResponse } from 'next/server';
import { extractDocument } from '@/lib/engine/extractDocument';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }
    const results = [];
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await extractDocument(buffer, file.name);
      results.push(result);
    }
    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('Extraction error:', error);
    return NextResponse.json({ error: error.message || 'Extraction failed' }, { status: 500 });
  }
}
