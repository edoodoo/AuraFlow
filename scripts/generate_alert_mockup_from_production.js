/* eslint-disable @typescript-eslint/no-require-imports */
const sharp = require("sharp");

const input =
  "C:/Users/eduar/.cursor/projects/c-Users-eduar-OneDrive-rea-de-Trabalho-auraflow/assets/c__Users_eduar_AppData_Roaming_Cursor_User_workspaceStorage_4891101d6589162d4739c9256a610d58_images_image-89510159-c8a0-431f-8738-811a43c8eee3.png";
const output = "public/ux-mockups/mockup-1-alerta-producao.png";

const width = 1024;
const height = 631;

const overlay = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="warnBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#3b0f1f" stop-opacity="0.92"/>
      <stop offset="100%" stop-color="#5a1630" stop-opacity="0.92"/>
    </linearGradient>
  </defs>

  <rect x="242" y="171" width="560" height="56" rx="14" fill="url(#warnBg)" stroke="#fb7185" stroke-opacity="0.55"/>
  <rect x="258" y="186" width="98" height="26" rx="13" fill="#ef4444"/>
  <text x="273" y="203" font-size="12" font-family="Inter, Segoe UI, Arial" font-weight="700" fill="#ffffff">Ajuste urgente</text>
  <text x="368" y="204" font-size="13" font-family="Inter, Segoe UI, Arial" fill="#ffe4ec">Mes pode fechar negativo se nada mudar</text>

  <rect x="665" y="184" width="123" height="30" rx="9" fill="#f43f5e"/>
  <text x="676" y="203" font-size="12" font-family="Inter, Segoe UI, Arial" font-weight="700" fill="#ffffff">Revisar no mensal</text>
</svg>
`;

sharp(input)
  .composite([{ input: Buffer.from(overlay), top: 0, left: 0 }])
  .png()
  .toFile(output)
  .then(() => {
    console.log(output);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
