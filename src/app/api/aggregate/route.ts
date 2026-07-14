import { NextRequest, NextResponse } from 'next/server';
import { aggregateToTaxMap } from '@/lib/engine/taxMath';
import { generateUsTaxMap } from '@/lib/engine/usTaxMath';

export async function POST(request: NextRequest) {
  try {
    const { extractedForms, formType } = await request.json();
    if (!extractedForms || !Array.isArray(extractedForms)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    if (formType === 'US') {
      const { usTaxMap, aggregationLog } = generateUsTaxMap(extractedForms);
      return NextResponse.json({ taxMap: usTaxMap, aggregationLog, formType: 'US' });
    }
    const { taxMap, aggregationLog, form106CreditPoints } = aggregateToTaxMap(extractedForms);
    return NextResponse.json({ taxMap, aggregationLog, form106CreditPoints, formType: 'IL' });
  } catch (error: any) {
    console.error('Aggregation error:', error);
    return NextResponse.json({ error: error.message || 'Aggregation failed' }, { status: 500 });
  }
}
