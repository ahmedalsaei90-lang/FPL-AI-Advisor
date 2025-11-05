// server.ts - Next.js Standalone + Socket.IO with comprehensive debugging
import { setupSocket } from '@/lib/socket';
import { createServer } from 'http';
import { Server } from 'socket.io';
import next from 'next';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync, unlinkSync } from 'fs';
import { join, extname } from 'path';

// Set environment variables to disable Next.js tracing and avoid EPERM errors
process.env.NEXT_TELEMETRY_DISABLED = '1';
process.env.NEXT_TRACE_EVENTS_DISABLED = '1';
process.env.NODE_OPTIONS = '--max-old-space-size=4096';
// Additional Windows-specific fixes for EPERM errors
process.env.NEXT_PRIVATE_STANDALONE = 'true';
process.env.NEXT_MANUAL_SIG_HANDLE = 'true';

const dev = process.env.NODE_ENV !== 'production';
const currentPort = 3000;
const hostname = '0.0.0.0';

// Performance monitoring
const performanceMetrics = {
  serverStartTime: Date.now(),
  requestCount: 0,
  errorCount: 0,
  avgResponseTime: 0,
  totalResponseTime: 0
};

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

// Clean up any locked trace files on Windows
function cleanupTraceFiles() {
  try {
    const traceFile = join(process.cwd(), '.next', 'trace');
    if (existsSync(traceFile)) {
      try {
        unlinkSync(traceFile);
        console.log('[DEBUG] Server: Cleaned up existing trace file');
      } catch (err) {
        console.log('[DEBUG] Server: Could not remove trace file (may be locked):', err);
      }
    }
  } catch (error) {
    console.log('[DEBUG] Server: Trace file cleanup skipped:', error);
  }
}

cleanupTraceFiles();

// Custom server with Socket.IO integration
async function createCustomServer() {
  try {
    console.log('[DEBUG] Server: Starting custom server creation');
    console.log('[DEBUG] Server: Current time:', new Date().toISOString());
    console.log('[DEBUG] Server: Process PID:', process.pid);
    console.log('[DEBUG] Server: Node.js version:', process.version);
    console.log('[DEBUG] Server: Environment variables:', {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      HOSTNAME: process.env.HOSTNAME
    });
    
    // Create Next.js app
    console.log('[DEBUG] Server: Creating Next.js app instance...');
    console.log('[DEBUG] Server: Using standard .next build directory');
    const nextApp = next({
      dev,
      dir: process.cwd(),
      // Using standard .next directory (no custom distDir needed)
    });
    console.log('[DEBUG] Server: Next.js app instance created');

    console.log('[DEBUG] Server: Starting Next.js app preparation...');
    console.log('[DEBUG] Server: This may take longer on first run or after configuration changes');
    const prepareStartTime = Date.now();

    // Add timeout handling for app preparation
    const prepareTimeout = 90000; // 90 seconds
    let timeoutId: NodeJS.Timeout;
    let progressInterval: NodeJS.Timeout;

    const preparePromise = nextApp.prepare();
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`Next.js app preparation timed out after ${prepareTimeout / 1000} seconds`));
      }, prepareTimeout);

      // Log progress every 5 seconds
      let elapsed = 0;
      progressInterval = setInterval(() => {
        elapsed += 5000;
        if (elapsed % 5000 === 0) {
          console.log(`[DEBUG] Server: App preparation in progress... (${elapsed}ms elapsed)`);
        }
      }, 5000);
    });

    try {
      await Promise.race([preparePromise, timeoutPromise]);
      clearTimeout(timeoutId);
      clearInterval(progressInterval);
      const prepareEndTime = Date.now();
      console.log(`[DEBUG] Server: Next.js app prepared successfully in ${prepareEndTime - prepareStartTime}ms`);
    } catch (error) {
      clearTimeout(timeoutId);
      clearInterval(progressInterval);
      console.error('[DEBUG] Server: App preparation failed:', error);
      throw error;
    }

    const handle = nextApp.getRequestHandler();

    // Create HTTP server that will handle both Next.js and Socket.IO
    console.log('[DEBUG] Server: Creating HTTP server...');
    const server = createServer((req, res) => {
      const requestStartTime = Date.now();
      performanceMetrics.requestCount++;

      try {
        // Skip socket.io requests from Next.js handler
        if (req.url?.startsWith('/api/socketio')) {
          return;
        }

        // FIXED: Handle static files from /_next/static directory (was checking for /static/)
        if (req.url?.startsWith('/_next/static/')) {
          const staticPath = join(process.cwd(), '.next', req.url.replace('/_next/', ''));

          // Check if the file exists
          if (existsSync(staticPath)) {
            try {
              const stats = statSync(staticPath);

              // Set appropriate content type based on file extension
              const ext = extname(staticPath);
              let contentType = 'text/plain';

              switch (ext) {
                case '.js':
                  contentType = 'application/javascript';
                  break;
                case '.css':
                  contentType = 'text/css';
                  break;
                case '.json':
                  contentType = 'application/json';
                  break;
                case '.png':
                  contentType = 'image/png';
                  break;
                case '.jpg':
                case '.jpeg':
                  contentType = 'image/jpeg';
                  break;
                case '.svg':
                  contentType = 'image/svg+xml';
                  break;
                case '.ico':
                  contentType = 'image/x-icon';
                  break;
                case '.woff':
                  contentType = 'font/woff';
                  break;
                case '.woff2':
                  contentType = 'font/woff2';
                  break;
                case '.ttf':
                  contentType = 'font/ttf';
                  break;
                case '.eot':
                  contentType = 'application/vnd.ms-fontobject';
                  break;
                case '.webp':
                  contentType = 'image/webp';
                  break;
                case '.map':
                  contentType = 'application/json';
                  break;
              }

              // Set cache headers for static assets
              res.setHeader('Content-Type', contentType);
              res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
              res.setHeader('Access-Control-Allow-Origin', '*');

              // Read and serve the file
              const fileContent = readFileSync(staticPath);
              res.statusCode = 200;
              res.end(fileContent);

              // Update performance metrics
              const responseTime = Date.now() - requestStartTime;
              performanceMetrics.totalResponseTime += responseTime;
              performanceMetrics.avgResponseTime = performanceMetrics.totalResponseTime / performanceMetrics.requestCount;

              console.log(`[DEBUG] Server: ✓ Served static file: ${req.url} (${responseTime}ms)`);
              return;
            } catch (fileError) {
              console.error(`[DEBUG] Server: Error reading static file: ${staticPath}`, fileError);
              performanceMetrics.errorCount++;
              res.statusCode = 500;
              res.end('Error reading static file');
              return;
            }
          } else {
            console.log(`[DEBUG] Server: Static file not found: ${staticPath}`);
            performanceMetrics.errorCount++;
            res.statusCode = 404;
            res.end('Static file not found');
            return;
          }
        }

        // Add debug logging for requests
        console.log(`[DEBUG] Server: ${req.method} ${req.url}`);

        handle(req, res).then(() => {
          // Update performance metrics
          const responseTime = Date.now() - requestStartTime;
          performanceMetrics.totalResponseTime += responseTime;
          performanceMetrics.avgResponseTime = performanceMetrics.totalResponseTime / performanceMetrics.requestCount;
        }).catch((handleError) => {
          console.error('[DEBUG] Server: Request handler error:', handleError);
          performanceMetrics.errorCount++;
        });
      } catch (error) {
        console.error('[DEBUG] Server: Error handling request:', error);
        performanceMetrics.errorCount++;
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
      console.log(`> Performance metrics available (internal use)`);

      // Log performance metrics every 60 seconds
      setInterval(() => {
        const uptime = Date.now() - performanceMetrics.serverStartTime;
        const uptimeMinutes = Math.floor(uptime / 60000);
        console.log('[DEBUG] Server: Performance Metrics:', {
          uptime: `${uptimeMinutes}m`,
          requests: performanceMetrics.requestCount,
          errors: performanceMetrics.errorCount,
          avgResponseTime: `${performanceMetrics.avgResponseTime.toFixed(2)}ms`,
          errorRate: `${((performanceMetrics.errorCount / performanceMetrics.requestCount) * 100).toFixed(2)}%`
        });
      }, 60000);
    });

    // Handle server errors
    server.on('error', (error: any) => {
      console.error('[DEBUG] Server: Server error:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`[DEBUG] Server: Port ${currentPort} is already in use`);
        console.error('[DEBUG] Server: Please kill the process using this port and try again');
        process.exit(1);
      }
    });

    // Graceful shutdown handling
    const gracefulShutdown = (signal: string) => {
      console.log(`\n[DEBUG] Server: Received ${signal}, starting graceful shutdown...`);
      server.close(() => {
        console.log('[DEBUG] Server: HTTP server closed');
        console.log('[DEBUG] Server: Final performance metrics:', {
          totalRequests: performanceMetrics.requestCount,
          totalErrors: performanceMetrics.errorCount,
          avgResponseTime: `${performanceMetrics.avgResponseTime.toFixed(2)}ms`
        });
        process.exit(0);
      });

      // Force exit after 10 seconds
      setTimeout(() => {
        console.error('[DEBUG] Server: Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (err) {
    console.error('[DEBUG] Server: Server startup error:', err);
    console.error('[DEBUG] Server: Stack trace:', err instanceof Error ? err.stack : 'N/A');
    process.exit(1);
  }
}

// Start the server
console.log('[DEBUG] Server: Initiating server startup...');
createCustomServer().catch((error) => {
  console.error('[DEBUG] Server: Fatal error during server creation:', error);
  process.exit(1);
});
