/**
 * Automated Debug Log Cleanup Script
 *
 * This script removes console.log debug statements from source files
 * while preserving console.error and console.warn for actual error handling.
 *
 * Usage: node cleanup-debug-logs.js
 */

const fs = require('fs');
const path = require('path');

// Files that contain console.log statements to clean
const filesToClean = [
  'src/app/login/login-content.tsx',
  'src/app/dashboard/page.tsx',
  'src/app/api/team/import/route.ts',
  'src/components/auth/auth-provider-client.tsx',
  'src/lib/supabase.ts',
  'src/app/api/advisor/chat/route.ts',
  'src/app/api/auth/login/route.ts',
  'src/lib/fpl-api.ts',
  'src/app/api/auth/signup/route.ts',
  'src/components/auth/AuthGuard.tsx',
  'src/app/api/init-db/route.ts',
  'src/lib/socket.ts',
  'src/app/api/notifications/route.ts',
];

// Patterns to remove (console.log statements)
const patternsToRemove = [
  /console\.log\([^)]*\);?\s*\n/g,  // Simple console.log
  /console\.log\([^)]*\)\s*\n/g,     // Without semicolon
  /\s*\/\/\s*console\.log\([^)]*\);?\s*\n/g,  // Commented out console.log
];

// Patterns to keep (important error logging)
// console.error and console.warn will be preserved

function cleanFile(filePath) {
  const fullPath = path.join(__dirname, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return { skipped: true };
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;

  // Remove console.log statements
  patternsToRemove.forEach(pattern => {
    content = content.replace(pattern, '');
  });

  // Remove [DEBUG] prefixes from error messages
  content = content.replace(/\[DEBUG\]\s*/g, '');
  content = content.replace(/\[API\]\s*/g, '');
  content = content.replace(/\[GLM API\]\s*/g, '');
  content = content.replace(/\[FPL API\]\s*/g, '');

  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    const removedLines = (originalContent.match(/console\.log/g) || []).length;
    return { cleaned: true, removedLines };
  }

  return { cleaned: false };
}

function main() {
  console.log('🧹 Starting debug log cleanup...\n');

  let totalCleaned = 0;
  let totalRemoved = 0;
  let totalSkipped = 0;

  filesToClean.forEach(filePath => {
    const result = cleanFile(filePath);

    if (result.skipped) {
      console.log(`⏭️  Skipped: ${filePath}`);
      totalSkipped++;
    } else if (result.cleaned) {
      console.log(`✅ Cleaned: ${filePath} (removed ${result.removedLines} console.log statements)`);
      totalCleaned++;
      totalRemoved += result.removedLines;
    } else {
      console.log(`✓  No changes: ${filePath}`);
    }
  });

  console.log(`\n📊 Summary:`);
  console.log(`   Files cleaned: ${totalCleaned}`);
  console.log(`   Files skipped: ${totalSkipped}`);
  console.log(`   Files unchanged: ${filesToClean.length - totalCleaned - totalSkipped}`);
  console.log(`   Console.log statements removed: ${totalRemoved}`);
  console.log(`\n✨ Debug log cleanup complete!`);
}

main();
