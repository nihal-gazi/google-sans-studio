[https://github.com/nihal-gazi/google-sans-studio](https://github.com/nihal-gazi/google-sans-studio)

# Google Sans Studio

A fast, client-side web tool to type, style, scale, and export text in Google Sans as standalone vector SVG outlines or high-resolution PNG images.

## Features

- **Live Preview & Scaling**: Adjust font size, letter spacing, line height, alignment, and variable grade axis (`GRAD`).
- **Font Weights & Styles**: Regular (400), Medium (500), SemiBold (600), Bold (700), with Normal and Italic styles.
- **Client-Side Vectorization**: Converts TrueType Bézier curves directly into clean SVG `<path>` outlines inside the browser. No server or external APIs needed.
- **Universal Compatibility**: Exported outline SVGs open cleanly in Figma, Adobe Illustrator, Canva, and web apps without requiring the font to be installed locally.
- **Colors & Styles**: Solid fill (Google palette or custom hex), Google 4-color gradient, stroke outlines, and transparent or solid backgrounds.
- **Export Options**:
  - **Vector Outlines (Path)**: Pure vector outlines ready for design workflows.
  - **Editable Text (SVG)**: `<text>` SVG with embedded Base64 font.
  - **PNG (2x)**: High-resolution raster image.
  - **Copy SVG / CSS**: 1-click clipboard actions.

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build production bundle
npm run build
```

---

## Disclaimer & Legal Notice

This project is only built for experimental purposes, for exploring the dynamics and style of google font. Downloadable SVGs and PNG allows you to investigate the original equations behind the font. I made this personal project, because I found all other sites that allows the usage of Product Sans to be personally inconvinient.

Google's font is proprietary and subject to copyright.  
Usage of this font is subject to Google's TOS.  
The creator is not responsible for how it is used.  
And I have put this warning, as what I personally conclude to be my best effort.

---

Made with ❤️ by [Nihal Gazi](https://nihalgazi.com)
