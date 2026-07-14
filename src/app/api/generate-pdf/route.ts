import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 50;
const ROW_HEIGHT = 20;
const CONTENT_TOP = PAGE_HEIGHT - MARGIN - 80;
const FOOTER_Y = MARGIN - 10;

export async function POST(request: NextRequest) {
  try {
    const { taxMap, formType } = await request.json();
    if (!taxMap) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    let pageNumber = 1;
    let y = CONTENT_TOP;

    const drawTitle = (pg: typeof page) => {
      const title = formType === 'US' ? 'US Tax Summary' : 'IL Tax Summary';
      pg.drawText(title, {
        x: MARGIN,
        y: PAGE_HEIGHT - MARGIN - 20,
        size: 18,
        font: boldFont,
        color: rgb(0.1, 0.1, 0.1),
      });
      pg.drawText(`Generated: ${new Date().toLocaleDateString()}`, {
        x: MARGIN,
        y: PAGE_HEIGHT - MARGIN - 40,
        size: 9,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
      // Separator line
      pg.drawLine({
        start: { x: MARGIN, y: PAGE_HEIGHT - MARGIN - 50 },
        end: { x: PAGE_WIDTH - MARGIN, y: PAGE_HEIGHT - MARGIN - 50 },
        thickness: 1,
        color: rgb(0.7, 0.7, 0.7),
      });
    };

    const drawTableHeader = (pg: typeof page, currentY: number) => {
      pg.drawText('Box / Field', {
        x: MARGIN,
        y: currentY,
        size: 10,
        font: boldFont,
        color: rgb(0.2, 0.2, 0.2),
      });
      pg.drawText('Value', {
        x: 300,
        y: currentY,
        size: 10,
        font: boldFont,
        color: rgb(0.2, 0.2, 0.2),
      });
      pg.drawText('Description', {
        x: 380,
        y: currentY,
        size: 10,
        font: boldFont,
        color: rgb(0.2, 0.2, 0.2),
      });
      // Header underline
      pg.drawLine({
        start: { x: MARGIN, y: currentY - 5 },
        end: { x: PAGE_WIDTH - MARGIN, y: currentY - 5 },
        thickness: 0.5,
        color: rgb(0.8, 0.8, 0.8),
      });
      return currentY - ROW_HEIGHT;
    };

    const drawFooter = (pg: typeof page, pgNum: number) => {
      pg.drawText(`Page ${pgNum}`, {
        x: PAGE_WIDTH / 2 - 15,
        y: FOOTER_Y,
        size: 8,
        font,
        color: rgb(0.5, 0.5, 0.5),
      });
    };

    const addNewPage = () => {
      drawFooter(page, pageNumber);
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      pageNumber++;
      drawTitle(page);
      y = CONTENT_TOP;
      y = drawTableHeader(page, y);
    };

    // Draw initial page
    drawTitle(page);
    y = drawTableHeader(page, y);

    const truncate = (text: string, maxWidth: number, fontSize: number, f: typeof font) => {
      let truncated = text;
      while (f.widthOfTextAtSize(truncated, fontSize) > maxWidth && truncated.length > 0) {
        truncated = truncated.slice(0, -1);
      }
      if (truncated.length < text.length && truncated.length > 3) {
        truncated = truncated.slice(0, -3) + '...';
      }
      return truncated;
    };

    if (formType === 'US') {
      // US: taxMap is grouped by form name → { box → { value, description } }
      const formGroups = Object.entries(taxMap) as [string, Record<string, { value: any; description?: string }>][];
      for (const [formName, boxes] of formGroups) {
        if (y < MARGIN + ROW_HEIGHT * 2) {
          addNewPage();
        }
        // Form group header
        page.drawText(formName, {
          x: MARGIN,
          y,
          size: 12,
          font: boldFont,
          color: rgb(0.15, 0.3, 0.6),
        });
        y -= ROW_HEIGHT;

        for (const [box, data] of Object.entries(boxes)) {
          if (y < MARGIN + ROW_HEIGHT) {
            addNewPage();
          }
          const valueStr = typeof data === 'object' && data !== null && 'value' in data
            ? String(data.value ?? '')
            : String(data ?? '');
          const descStr = typeof data === 'object' && data !== null && 'description' in data
            ? String(data.description ?? '')
            : '';

          page.drawText(truncate(box, 230, 9, font), {
            x: MARGIN + 10,
            y,
            size: 9,
            font,
            color: rgb(0.2, 0.2, 0.2),
          });
          page.drawText(truncate(valueStr, 70, 9, font), {
            x: 300,
            y,
            size: 9,
            font,
            color: rgb(0.1, 0.1, 0.1),
          });
          page.drawText(truncate(descStr, 150, 8, font), {
            x: 380,
            y,
            size: 8,
            font,
            color: rgb(0.4, 0.4, 0.4),
          });
          y -= ROW_HEIGHT;
        }
        y -= 5; // spacing between form groups
      }
    } else {
      // IL: taxMap is { box → { value, description } }
      const entries = Object.entries(taxMap) as [string, { value: any; description?: string }][];
      for (const [box, data] of entries) {
        if (y < MARGIN + ROW_HEIGHT) {
          addNewPage();
        }
        const valueStr = typeof data === 'object' && data !== null && 'value' in data
          ? String(data.value ?? '')
          : String(data ?? '');
        const descStr = typeof data === 'object' && data !== null && 'description' in data
          ? String(data.description ?? '')
          : '';

        page.drawText(truncate(box, 230, 9, font), {
          x: MARGIN,
          y,
          size: 9,
          font,
          color: rgb(0.2, 0.2, 0.2),
        });
        page.drawText(truncate(valueStr, 70, 9, font), {
          x: 300,
          y,
          size: 9,
          font,
          color: rgb(0.1, 0.1, 0.1),
        });
        page.drawText(truncate(descStr, 150, 8, font), {
          x: 380,
          y,
          size: 8,
          font,
          color: rgb(0.4, 0.4, 0.4),
        });
        y -= ROW_HEIGHT;
      }
    }

    // Final footer
    drawFooter(page, pageNumber);

    const pdfBytes = await pdfDoc.save();
    const filename = formType === 'US' ? 'us_tax_summary.pdf' : 'il_tax_summary.pdf';

    return new NextResponse(pdfBytes as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: error.message || 'PDF generation failed' }, { status: 500 });
  }
}
