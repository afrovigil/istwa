import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// High resolution SVG matching WHO / OMS Région Africaine map & ISTWAMONITOR identity
const svgLogo = `
<svg width="600" height="600" viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Africa continent map background silhouette (Soft Cyan/Blue) -->
  <path d="M260,80 C320,70 420,90 450,150 C480,210 520,280 490,360 C460,440 400,510 320,530 C270,545 220,510 180,470 C150,440 120,380 130,330 C140,280 180,250 200,200 C220,150 220,90 260,80 Z" fill="#38bdf8" opacity="0.25"/>
  
  <!-- Highlighted WHO West/Central Africa region silhouette in vibrant WHO Cyan -->
  <path d="M210,190 C260,180 340,200 380,240 C420,280 440,340 410,400 C380,460 330,480 270,470 C220,460 170,420 160,370 C150,320 180,280 190,240 Z" fill="#0284c7" opacity="0.85"/>
  <path d="M310,360 C360,360 410,400 400,450 C390,500 330,520 280,500 C250,480 280,400 310,360 Z" fill="#0369a1"/>

  <!-- WHO Emblem (World & Asclepius Rod in WHO Orange/Terracotta) -->
  <g transform="translate(300, 240) scale(1.1)">
    <!-- Outer laurels wreath -->
    <path d="M-80,-10 C-100,-40 -70,-80 -40,-95 C-45,-70 -55,-30 -80,-10 Z" fill="#e07a5f"/>
    <path d="M-70,20 C-95,-10 -80,-50 -50,-65 C-50,-40 -55,-10 -70,20 Z" fill="#e07a5f"/>
    <path d="M-50,50 C-80,30 -75,-10 -45,-25 C-40,0 -40,30 -50,50 Z" fill="#e07a5f"/>

    <path d="M80,-10 C100,-40 70,-80 40,-95 C45,-70 55,-30 80,-10 Z" fill="#e07a5f"/>
    <path d="M70,20 C95,-10 80,-50 50,-65 C50,-40 55,-10 70,20 Z" fill="#e07a5f"/>
    <path d="M50,50 C80,30 75,-10 45,-25 C40,0 40,30 50,50 Z" fill="#e07a5f"/>

    <!-- Globe Grid -->
    <circle cx="0" cy="0" r="65" stroke="#e07a5f" stroke-width="4" fill="none"/>
    <ellipse cx="0" cy="0" rx="65" ry="25" stroke="#e07a5f" stroke-width="3" fill="none"/>
    <ellipse cx="0" cy="0" rx="30" ry="65" stroke="#e07a5f" stroke-width="3" fill="none"/>
    <line x1="-65" y1="0" x2="65" y2="0" stroke="#e07a5f" stroke-width="3"/>

    <!-- Staff & Snake -->
    <line x1="0" y1="-85" x2="0" y2="85" stroke="#ffffff" stroke-width="8" stroke-linecap="round"/>
    <line x1="0" y1="-85" x2="0" y2="85" stroke="#e07a5f" stroke-width="5" stroke-linecap="round"/>
    <path d="M-12,-65 C12,-45 12,-25 -12,-5 C12,15 12,35 -12,55 C12,70 8,80 0,85" fill="none" stroke="#e07a5f" stroke-width="6" stroke-linecap="round"/>
  </g>

  <!-- WHO French Text Official Typography -->
  <text x="300" y="375" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="800" font-size="25" fill="#e07a5f" text-anchor="middle" letter-spacing="-0.5">
    Organisation
  </text>
  <text x="300" y="405" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="800" font-size="25" fill="#e07a5f" text-anchor="middle" letter-spacing="-0.5">
    mondiale de la Santé
  </text>

  <!-- Divider Line -->
  <line x1="160" y1="425" x2="440" y2="425" stroke="#e07a5f" stroke-width="3" stroke-linecap="round"/>

  <text x="300" y="460" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="700" font-size="26" fill="#0284c7" text-anchor="middle" letter-spacing="0.5">
    Région africaine
  </text>

  <!-- ISTWAMONITOR Badge Footer -->
  <rect x="100" y="490" width="400" height="60" rx="16" fill="#EFF0DA" stroke="#c8caa8" stroke-width="2"/>
  <text x="300" y="532" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="28" fill="#1c2219" text-anchor="middle" letter-spacing="3">
    ISTWA<tspan fill="#0284c7">MONITOR</tspan>
  </text>
</svg>
`;

async function main() {
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  fs.writeFileSync(path.join(publicDir, 'istwa.svg'), svgLogo);
  
  await sharp(Buffer.from(svgLogo))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'istwa.png'));

  console.log('Generated updated public/istwa.png successfully');
}

main().catch(console.error);
