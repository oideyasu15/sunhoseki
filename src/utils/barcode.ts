import JsBarcode from 'jsbarcode';

/**
 * Calculates the standard EAN-13 / JAN-13 check digit (Modulus 10, Weight 3:1)
 */
export function calculateJanCheckDigit(twelveDigits: string): number {
  if (twelveDigits.length !== 12 || !/^\d+$/.test(twelveDigits)) {
    return 0;
  }
  let sumOdd = 0; // Even positions in 0-indexed (1st, 3rd, 5th... digits)
  let sumEven = 0; // Odd positions in 0-indexed (2nd, 4th, 6th... digits)

  for (let i = 0; i < 12; i++) {
    const digit = parseInt(twelveDigits[i], 10);
    if (i % 2 === 0) {
      sumOdd += digit;
    } else {
      sumEven += digit;
    }
  }

  const total = sumOdd + sumEven * 3;
  const mod = total % 10;
  return mod === 0 ? 0 : 10 - mod;
}

/**
 * Generates a standard 13-digit Sunhoseki JAN barcode prefix (458999xxxxxxx)
 */
export function generateRandomJanCode(): string {
  const prefix = '458999'; // 458: Japan JAN prefix
  const randomBody = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, '0');
  const twelve = prefix + randomBody;
  const checkDigit = calculateJanCheckDigit(twelve);
  return twelve + checkDigit.toString();
}

/**
 * Renders a barcode into an SVG string or Canvas Data URL using jsbarcode
 */
export function renderBarcodeToSvg(
  barcodeValue: string,
  options: {
    format?: string;
    width?: number;
    height?: number;
    displayValue?: boolean;
    fontSize?: number;
    margin?: number;
  } = {}
): string {
  try {
    const svgNode = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const isEan13 = /^\d{13}$/.test(barcodeValue);
    const format = options.format || (isEan13 ? 'EAN13' : 'CODE128');

    JsBarcode(svgNode, barcodeValue, {
      format: format as any,
      width: options.width || 1.8,
      height: options.height || 45,
      displayValue: options.displayValue !== undefined ? options.displayValue : true,
      fontSize: options.fontSize || 13,
      font: 'monospace',
      margin: options.margin !== undefined ? options.margin : 6,
      lineColor: '#1e293b',
      background: '#ffffff',
    });

    const serializer = new XMLSerializer();
    return serializer.serializeToString(svgNode);
  } catch (err) {
    // If EAN13 check-digit fails, fallback to CODE128
    try {
      const svgNode = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      JsBarcode(svgNode, barcodeValue, {
        format: 'CODE128',
        width: options.width || 1.6,
        height: options.height || 45,
        displayValue: options.displayValue !== undefined ? options.displayValue : true,
        fontSize: options.fontSize || 12,
        margin: 6,
      });
      return new XMLSerializer().serializeToString(svgNode);
    } catch (e) {
      return '';
    }
  }
}

/**
 * Render barcode into image Data URL (for downloads and prints)
 */
export function renderBarcodeToDataUrl(barcodeValue: string): string {
  try {
    const canvas = document.createElement('canvas');
    const isEan13 = /^\d{13}$/.test(barcodeValue);
    const format = isEan13 ? 'EAN13' : 'CODE128';

    JsBarcode(canvas, barcodeValue, {
      format: format as any,
      width: 2,
      height: 50,
      displayValue: true,
      fontSize: 14,
      font: 'monospace',
      margin: 8,
      background: '#ffffff',
      lineColor: '#000000',
    });
    return canvas.toDataURL('image/png');
  } catch (err) {
    try {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, barcodeValue, {
        format: 'CODE128',
        width: 2,
        height: 50,
        displayValue: true,
        fontSize: 14,
        margin: 8,
      });
      return canvas.toDataURL('image/png');
    } catch {
      return '';
    }
  }
}
