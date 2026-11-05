import opentype from 'opentype.js';

// Cache for loaded font objects and base64 strings
const fontCache = {};
const base64Cache = {};

export const FONT_VARIANTS = {
  '400-normal': { name: 'Regular (400)', file: '/fonts/GoogleSans-Regular.ttf', weight: 400, italic: false },
  '500-normal': { name: 'Medium (500)', file: '/fonts/GoogleSans-Medium.ttf', weight: 500, italic: false },
  '600-normal': { name: 'SemiBold (600)', file: '/fonts/GoogleSans-SemiBold.ttf', weight: 600, italic: false },
  '700-normal': { name: 'Bold (700)', file: '/fonts/GoogleSans-Bold.ttf', weight: 700, italic: false },
  '400-italic': { name: 'Regular Italic (400)', file: '/fonts/GoogleSans-Italic.ttf', weight: 400, italic: true },
  '700-italic': { name: 'Bold Italic (700)', file: '/fonts/GoogleSans-BoldItalic.ttf', weight: 700, italic: true },
};

/**
 * Robust number formatter immune to opentype's scientific notation / NaN bug
 */
function formatCoord(num, precision = 2) {
  if (!isFinite(num)) return '0';
  const factor = 10 ** precision;
  const rounded = Math.round(num * factor) / factor;
  return Number(rounded.toFixed(precision)).toString();
}

/**
 * Ensures each contour in the path ends with 'Z' so inner holes (e, o, p, d, B)
 * and overlapping glyphs have correct non-zero winding and do not leak into adjacent contours.
 */
function normalizeAndCloseContours(commands) {
  const result = [];
  for (let i = 0; i < commands.length; i++) {
    const cmd = commands[i];
    if (cmd.type === 'M' && i > 0 && result.length > 0) {
      const prev = result[result.length - 1];
      if (prev.type !== 'Z') {
        result.push({ type: 'Z' });
      }
    }
    result.push(cmd);
  }
  if (result.length > 0 && result[result.length - 1].type !== 'Z') {
    result.push({ type: 'Z' });
  }
  return result;
}

/**
 * Converts opentype command list to valid, crisp SVG path data
 */
export function commandsToSvgPath(commands, precision = 2) {
  const normalized = normalizeAndCloseContours(commands);
  let d = '';

  for (let i = 0; i < normalized.length; i++) {
    const cmd = normalized[i];
    switch (cmd.type) {
      case 'M':
        d += `M${formatCoord(cmd.x, precision)} ${formatCoord(cmd.y, precision)}`;
        break;
      case 'L':
        d += `L${formatCoord(cmd.x, precision)} ${formatCoord(cmd.y, precision)}`;
        break;
      case 'C':
        d += `C${formatCoord(cmd.x1, precision)} ${formatCoord(cmd.y1, precision)} ${formatCoord(cmd.x2, precision)} ${formatCoord(cmd.y2, precision)} ${formatCoord(cmd.x, precision)} ${formatCoord(cmd.y, precision)}`;
        break;
      case 'Q':
        d += `Q${formatCoord(cmd.x1, precision)} ${formatCoord(cmd.y1, precision)} ${formatCoord(cmd.x, precision)} ${formatCoord(cmd.y, precision)}`;
        break;
      case 'Z':
        d += 'Z';
        break;
    }
  }

  return d;
}

/**
 * Robust bounding box calculation from raw commands
 */
function getCommandsBoundingBox(commands) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const cmd of commands) {
    if (cmd.x !== undefined && isFinite(cmd.x)) {
      minX = Math.min(minX, cmd.x);
      maxX = Math.max(maxX, cmd.x);
    }
    if (cmd.y !== undefined && isFinite(cmd.y)) {
      minY = Math.min(minY, cmd.y);
      maxY = Math.max(maxY, cmd.y);
    }
    if (cmd.x1 !== undefined && isFinite(cmd.x1)) {
      minX = Math.min(minX, cmd.x1);
      maxX = Math.max(maxX, cmd.x1);
    }
    if (cmd.y1 !== undefined && isFinite(cmd.y1)) {
      minY = Math.min(minY, cmd.y1);
      maxY = Math.max(maxY, cmd.y1);
    }
    if (cmd.x2 !== undefined && isFinite(cmd.x2)) {
      minX = Math.min(minX, cmd.x2);
      maxX = Math.max(maxX, cmd.x2);
    }
    if (cmd.y2 !== undefined && isFinite(cmd.y2)) {
      minY = Math.min(minY, cmd.y2);
      maxY = Math.max(maxY, cmd.y2);
    }
  }

  return {
    minX: isFinite(minX) ? minX : 0,
    minY: isFinite(minY) ? minY : 0,
    maxX: isFinite(maxX) ? maxX : 100,
    maxY: isFinite(maxY) ? maxY : 50,
  };
}

/**
 * Converts ArrayBuffer to Base64 in safe chunks
 */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }
  return window.btoa(binary);
}

/**
 * Load and parse a font file
 */
export async function loadFont(weight = 400, italic = false) {
  let key = `${weight}-${italic ? 'italic' : 'normal'}`;
  if (!FONT_VARIANTS[key]) {
    if (italic) {
      key = weight >= 600 ? '700-italic' : '400-italic';
    } else {
      if (weight >= 700) key = '700-normal';
      else if (weight >= 600) key = '600-normal';
      else if (weight >= 500) key = '500-normal';
      else key = '400-normal';
    }
  }

  if (fontCache[key]) {
    return { font: fontCache[key], base64: base64Cache[key], key };
  }

  const variant = FONT_VARIANTS[key];
  const response = await fetch(variant.file);
  if (!response.ok) {
    throw new Error(`Failed to load font: ${variant.file}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const font = opentype.parse(arrayBuffer);
  const base64 = arrayBufferToBase64(arrayBuffer);

  fontCache[key] = font;
  base64Cache[key] = base64;

  return { font, base64, key };
}

/**
 * Generate full SVG markup based on parameters
 */
export async function generateSvgMarkup({
  text = 'Google Sans',
  fontSize = 72,
  weight = 700,
  italic = false,
  letterSpacing = 0,
  lineHeight = 1.2,
  textAlign = 'center',
  padding = 30,
  precision = 2, // 2 or 3 decimals
  fillType = 'solid', // 'solid' | 'gradient'
  fillColor = '#4285F4',
  gradientColors = ['#4285F4', '#EA4335', '#FBBC04', '#34A853'],
  gradientAngle = 90,
  hasStroke = false,
  strokeColor = '#000000',
  strokeWidth = 2,
  bgType = 'transparent', // 'transparent' | 'solid'
  bgColor = '#ffffff',
  exportMode = 'outlines', // 'outlines' | 'text'
}) {
  const safeText = text || ' ';
  const lines = safeText.split('\n');
  const { font, base64 } = await loadFont(weight, italic);

  const scale = (1 / font.unitsPerEm) * fontSize;
  const lineAdvance = fontSize * lineHeight;
  const baselineOffset = (font.ascender / font.unitsPerEm) * fontSize;

  // Calculate width and glyphs per line
  const lineDetails = lines.map((line) => {
    let width = 0;
    const glyphs = font.stringToGlyphs(line);
    for (let i = 0; i < glyphs.length; i++) {
      const glyph = glyphs[i];
      if (glyph.advanceWidth) {
        width += glyph.advanceWidth * scale;
      }
      if (i < glyphs.length - 1) {
        width += letterSpacing;
      }
    }
    return { line, glyphs, width };
  });

  const maxLineWidth = Math.max(...lineDetails.map((l) => l.width), 10);
  const totalTextHeight = (lines.length - 1) * lineAdvance + fontSize;

  // Definitions for SVG (gradients, styles)
  let defs = '';
  let fillAttribute = fillColor;

  if (fillType === 'gradient') {
    const rad = (gradientAngle * Math.PI) / 180;
    const x1 = Math.round(50 - Math.cos(rad) * 50);
    const y1 = Math.round(50 - Math.sin(rad) * 50);
    const x2 = Math.round(50 + Math.cos(rad) * 50);
    const y2 = Math.round(50 + Math.sin(rad) * 50);

    const stops = gradientColors
      .map((col, idx) => {
        const offset = Math.round((idx / (gradientColors.length - 1)) * 100);
        return `<stop offset="${offset}%" stop-color="${col}" />`;
      })
      .join('\n      ');

    defs += `
    <linearGradient id="googleSansGradient" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">
      ${stops}
    </linearGradient>`;
    fillAttribute = 'url(#googleSansGradient)';
  }

  const strokeAttr = hasStroke
    ? `stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linejoin="round" stroke-linecap="round"`
    : '';

  if (exportMode === 'outlines') {
    // Generate true vector bezier outlines with custom robust serializer
    const allCommands = [];

    lineDetails.forEach((lineInfo, lineIndex) => {
      let startX = 0;
      if (textAlign === 'center') startX = (maxLineWidth - lineInfo.width) / 2;
      else if (textAlign === 'right') startX = maxLineWidth - lineInfo.width;

      let currentX = startX;
      const currentY = baselineOffset + lineIndex * lineAdvance;

      for (let i = 0; i < lineInfo.glyphs.length; i++) {
        const glyph = lineInfo.glyphs[i];
        const glyphPath = glyph.getPath(currentX, currentY, fontSize);
        allCommands.push(...glyphPath.commands);

        if (glyph.advanceWidth) {
          currentX += glyph.advanceWidth * scale;
        }
        currentX += letterSpacing;
      }
    });

    const bbox = getCommandsBoundingBox(allCommands);
    const hasGlyphs = allCommands.length > 0 && isFinite(bbox.minX) && bbox.maxX > bbox.minX;

    const minX = hasGlyphs ? Math.floor(bbox.minX - padding) : 0;
    const minY = hasGlyphs ? Math.floor(bbox.minY - padding) : 0;
    const maxX = hasGlyphs ? Math.ceil(bbox.maxX + padding) : Math.ceil(maxLineWidth + padding * 2);
    const maxY = hasGlyphs ? Math.ceil(bbox.maxY + padding) : Math.ceil(totalTextHeight + padding * 2);

    const viewBoxWidth = Math.max(maxX - minX, 20);
    const viewBoxHeight = Math.max(maxY - minY, 20);

    // Format path data cleanly using our robust formatter (No NaNs, properly closed contours!)
    const pathData = hasGlyphs ? commandsToSvgPath(allCommands, precision) : '';

    const bgRect =
      bgType === 'solid'
        ? `<rect x="${minX}" y="${minY}" width="${viewBoxWidth}" height="${viewBoxHeight}" fill="${bgColor}" rx="8" />`
        : '';

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${viewBoxWidth} ${viewBoxHeight}" width="${viewBoxWidth}" height="${viewBoxHeight}">
  <defs>${defs}
  </defs>
  ${bgRect}
  <path d="${pathData}" fill="${fillAttribute}" ${strokeAttr} fill-rule="nonzero" />
</svg>`.trim();
  } else {
    // Export mode: Editable text with embedded font in base64
    const boxWidth = Math.ceil(maxLineWidth + padding * 2);
    const boxHeight = Math.ceil(totalTextHeight + padding * 2);

    const bgRect =
      bgType === 'solid'
        ? `<rect width="${boxWidth}" height="${boxHeight}" fill="${bgColor}" rx="8" />`
        : '';

    const textElements = lineDetails
      .map((lineInfo, idx) => {
        let x = padding;
        let anchor = 'start';
        if (textAlign === 'center') {
          x = padding + maxLineWidth / 2;
          anchor = 'middle';
        } else if (textAlign === 'right') {
          x = padding + maxLineWidth;
          anchor = 'end';
        }
        const y = padding + baselineOffset + idx * lineAdvance;
        const escaped = lineInfo.line
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        return `<text x="${x}" y="${y}" text-anchor="${anchor}">${escaped}</text>`;
      })
      .join('\n    ');

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${boxWidth} ${boxHeight}" width="${boxWidth}" height="${boxHeight}">
  <defs>
    <style>
      @font-face {
        font-family: 'Google Sans';
        font-weight: ${weight};
        font-style: ${italic ? 'italic' : 'normal'};
        src: url(data:font/truetype;charset=utf-8;base64,${base64}) format('truetype');
      }
      .google-sans-text {
        font-family: 'Google Sans', sans-serif;
        font-size: ${fontSize}px;
        font-weight: ${weight};
        font-style: ${italic ? 'italic' : 'normal'};
        letter-spacing: ${letterSpacing}px;
        fill: ${fillAttribute};
        ${hasStroke ? `stroke: ${strokeColor}; stroke-width: ${strokeWidth}px; stroke-linejoin: round;` : ''}
      }
    </style>${defs}
  </defs>
  ${bgRect}
  <g class="google-sans-text">
    ${textElements}
  </g>
</svg>`.trim();
  }
}

/**
 * Triggers file download in the browser
 */
export function downloadFile(content, fileName, mimeType = 'image/svg+xml') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Converts SVG to high-resolution PNG and downloads it
 */
export function downloadSvgAsPng(svgString, fileName, scaleFactor = 2) {
  const img = new Image();
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width * scaleFactor;
    canvas.height = img.height * scaleFactor;
    const ctx = canvas.getContext('2d');
    ctx.scale(scaleFactor, scaleFactor);
    ctx.drawImage(img, 0, 0);

    canvas.toBlob((blob) => {
      const pngUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = fileName.replace(/\.svg$/, '.png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(pngUrl);
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  img.src = url;
}
