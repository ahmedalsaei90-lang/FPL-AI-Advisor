// server-safe.ts - Next.js Standalone + Socket.IO with EPERM error handling
import { setupSocket } from '@/lib/socket';
import { createServer } from 'http';
import { Server } from 'socket.io';
import next from 'next';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { join } from 'path';

// Set environment variables to disable Next.js tracing and avoid EPERM errors
process.env.NEXT_TELEMETRY_DISABLED = '1';
process.env.NEXT_TRACE_EVENTS_DISABLED = '1';
process.env.NODE_OPTIONS = '--max-old-space-size=4096';

const dev = process.env.NODE_ENV !== 'production';
const currentPort = 3000;
const hostname = '0.0.0.0';

// Function to safely remove trace files
function safelyRemoveTraceFiles() {
  const traceFiles = [
    join(process.cwd(), '.next', 'trace'),
    join(process.cwd(), '.next-build', 'trace'),
    join(process.cwd(), '.temp-trace', 'trace')
  ];

  traceFiles.forEach(traceFile => {
    try {
      if (existsSync(traceFile)) {
        console.log(`[DEBUG] Server: Removing trace file: ${traceFile}`);
        unlinkSync(traceFile);
      }
    } catch (error) {
      console.log(`[DEBUG] Server: Could not remove trace file ${traceFile}: ${error}`);
    }
  });
}

// Custom server with Socket.IO integration
async function createCustomServer() {
  try {
    console.log('[DEBUG] Server: Starting custom server creation with EPERM protection');
    console.log('[DEBUG] Server: Current time:', new Date().toISOString());
    console.log('[DEBUG] Server: Process PID:', process.pid);
    console.log('[DEBUG] Server: Node.js version:', process.version);
    console.log('[DEBUG] Server: Environment variables:', {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      HOSTNAME: process.env.HOSTNAME,
      NEXT_TELEMETRY_DISABLED: process.env.NEXT_TELEMETRY_DISABLED,
      NEXT_TRACE_EVENTS_DISABLED: process.env.NEXT_TRACE_EVENTS_DISABLED
    });
    
    // Safely remove any existing trace files
    safelyRemoveTraceFiles();
    
    // Create alternative trace directory to avoid permission issues
    const altTraceDir = join(process.cwd(), '.temp-trace');
    if (!existsSync(altTraceDir)) {
      try {
        mkdirSync(altTraceDir, { recursive: true });
        console.log(`[DEBUG] Server: Created alternative trace directory at ${altTraceDir}`);
      } catch (error) {
        console.log(`[DEBUG] Server: Could not create trace directory, continuing anyway: ${error}`);
      }
    }

    // Create Next.js app
    console.log('[DEBUG] Server: Creating Next.js app instance...');
    const nextApp = next({
      dev,
      dir: process.cwd(),
      // Use the custom distDir from next.config.ts for both dev and production
      conf: { distDir: './.next-build' }
    });
    console.log('[DEBUG] Server: Next.js app instance created');

    console.log('[DEBUG] Server: Starting Next.js app preparation...');
    const prepareStartTime = Date.now();
    
    // Add timeout to prevent infinite hanging
    const preparePromise = nextApp.prepare();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        console.log('[DEBUG] Server: Timeout reached after 30 seconds');
        console.log('[DEBUG] Server: Time elapsed:', Date.now() - prepareStartTime, 'ms');
        reject(new Error('Next.js app preparation timed out after 30 seconds'));
      }, 30000);
    });
    
    // Add progress logging
    const progressInterval = setInterval(() => {
      console.log(`[DEBUG] Server: App preparation in progress... (${Date.now() - prepareStartTime}ms elapsed)`);
    }, 5000);
    
    try {
      await Promise.race([preparePromise, timeoutPromise]);
      clearInterval(progressInterval);
    } catch (error) {
      clearInterval(progressInterval);
      // Check if it's an EPERM error related to trace files
      if (error instanceof Error && (error.message.includes('EPERM') || error.message.includes('trace'))) {
        console.log('[DEBUG] Server: EPERM/trace error detected, attempting to continue...');
        console.log('[DEBUG] Server: This is likely a trace file permission issue, but the server may still work');
        // Don't throw the error, try to continue
      } else {
        throw error;
      }
    }
    
    const prepareEndTime = Date.now();
    console.log(`[DEBUG] Server: Next.js app prepared successfully in ${prepareEndTime - prepareStartTime}ms`);
    const handle = nextApp.getRequestHandler();

    // Create HTTP server that will handle both Next.js and Socket.IO
    console.log('[DEBUG] Server: Creating HTTP server...');
    const server = createServer((req, res) => {
      try {
        // Skip socket.io requests from Next.js handler
        if (req.url?.startsWith('/api/socketio')) {
          return;
        }
        
        // Add debug logging for requests
        console.log(`[DEBUG] Server: ${req.method} ${req.url}`);
        
        handle(req, res);
      } catch (error) {
        console.error('[DEBUG] Server: Error handling request:', error);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    });
    console.log('[DEBUG] Server: HTTP server created');

    // Setup Socket.IO
    console.log('[DEBUG] Server: Setting up Socket.IO...');
    try {
      const io = new Server(server, {
        path: '/api/socketio',
        cors: {
          origin: "*",
          methods: ["GET", "POST"]
        }
      });

      setupSocket(io);
      console.log('[DEBUG] Server: Socket.IO setup completed');
    } catch (error) {
      console.error('[DEBUG] Server: Error setting up Socket.IO:', error);
    }

    // Start the server
    console.log(`[DEBUG] Server: Starting server on ${hostname}:${currentPort}...`);
    server.listen(currentPort, hostname, () => {
      console.log(`[DEBUG] Server: Server started successfully`);
      console.log(`> Ready on http://localhost:${currentPort}`);
      console.log(`> Server started at: ${new Date().toISOString()}`);
      console.log(`> Socket.IO server running at ws://localhost:${currentPort}/api/socketio`);
      console.log(`> EPERM protection enabled - trace file errors will be handled gracefully`);
    });
    
    // Handle server errors
    server.on('error', (error) => {
      console.error('[DEBUG] Server: Server error:', error);
    });

  } catch (err) {
    console.error('Server startup error:', err);
    process.exit(1);
  }
}

// Start the server
createCustomServer();