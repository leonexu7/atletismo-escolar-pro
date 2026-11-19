import fs from 'fs';
import path from 'path';

const distDir = process.argv[2] || 'dist';
const resolvedDist = path.resolve(process.cwd(), distDir);

console.log(`\n🔍 [Production-Web Audit] Verificando directorio de producción: ${resolvedDist}`);

if (!fs.existsSync(resolvedDist)) {
  console.error(`❌ Error: El directorio "${distDir}" no existe. Ejecuta primero "npm run build".`);
  process.exit(1);
}

let mapFilesFound = 0;
let inlineMapsFound = 0;
let totalFilesChecked = 0;

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      scanDir(fullPath);
    } else {
      totalFilesChecked++;
      const relativePath = path.relative(resolvedDist, fullPath);

      // 1. Validar que no existan archivos .map
      if (entry.name.endsWith('.map')) {
        console.error(`❌ VIOLACIÓN: Archivo source map detectado: ${relativePath}`);
        mapFilesFound++;
      }

      // 2. Validar que no haya directivas inline sourceMappingURL en .js o .css
      if (entry.name.endsWith('.js') || entry.name.endsWith('.css')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('sourceMappingURL=')) {
          console.error(`❌ VIOLACIÓN: Directiva sourceMappingURL inline detectada en: ${relativePath}`);
          inlineMapsFound++;
        }
      }
    }
  }
}

scanDir(resolvedDist);

console.log(`📊 Archivos auditados: ${totalFilesChecked}`);

if (mapFilesFound > 0 || inlineMapsFound > 0) {
  console.error(`\n❌ AUDITORÍA FALLIDA: Se encontraron ${mapFilesFound} archivos .map y ${inlineMapsFound} directivas inline.`);
  console.error(`Por favor, asegura que build.sourcemap: false esté configurado en vite.config.js.`);
  process.exit(1);
} else {
  console.log(`\n✅ AUDITORÍA EXITOSA: Cero source maps detectados. El paquete cumple con el estándar estricto de Production-Web.\n`);
}
