/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

const inputPath =
  "C:/Users/eduar/.cursor/projects/c-Users-eduar-OneDrive-rea-de-Trabalho-auraflow/assets/c__Users_eduar_AppData_Roaming_Cursor_User_workspaceStorage_4891101d6589162d4739c9256a610d58_images_image-509f18b6-38c7-4bc7-87d6-b50e3db26d49.png";
const outputSvgPath = path.resolve("public/ux-mockups/mockup-alerta-integrado-producao-final.svg");

const imageBytes = fs.readFileSync(inputPath);
const imageBase64 = imageBytes.toString("base64");
const width = 1024;
const height = 631;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <image href="data:image/png;base64,${imageBase64}" x="0" y="0" width="${width}" height="${height}" />

  <!-- Ritmo do mes card (linha dos 6 cards) -->
  <rect x="440" y="350" width="104" height="46" rx="10" fill="#0f172a" fill-opacity="0.95"/>
  <text x="448" y="381" font-size="41" font-family="Inter, Segoe UI, Arial" font-weight="700" fill="#fda4af">104%</text>
  <rect x="448" y="399" width="136" height="18" rx="9" fill="#3f1a27" fill-opacity="0.95"/>
  <text x="456" y="412" font-size="11" font-family="Inter, Segoe UI, Arial" font-weight="600" fill="#fecdd3">Ajuste urgente</text>
  <rect x="576" y="346" width="28" height="28" rx="10" fill="#7f1d1d" fill-opacity="0.55"/>
  <path d="M590 354 L596 365 L584 365 Z" fill="#fecdd3"/>
  <circle cx="590" cy="369" r="1.8" fill="#fecdd3"/>

  <!-- Ritmo do mes bloco grande (linha dos 2 blocos) -->
  <rect x="512" y="479" width="76" height="52" rx="10" fill="#4c1d2d" fill-opacity="0.95"/>
  <text x="524" y="499" font-size="11" font-family="Inter, Segoe UI, Arial" font-weight="700" fill="#fecdd3">Ajuste</text>
  <text x="522" y="513" font-size="11" font-family="Inter, Segoe UI, Arial" font-weight="700" fill="#fecdd3">urgente</text>
  <rect x="255" y="523" width="327" height="8" rx="4" fill="#fb7185"/>
  <rect x="245" y="539" width="132" height="15" rx="6" fill="#3f1a27" fill-opacity="0.95"/>
  <text x="251" y="550" font-size="10" font-family="Inter, Segoe UI, Arial" font-weight="600" fill="#fecdd3">104% do orcamento</text>
  <rect x="486" y="539" width="101" height="15" rx="6" fill="#3f1a27" fill-opacity="0.95"/>
  <text x="492" y="550" font-size="10" font-family="Inter, Segoe UI, Arial" font-weight="600" fill="#fecdd3">Saldo -R$620</text>
</svg>`;

fs.writeFileSync(outputSvgPath, svg, "utf-8");
console.log(outputSvgPath);
