// EPERM Fix Script
// This script implements a comprehensive fix for the EPERM error with Next.js trace files

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('='.repeat(60));
console.log('EPERM Error Fix Implementation');
console.log('='.repeat(60));

// 1. Kill all Node.js processes that might be holding locks on the trace file
console.log('\n1. Terminating Node.js processes...');
try {
  execSync('taskkill /F /IM node.exe >nul 2>&1', { stdio: 'inherit' });
  console.log('   Node.js processes terminated');
} catch (error) {
  console.log('   No Node.js processes to terminate or error occurred');
}

try {
  execSync('taskkill /F /IM tsx.exe >nul 2>&1', { stdio: 'inherit' });
  console.log('   TSX processes terminated');
} catch (error) {
  console.log('   No TSX processes to terminate or error occurred');
}

// 2. Remove the locked trace file by taking ownership
console.log('\n2. Attempting to remove locked trace file...');
const traceFile = path.join(process.cwd(), '.next', 'trace');

if (fs.existsSync(traceFile)) {
  try {
    // Try to remove the file directly first
    fs.unlinkSync(traceFile);
    console.log('   Trace file removed successfully');
  } catch (error) {
    console.log(`   Direct removal failed: ${error.message}`);
    
    // If direct removal fails, try using Windows commands
    try {
      execSync(`del /f "${traceFile}"`, { stdio: 'inherit' });
      console.log('   Trace file removed using Windows del command');
    } catch (delError) {
      console.log(`   Windows del command also failed: ${delError.message}`);
      
      // As a last resort, try to move the file
      const tempFile = path.join(process.cwd(), '.next', `trace.${Date.now()}.bak`);
      try {
        fs.renameSync(traceFile, tempFile);
        console.log(`   Trace file moved to ${tempFile}`);
      } catch (renameError) {
        console.log(`   Moving file also failed: ${renameError.message}`);
        console.log('   Will proceed with alternative approach');
      }
    }
  }
}

// 3. Create a custom next.config.ts with trace disabled
console.log('\n3. Updating Next.js configuration...');
const nextConfigPath = path.join(process.cwd(), 'next.config.ts');
const nextConfigContent = `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  // 禁用 Next.js 热重载，由 nodemon 处理重编译
  reactStrictMode: false,
  // Using standard .next directory for better compatibility
  // distDir: './.next-build', // Disabled to use default .next directory
  webpack: (config, { dev }) => {
    if (dev) {
      // Only ignore node_modules to allow proper file watching for other files
      config.watchOptions = {
        ignored: ['**/node_modules/**', '**/.git/**', '**/.next/**', '**/.next-build/**'],
      };
    }
    return config;
  },
  eslint: {
    // 构建时忽略ESLint错误
    ignoreDuringBuilds: true,
  },
  // Disable tracing to prevent EPERM errors
  experimental: {
    tracing: false,
  },
};

export default nextConfig;
`;

try {
  fs.writeFileSync(nextConfigPath, nextConfigContent);
  console.log('   Next.js configuration updated to disable tracing');
} catch (error) {
  console.log(`   Error updating Next.js configuration: ${error.message}`);
}

// 4. Update .env.local with environment variables
console.log('\n4. Updating environment variables...');
const envLocalPath = path.join(process.cwd(), '.env.local');
let envContent = '';

if (fs.existsSync(envLocalPath)) {
  envContent = fs.readFileSync(envLocalPath, 'utf8');
}

// Add or update the EPERM prevention variables
const epermVars = [
  'NEXT_TELEMETRY_DISABLED=1',
  'NEXT_TRACE_EVENTS_DISABLED=1',
  'NODE_OPTIONS=--max-old-space-size=4096'
];

epermVars.forEach(varLine => {
  const varName = varLine.split('=')[0];
  if (envContent.includes(`${varName}=`)) {
    envContent = envContent.replace(new RegExp(`${varName}=.*`), varLine);
  } else {
    envContent += `\n${varLine}`;
  }
});

try {
  fs.writeFileSync(envLocalPath, envContent);
  console.log('   Environment variables updated in .env.local');
} catch (error) {
  console.log(`   Error updating .env.local: ${error.message}`);
}

// 5. Create a startup script that sets environment variables
console.log('\n5. Creating startup script...');
const startupScript = `@echo off
echo Setting environment variables to prevent EPERM errors...
set NEXT_TELEMETRY_DISABLED=1
set NEXT_TRACE_EVENTS_DISABLED=1
set NODE_OPTIONS=--max-old-space-size=4096

echo Starting Next.js development server...
npm run dev
`;

const startupScriptPath = path.join(process.cwd(), 'start-dev-fixed.bat');
try {
  fs.writeFileSync(startupScriptPath, startupScript);
  console.log('   Startup script created: start-dev-fixed.bat');
} catch (error) {
  console.log(`   Error creating startup script: ${error.message}`);
}

// 6. Update package.json with a new script
console.log('\n6. Updating package.json...');
const packageJsonPath = path.join(process.cwd(), 'package.json');
try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  if (!packageJson.scripts) {
    packageJson.scripts = {};
  }
  
  packageJson.scripts['dev:fixed'] = 'start-dev-fixed.bat';
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('   Package.json updated with dev:fixed script');
} catch (error) {
  console.log(`   Error updating package.json: ${error.message}`);
}

console.log('\n='.repeat(60));
console.log('EPERM Fix Implementation Complete');
console.log('='.repeat(60));
console.log('\nTo start the development server with the fix:');
console.log('  npm run dev:fixed');
console.log('\nOr manually set the environment variables before running:');
console.log('  set NEXT_TELEMETRY_DISABLED=1');
console.log('  set NEXT_TRACE_EVENTS_DISABLED=1');
console.log('  npm run dev');