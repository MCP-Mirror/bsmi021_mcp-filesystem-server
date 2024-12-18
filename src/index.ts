#!/usr/bin/env node

/**
 * MCP server that provides file system operations.
 * Implements tools for common file system tasks like:
 * - Listing directory contents with metadata
 * - Creating directories
 * - Deleting files/directories
 * - Moving/renaming files
 * - Copying files
 * - Getting file metadata
 * - Reading file contents
 * - Writing/modifying files
 * - Reading multiple files
 * - Searching within files
 * - File analysis and integrity checks
 * - Compression operations
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { server } from './server.js';

/**
 * Start the server using stdio transport
 */
async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('File system MCP server running on stdio');
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  try {
    await server.close();
  } catch (error) {
    console.error("Error during shutdown:", error);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  try {
    await server.close();
  } catch (error) {
    console.error("Error during shutdown:", error);
  }
  process.exit(0);
});

// Start the server
main().catch((error: Error) => {
  console.error("Server error:", error);
  process.exit(1);
});
