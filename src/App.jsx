import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Download,
  Copy,
  Check,
  Type,
  Sliders,
  Palette,
  Sparkles,
  Layers,
  Sun,
  Moon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Code2,
  Image as ImageIcon
} from 'lucide-react';
import {
  generateSvgMarkup,
  downloadFile,
  downloadSvgAsPng
} from './utils/fontEngine';
import './App.css';

const PRESET_TEXTS = [
  'Google Developer Groups',
  'GDG on Campus IEM',
  'Google Sans',
  'Build with AI',
  'Code. Create. Inspire.'
];

const GOOGLE_COLORS = [
  { name: 'Google Blue', value: '#4285F4' },
  { name: 'Google Red', value: '#EA4335' },
  { name: 'Google Yellow', value: '#FBBC04' },
  { name: 'Google Green', value: '#34A853' },
  { name: 'Slate Dark', value: '#202124' },
  { name: 'Pure White', value: '#FFFFFF' }
];

export default function App() {
  const [text, setText] = useState('Google Developer Groups\nGDG on Campus');
  const [fontSize, setFontSize] = useState(72);
  const [weight, setWeight] = useState(700);
  const [italic, setItalic] = useState(false);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [lineHeight, setLineHeight] = useState(1.15);
  const [textAlign, setTextAlign] = useState('center');
  const [padding, setPadding] = useState(28);
  const [precision, setPrecision] = useState(2);
  const [grad, setGrad] = useState(0);

  // Color & fill settings
  const [fillType, setFillType] = useState('solid'); // 'solid' | 'gradient'
  const [fillColor, setFillColor] = useState('#4285F4');
  const [hasStroke, setHasStroke] = useState(false);
  const [strokeColor, setStrokeColor] = useState('#202124');
  const [strokeWidth, setStrokeWidth] = useState(2);

  // Background & Stage
  const [bgType, setBgType] = useState('transparent'); // 'transparent' | 'solid'
  const [bgColor, setBgColor] = useState('#ffffff');
  const [stageBg, setStageBg] = useState('checkerboard'); // 'checkerboard' | 'dark' | 'light'
  const [exportMode, setExportMode] = useState('outlines'); // 'outlines' | 'text'

  // App UI state
  const [svgOutput, setSvgOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 });
  const [theme, setTheme] = useState('light');
  const [toastMessage, setToastMessage] = useState(null);
  const [copiedType, setCopiedType] = useState(null); // 'svg' | 'css'
  const [previewZoom, setPreviewZoom] = useState(1);
  const viewportRef = useRef(null);

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Generate SVG markup whenever options change
  useEffect(() => {
    let isCancelled = false;
    async function updateSvg() {
      try {
        setLoading(true);
        const svg = await generateSvgMarkup({
          text: text.trim() ? text : ' ',
          fontSize,
          weight,
          italic,
          letterSpacing,
          lineHeight,
          textAlign,
          padding,
          precision,
          fillType,
          fillColor,
          gradientColors: ['#4285F4', '#EA4335', '#FBBC04', '#34A853'],
          gradientAngle: 90,
          hasStroke,
          strokeColor,
          strokeWidth,
          bgType,
          bgColor,
          exportMode
        });

        if (!isCancelled) {
          setSvgOutput(svg);

          // Extract viewBox or dimensions
          const viewBoxMatch = svg.match(/viewBox="([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)"/);
          if (viewBoxMatch) {
            setSvgDimensions({
              width: Math.round(parseFloat(viewBoxMatch[3])),
              height: Math.round(parseFloat(viewBoxMatch[4]))
            });
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to generate SVG:', err);
        if (!isCancelled) setLoading(false);
      }
    }

    const timer = setTimeout(updateSvg, 50);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [
    text,
    fontSize,
    weight,
    italic,
    letterSpacing,
    lineHeight,
    textAlign,
    padding,
    precision,
    fillType,
    fillColor,
    hasStroke,
    strokeColor,
    strokeWidth,
    bgType,
    bgColor,
    exportMode
  ]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fireConfetti = () => {
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#4285F4', '#EA4335', '#FBBC04', '#34A853']
    });
  };

  // Download SVG
  const handleDownloadSvg = () => {
    if (!svgOutput) return;
    const sanitizedName = text.trim().slice(0, 24).replace(/[^a-zA-Z0-9_-]/g, '_') || 'google-sans';
    const fileName = `${sanitizedName}-vector.svg`;
    downloadFile(svgOutput, fileName);
    fireConfetti();
    showToast(`Downloaded ${fileName}!`);
  };

  // Copy SVG to clipboard
  const handleCopySvg = async () => {
    if (!svgOutput) return;
    try {
      await navigator.clipboard.writeText(svgOutput);
      setCopiedType('svg');
      showToast('SVG markup copied to clipboard!');
      setTimeout(() => setCopiedType(null), 2000);
    } catch {
      showToast('Failed to copy to clipboard');
    }
  };

  // Download PNG
  const handleDownloadPng = () => {
    if (!svgOutput) return;
    const sanitizedName = text.trim().slice(0, 24).replace(/[^a-zA-Z0-9_-]/g, '_') || 'google-sans';
    downloadSvgAsPng(svgOutput, `${sanitizedName}-vector.png`, 2);
    fireConfetti();
    showToast('Downloaded High-Res PNG (2x)!');
  };

  // Fit to screen
  const handleFitToScreen = () => {
    if (viewportRef.current && svgDimensions.width > 0) {
      const containerWidth = viewportRef.current.clientWidth - 80;
      const containerHeight = viewportRef.current.clientHeight - 80;
      const scaleX = containerWidth / svgDimensions.width;
      const scaleY = containerHeight / svgDimensions.height;
      const bestScale = Math.min(scaleX, scaleY, 1.2);
      setPreviewZoom(Math.max(0.2, Number(bestScale.toFixed(2))));
      showToast(`Fit to view (${Math.round(bestScale * 100)}%)`);
    } else {
      setPreviewZoom(1);
    }
  };

  // Copy CSS snippet (User's specific pattern)
  const cssSnippet = `.google-sans-${weight}${italic ? '-italic' : ''} {
  font-family: "Google Sans", sans-serif;
  font-optical-sizing: auto;
  font-weight: ${weight};
  font-style: ${italic ? 'italic' : 'normal'};
  font-variation-settings:
    "GRAD" ${grad};
}`;

  const handleCopyCss = async () => {
    try {
      await navigator.clipboard.writeText(cssSnippet);
      setCopiedType('css');
      showToast('Google Sans CSS snippet copied!');
      setTimeout(() => setCopiedType(null), 2000);
    } catch {
      showToast('Failed to copy CSS');
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="brand-section">
          <div className="google-logo-pill">
            <span className="dot dot-blue" />
            <span className="dot dot-red" />
            <span className="dot dot-yellow" />
            <span className="dot dot-green" />
          </div>
          <span className="brand-title">
            Google Sans <span>SVG Studio</span>
          </span>
          <span className="badge-gdg">Client-side Vectorizer</span>
        </div>

        <div className="header-actions">
          <button
            className="icon-btn"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            title="Toggle theme"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </header>

      {/* Main Studio Grid */}
      <main className="main-content">
        {/* Left: Stage Preview */}
        <section className="stage-panel">
          <div className="stage-toolbar">
            <div className="toolbar-group">
              <span className="meta-pill">
                <Layers size={14} />
                {svgDimensions.width} × {svgDimensions.height} px
              </span>
              <span className="meta-pill">
                {exportMode === 'outlines' ? '✨ Vector Bézier Paths' : '🔤 Embedded WebFont'}
              </span>
            </div>

            <div className="toolbar-group">
              <button
                className="icon-btn"
                onClick={() => setPreviewZoom((z) => Math.max(0.2, Number((z - 0.15).toFixed(2))))}
                title="Zoom Out"
              >
                <ZoomOut size={16} />
              </button>
              <span className="meta-pill" style={{ minWidth: 48, justifyContent: 'center' }}>
                {Math.round(previewZoom * 100)}%
              </span>
              <button
                className="icon-btn"
                onClick={() => setPreviewZoom((z) => Math.min(3, Number((z + 0.15).toFixed(2))))}
                title="Zoom In"
              >
                <ZoomIn size={16} />
              </button>
              <button
                className="icon-btn"
                onClick={handleFitToScreen}
                title="Fit to Screen"
              >
                <Maximize2 size={16} />
              </button>

              {/* Stage Background selector */}
              <div className="segmented-group" style={{ marginLeft: 6 }}>
                <button
                  className={`segmented-btn ${stageBg === 'checkerboard' ? 'active' : ''}`}
                  onClick={() => setStageBg('checkerboard')}
                  title="Checkerboard (Transparent)"
                >
                  Grid
                </button>
                <button
                  className={`segmented-btn ${stageBg === 'light' ? 'active' : ''}`}
                  onClick={() => setStageBg('light')}
                  title="White background"
                >
                  Light
                </button>
                <button
                  className={`segmented-btn ${stageBg === 'dark' ? 'active' : ''}`}
                  onClick={() => setStageBg('dark')}
                  title="Dark background"
                >
                  Dark
                </button>
              </div>
            </div>
          </div>

          {/* Canvas Viewport */}
          <div
            ref={viewportRef}
            className={`stage-viewport ${
              stageBg === 'checkerboard' ? 'checkerboard-bg' : ''
            }`}
            style={{
              backgroundColor:
                stageBg === 'light' ? '#ffffff' : stageBg === 'dark' ? '#14171f' : undefined
            }}
          >
            <div
              className="svg-display-card"
              style={{
                transform: `scale(${previewZoom})`,
                transformOrigin: 'center center'
              }}
              dangerouslySetInnerHTML={{ __html: svgOutput }}
            />
          </div>

          {/* Stage Bottom Floating Bar */}
          <div className="stage-floating-bar">
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn-primary" onClick={handleDownloadSvg}>
                <Download size={18} />
                Download SVG
              </button>

              <button className="btn-secondary" onClick={handleCopySvg}>
                {copiedType === 'svg' ? <Check size={16} color="#34A853" /> : <Copy size={16} />}
                {copiedType === 'svg' ? 'Copied SVG!' : 'Copy SVG'}
              </button>

              <button className="btn-secondary" onClick={handleDownloadPng} title="High resolution raster PNG (2x)">
                <ImageIcon size={16} />
                PNG (2x)
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Non-zero Winding • Accurate Bézier Outlines
              </span>
            </div>
          </div>
        </section>

        {/* Right: Controls Sidebar */}
        <aside className="control-sidebar">
          {/* Card 1: Text Input & Presets */}
          <div className="control-card">
            <div className="card-title">
              <Type size={16} />
              Text Content
            </div>

            <textarea
              className="text-input-area"
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type anything here..."
            />

            <div className="chips-container">
              {PRESET_TEXTS.map((preset) => (
                <button
                  key={preset}
                  className="chip"
                  onClick={() => setText(preset)}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Card 2: Typography & Scale */}
          <div className="control-card">
            <div className="card-title">
              <Sliders size={16} />
              Font Size & Typography
            </div>

            {/* Font Size */}
            <div className="control-field">
              <div className="field-header">
                <span>Font Size</span>
                <span className="field-value">{fontSize}px</span>
              </div>
              <div className="slider-row">
                <input
                  type="range"
                  className="range-slider"
                  min="16"
                  max="280"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                />
                <input
                  type="number"
                  className="number-input"
                  min="16"
                  max="400"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value) || 16)}
                />
              </div>
            </div>

            {/* Font Weight */}
            <div className="control-field">
              <div className="field-header">
                <span>Weight</span>
                <span className="field-value">{weight}</span>
              </div>
              <div className="segmented-group">
                {[
                  { label: 'Regular', w: 400 },
                  { label: 'Medium', w: 500 },
                  { label: 'SemiBold', w: 600 },
                  { label: 'Bold', w: 700 }
                ].map(({ label, w }) => (
                  <button
                    key={w}
                    className={`segmented-btn ${weight === w ? 'active' : ''}`}
                    onClick={() => setWeight(w)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Style (Italic) & Alignment */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="control-field">
                <div className="field-header">
                  <span>Style</span>
                </div>
                <div className="segmented-group">
                  <button
                    className={`segmented-btn ${!italic ? 'active' : ''}`}
                    onClick={() => setItalic(false)}
                  >
                    Normal
                  </button>
                  <button
                    className={`segmented-btn ${italic ? 'active' : ''}`}
                    onClick={() => setItalic(true)}
                  >
                    <i>Italic</i>
                  </button>
                </div>
              </div>

              <div className="control-field">
                <div className="field-header">
                  <span>Alignment</span>
                </div>
                <div className="segmented-group">
                  <button
                    className={`segmented-btn ${textAlign === 'left' ? 'active' : ''}`}
                    onClick={() => setTextAlign('left')}
                    title="Align Left"
                  >
                    <AlignLeft size={16} />
                  </button>
                  <button
                    className={`segmented-btn ${textAlign === 'center' ? 'active' : ''}`}
                    onClick={() => setTextAlign('center')}
                    title="Align Center"
                  >
                    <AlignCenter size={16} />
                  </button>
                  <button
                    className={`segmented-btn ${textAlign === 'right' ? 'active' : ''}`}
                    onClick={() => setTextAlign('right')}
                    title="Align Right"
                  >
                    <AlignRight size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Letter Spacing & Line Height */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="control-field">
                <div className="field-header">
                  <span>Letter Spacing</span>
                  <span className="field-value">{letterSpacing}px</span>
                </div>
                <input
                  type="range"
                  className="range-slider"
                  min="-4"
                  max="20"
                  value={letterSpacing}
                  onChange={(e) => setLetterSpacing(Number(e.target.value))}
                />
              </div>

              <div className="control-field">
                <div className="field-header">
                  <span>Line Height</span>
                  <span className="field-value">{lineHeight}</span>
                </div>
                <input
                  type="range"
                  className="range-slider"
                  min="0.8"
                  max="2.2"
                  step="0.05"
                  value={lineHeight}
                  onChange={(e) => setLineHeight(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Grade (GRAD variable axis) */}
            <div className="control-field">
              <div className="field-header">
                <span>Grade (GRAD Axis)</span>
                <span className="field-value">{grad}</span>
              </div>
              <input
                type="range"
                className="range-slider"
                min="-200"
                max="150"
                step="10"
                value={grad}
                onChange={(e) => setGrad(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Card 3: Color & Styling */}
          <div className="control-card">
            <div className="card-title">
              <Palette size={16} />
              Color & Styling
            </div>

            <div className="control-field">
              <div className="field-header">
                <span>Fill Type</span>
              </div>
              <div className="segmented-group">
                <button
                  className={`segmented-btn ${fillType === 'solid' ? 'active' : ''}`}
                  onClick={() => setFillType('solid')}
                >
                  Solid Color
                </button>
                <button
                  className={`segmented-btn ${fillType === 'gradient' ? 'active' : ''}`}
                  onClick={() => setFillType('gradient')}
                >
                  Google 4-Color Gradient
                </button>
              </div>
            </div>

            {fillType === 'solid' && (
              <div className="control-field">
                <div className="field-header">
                  <span>Google Palette & Custom</span>
                  <span className="field-value">{fillColor}</span>
                </div>
                <div className="color-presets-row">
                  {GOOGLE_COLORS.map((c) => (
                    <button
                      key={c.name}
                      className={`color-swatch ${fillColor.toLowerCase() === c.value.toLowerCase() ? 'active' : ''}`}
                      style={{ backgroundColor: c.value }}
                      onClick={() => setFillColor(c.value)}
                      title={c.name}
                    />
                  ))}
                  <input
                    type="color"
                    className="color-picker-input"
                    value={fillColor}
                    onChange={(e) => setFillColor(e.target.value)}
                    title="Choose custom color"
                  />
                </div>
              </div>
            )}

            {/* Stroke / Outline */}
            <div className="control-field">
              <div className="field-header">
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={hasStroke}
                    onChange={(e) => setHasStroke(e.target.checked)}
                  />
                  <span>Text Stroke Outline</span>
                </label>
                {hasStroke && <span className="field-value">{strokeWidth}px</span>}
              </div>

              {hasStroke && (
                <div className="slider-row" style={{ marginTop: 6 }}>
                  <input
                    type="color"
                    className="color-picker-input"
                    value={strokeColor}
                    onChange={(e) => setStrokeColor(e.target.value)}
                  />
                  <input
                    type="range"
                    className="range-slider"
                    min="1"
                    max="12"
                    value={strokeWidth}
                    onChange={(e) => setStrokeWidth(Number(e.target.value))}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Card 4: Export Options */}
          <div className="control-card">
            <div className="card-title">
              <Sparkles size={16} />
              SVG Export Options
            </div>

            {/* Export Mode */}
            <div className="control-field">
              <div className="field-header">
                <span>SVG Mode</span>
              </div>
              <div className="segmented-group">
                <button
                  className={`segmented-btn ${exportMode === 'outlines' ? 'active' : ''}`}
                  onClick={() => setExportMode('outlines')}
                  title="Converts text into Bézier curve paths (Universal, Figma/Canva ready)"
                >
                  Vector Outlines (Path)
                </button>
                <button
                  className={`segmented-btn ${exportMode === 'text' ? 'active' : ''}`}
                  onClick={() => setExportMode('text')}
                  title="Keeps editable <text> with embedded base64 Google Sans font"
                >
                  Editable Text (Font embedded)
                </button>
              </div>
            </div>

            {/* Decimal Precision */}
            <div className="control-field">
              <div className="field-header">
                <span>Vector Coordinate Precision</span>
                <span className="field-value">{precision} decimals</span>
              </div>
              <div className="segmented-group">
                {[
                  { label: '1 (Fast / Compact)', p: 1 },
                  { label: '2 (Standard)', p: 2 },
                  { label: '3 (High Precision)', p: 3 },
                  { label: '4 (Ultra)', p: 4 }
                ].map(({ label, p }) => (
                  <button
                    key={p}
                    className={`segmented-btn ${precision === p ? 'active' : ''}`}
                    onClick={() => setPrecision(p)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Padding */}
            <div className="control-field">
              <div className="field-header">
                <span>SVG Bounds Padding</span>
                <span className="field-value">{padding}px</span>
              </div>
              <input
                type="range"
                className="range-slider"
                min="0"
                max="80"
                value={padding}
                onChange={(e) => setPadding(Number(e.target.value))}
              />
            </div>

            {/* Background toggle */}
            <div className="control-field">
              <div className="field-header">
                <span>SVG Background</span>
              </div>
              <div className="segmented-group">
                <button
                  className={`segmented-btn ${bgType === 'transparent' ? 'active' : ''}`}
                  onClick={() => setBgType('transparent')}
                >
                  Transparent
                </button>
                <button
                  className={`segmented-btn ${bgType === 'solid' ? 'active' : ''}`}
                  onClick={() => setBgType('solid')}
                >
                  Solid Background
                </button>
              </div>

              {bgType === 'solid' && (
                <div className="color-presets-row" style={{ marginTop: 8 }}>
                  {['#ffffff', '#f8f9fa', '#202124', '#0f1117', '#4285F4'].map((col) => (
                    <button
                      key={col}
                      className={`color-swatch ${bgColor.toLowerCase() === col.toLowerCase() ? 'active' : ''}`}
                      style={{ backgroundColor: col }}
                      onClick={() => setBgColor(col)}
                    />
                  ))}
                  <input
                    type="color"
                    className="color-picker-input"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Card 5: CSS Code Snippet */}
          <div className="control-card">
            <div className="card-title">
              <Code2 size={16} />
              CSS Snippet
            </div>

            <div className="code-preview-box">
              <button className="code-copy-btn" onClick={handleCopyCss}>
                {copiedType === 'css' ? <Check size={12} color="#34A853" /> : <Copy size={12} />}
                {copiedType === 'css' ? 'Copied' : 'Copy'}
              </button>
              <pre>{cssSnippet}</pre>
            </div>
          </div>
        </aside>
      </main>

      {/* Toast Notice */}
      {toastMessage && (
        <div className="toast-notice">
          <Check size={18} color="#34A853" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
