// EPERM Diagnostic Script
// This script helps diagnose the EPERM error with Next.js trace files

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('='.repeat(60));
console.log('EPERM Error Diagnostic Tool');
console.log('='.repeat(60));

// 1. Check if .next directory exists and its permissions
console.log('\n1. Checking .next directory status...');
const nextDir = path.join(process.cwd(), '.next');
if (fs.existsSync(nextDir)) {
  try {
    const stats = fs.statSync(nextDir);
    console.log(`   .next directory exists: ${stats.isDirectory()}`);
    console.log(`   Permissions: ${stats.mode.toString(8)}`);
    console.log(`   Modified: ${stats.mtime}`);
  } catch (error) {
    console.log(`   Error accessing .next directory: ${error.message}`);
  }
} else {
  console.log('   .next directory does not exist');
}

// 2. Check trace file status
console.log('\n2. Checking trace file status...');
const traceFile = path.join(nextDir, 'trace');
if (fs.existsSync(traceFile)) {
  try {
    const stats = fs.statSync(traceFile);
    console.log(`   Trace file exists: ${stats.isFile()}`);
    console.log(`   Size: ${stats.size} bytes`);
    console.log(`   Modified: ${stats.mtime}`);
    console.log(`   Permissions: ${stats.mode.toString(8)}`);
    
    // Try to read the file
    try {
      const content = fs.readFileSync(traceFile, 'utf8');
      console.log(`   Successfully read ${content.length} characters from trace file`);
    } catch (readError) {
      console.log(`   Error reading trace file: ${readError.message}`);
      console.log(`   Error code: ${readError.code}`);
    }
  } catch (error) {
    console.log(`   Error accessing trace file: ${error.message}`);
    console.log(`   Error code: ${error.code}`);
  }
} else {
  console.log('   Trace file does not exist');
}

// 3. Check environment variables
console.log('\n3. Checking relevant environment variables...');
const envVars = [
  'NEXT_TELEMETRY_DISABLED',
  'NEXT_TRACE_EVENTS_DISABLED',
  'NODE_OPTIONS'
];
envVars.forEach(varName => {
  const value = process.env[varName];
  console.log(`   ${varName}: ${value || 'not set'}`);
});

// 4. Check running Node.js processes
console.log('\n4. Checking running Node.js processes...');
try {
  const processes = execSync('tasklist | findstr node', { encoding: 'utf8' });
  console.log('   Running Node.js processes:');
  console.log(processes.split('\n').filter(line => line.trim()).map(line => `   ${line}`).join('\n'));
} catch (error) {
  console.log('   Error checking Node.js processes:', error.message);
}

// 5. Try to create a test file in .next directory
console.log('\n5. Testing write permissions in .next directory...');
if (fs.existsSync(nextDir)) {
  const testFile = path.join(nextDir, 'test-permission.txt');
  try {
    fs.writeFileSync(testFile, 'test');
    console.log('   Successfully created test file in .next directory');
    fs.unlinkSync(testFile);
    console.log('   Successfully deleted test file');
  } catch (error) {
    console.log(`   Error creating/deleting test file: ${error.message}`);
    console.log(`   Error code: ${error.code}`);
  }
}

// 6. Check for alternative trace directories
console.log('\n6. Checking for alternative trace directories...');
const altDirs = ['.next-build', '.temp-trace'];
altDirs.forEach(dir => {
  const dirPath = path.join(process.cwd(), dir);
  if (fs.existsSync(dirPath)) {
    console.log(`   ${dir} directory exists`);
    const tracePath = path.join(dirPath, 'trace');
    if (fs.existsSync(tracePath)) {
      console.log(`   Trace file exists in ${dir}`);
    }
  } else {
    console.log(`   ${dir} directory does not exist`);
  }
});

console.log('\n='.repeat(60));
console.log('Diagnostic complete');
console.log('='.repeat(60));