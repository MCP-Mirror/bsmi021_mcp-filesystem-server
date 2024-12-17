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
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, ErrorCode, McpError, } from "@modelcontextprotocol/sdk/types.js";
import { promises as fs } from 'fs';
import path from 'path';
import * as crypto from 'crypto';
import * as mimeTypes from 'mime-types';
import * as chardet from 'chardet';
import Archiver from 'archiver';
import extract from 'extract-zip';
import { createReadStream, createWriteStream } from 'fs';
/**
 * Create an MCP server with tools for file system operations
 */
const server = new Server({
    name: "my-filesystem-server",
    version: "0.1.0",
}, {
    capabilities: {
        tools: {},
    },
});
/**
 * Get file stats with additional metadata
 */
async function getFileStats(filePath) {
    const stats = await fs.stat(filePath);
    return {
        name: path.basename(filePath),
        path: filePath,
        size: stats.size,
        isDirectory: stats.isDirectory(),
        created: stats.birthtime,
        modified: stats.mtime,
        accessed: stats.atime,
        mode: stats.mode.toString(8).slice(-3), // Convert to octal permission string
    };
}
/**
 * Get all files in directory recursively
 */
async function getAllFiles(dirPath, pattern) {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const files = await Promise.all(entries.map(async (entry) => {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            return getAllFiles(fullPath, pattern);
        }
        if (pattern && !entry.name.match(new RegExp(pattern))) {
            return [];
        }
        return [fullPath];
    }));
    return files.flat();
}
/**
 * Calculate file hash
 */
async function calculateHash(filePath, algorithm = 'sha256') {
    const hash = crypto.createHash(algorithm);
    const stream = createReadStream(filePath);
    return new Promise((resolve, reject) => {
        stream.on('data', data => hash.update(data));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', error => reject(error));
    });
}
/**
 * Analyze text file
 */
async function analyzeTextFile(filePath) {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    const words = content.split(/\s+/).filter(word => word.length > 0);
    const encoding = await chardet.detectFile(filePath) || 'unknown';
    return {
        lineCount: lines.length,
        wordCount: words.length,
        charCount: content.length,
        encoding: encoding.toString(),
        mimeType: mimeTypes.lookup(filePath) || 'application/octet-stream'
    };
}
/**
 * Search for pattern in file
 */
async function searchInFile(filePath, pattern) {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    const matches = [];
    lines.forEach((line, index) => {
        const match = line.match(pattern);
        if (match) {
            matches.push({
                file: filePath,
                line: index + 1,
                content: line,
                match: match[0]
            });
        }
    });
    return matches;
}
/**
 * Create zip archive
 */
async function createZip(files, outputPath) {
    const output = createWriteStream(outputPath);
    const archive = Archiver('zip', { zlib: { level: 9 } });
    archive.pipe(output);
    for (const file of files) {
        const stats = await fs.stat(file);
        if (stats.isDirectory()) {
            archive.directory(file, path.basename(file));
        }
        else {
            archive.file(file, { name: path.basename(file) });
        }
    }
    return new Promise((resolve, reject) => {
        output.on('close', resolve);
        archive.on('error', reject);
        archive.finalize();
    });
}
/**
 * Extract zip archive
 */
async function extractZip(zipPath, outputPath) {
    await extract(zipPath, { dir: outputPath });
}
/**
 * Find duplicate files in directory
 */
async function findDuplicates(dirPath) {
    const files = await getAllFiles(dirPath);
    const hashMap = new Map();
    for (const file of files) {
        const hash = await calculateHash(file);
        const existing = hashMap.get(hash) || [];
        hashMap.set(hash, [...existing, file]);
    }
    const duplicates = [];
    for (const [hash, files] of hashMap.entries()) {
        if (files.length > 1) {
            const stats = await fs.stat(files[0]);
            duplicates.push({
                hash,
                size: stats.size,
                files
            });
        }
    }
    return duplicates;
}
/**
 * List directory contents recursively
 */
async function listDirectoryContents(dirPath, recursive) {
    const files = await fs.readdir(dirPath);
    const results = await Promise.all(files.map(async (file) => {
        const fullPath = path.join(dirPath, file);
        const stats = await getFileStats(fullPath);
        if (recursive && stats.isDirectory) {
            const subResults = await listDirectoryContents(fullPath, true);
            return {
                ...stats,
                contents: subResults
            };
        }
        return stats;
    }));
    return results;
}
/**
 * Read file with metadata
 */
async function readFileWithMetadata(filePath, encoding = 'utf8') {
    const stats = await getFileStats(filePath);
    if (stats.isDirectory) {
        throw new McpError(ErrorCode.InvalidRequest, `Cannot read directory as file: ${filePath}`);
    }
    const content = await fs.readFile(filePath, encoding);
    return {
        ...stats,
        content
    };
}
/**
 * Ensure parent directory exists
 */
async function ensureParentDir(filePath) {
    const parentDir = path.dirname(filePath);
    await fs.mkdir(parentDir, { recursive: true });
}
/**
 * Handler that lists available tools for file system operations
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            // ... (previous tools remain unchanged)
            {
                name: "search_in_files",
                description: "Search for text/regex pattern in files",
                inputSchema: {
                    type: "object",
                    properties: {
                        path: {
                            type: "string",
                            description: "Directory path to search in"
                        },
                        pattern: {
                            type: "string",
                            description: "Regular expression pattern to search for"
                        },
                        recursive: {
                            type: "boolean",
                            description: "Whether to search recursively",
                            default: true
                        }
                    },
                    required: ["path", "pattern"]
                }
            },
            {
                name: "calculate_hash",
                description: "Calculate file hash (MD5, SHA256, etc.)",
                inputSchema: {
                    type: "object",
                    properties: {
                        path: {
                            type: "string",
                            description: "Path of file to hash"
                        },
                        algorithm: {
                            type: "string",
                            description: "Hash algorithm (md5, sha1, sha256, sha512)",
                            default: "sha256"
                        }
                    },
                    required: ["path"]
                }
            },
            {
                name: "analyze_text",
                description: "Analyze text file (lines, words, encoding)",
                inputSchema: {
                    type: "object",
                    properties: {
                        path: {
                            type: "string",
                            description: "Path of text file to analyze"
                        }
                    },
                    required: ["path"]
                }
            },
            {
                name: "find_duplicates",
                description: "Find duplicate files in directory",
                inputSchema: {
                    type: "object",
                    properties: {
                        path: {
                            type: "string",
                            description: "Directory path to search for duplicates"
                        }
                    },
                    required: ["path"]
                }
            },
            {
                name: "create_zip",
                description: "Create zip archive from files",
                inputSchema: {
                    type: "object",
                    properties: {
                        files: {
                            type: "array",
                            items: {
                                type: "string"
                            },
                            description: "Array of file paths to include"
                        },
                        output: {
                            type: "string",
                            description: "Output zip file path"
                        }
                    },
                    required: ["files", "output"]
                }
            },
            {
                name: "extract_zip",
                description: "Extract zip archive",
                inputSchema: {
                    type: "object",
                    properties: {
                        path: {
                            type: "string",
                            description: "Path to zip file"
                        },
                        output: {
                            type: "string",
                            description: "Output directory path"
                        }
                    },
                    required: ["path", "output"]
                }
            }
        ]
    };
});
/**
 * Handler for file system operation tools
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
        switch (request.params.name) {
            // ... (previous cases remain unchanged)
            case "search_in_files": {
                const dirPath = String(request.params.arguments?.path);
                const pattern = new RegExp(String(request.params.arguments?.pattern));
                const recursive = request.params.arguments?.recursive !== false;
                const files = recursive
                    ? await getAllFiles(dirPath)
                    : (await fs.readdir(dirPath)).map(file => path.join(dirPath, file));
                const results = await Promise.all(files.map(async (file) => {
                    try {
                        const stats = await fs.stat(file);
                        if (!stats.isDirectory()) {
                            return searchInFile(file, pattern);
                        }
                        return [];
                    }
                    catch {
                        return [];
                    }
                }));
                return {
                    content: [{
                            type: "text",
                            text: JSON.stringify(results.flat(), null, 2)
                        }]
                };
            }
            case "calculate_hash": {
                const filePath = String(request.params.arguments?.path);
                const algorithm = String(request.params.arguments?.algorithm || 'sha256');
                const hash = await calculateHash(filePath, algorithm);
                const stats = await getFileStats(filePath);
                return {
                    content: [{
                            type: "text",
                            text: JSON.stringify({ ...stats, hash }, null, 2)
                        }]
                };
            }
            case "analyze_text": {
                const filePath = String(request.params.arguments?.path);
                const analysis = await analyzeTextFile(filePath);
                const stats = await getFileStats(filePath);
                return {
                    content: [{
                            type: "text",
                            text: JSON.stringify({ ...stats, analysis }, null, 2)
                        }]
                };
            }
            case "find_duplicates": {
                const dirPath = String(request.params.arguments?.path);
                const duplicates = await findDuplicates(dirPath);
                return {
                    content: [{
                            type: "text",
                            text: JSON.stringify(duplicates, null, 2)
                        }]
                };
            }
            case "create_zip": {
                const files = request.params.arguments?.files;
                const output = String(request.params.arguments?.output);
                if (!Array.isArray(files)) {
                    throw new McpError(ErrorCode.InvalidRequest, "files must be an array of file paths");
                }
                await createZip(files, output);
                const stats = await getFileStats(output);
                return {
                    content: [{
                            type: "text",
                            text: `Created zip archive: ${JSON.stringify(stats, null, 2)}`
                        }]
                };
            }
            case "extract_zip": {
                const zipPath = String(request.params.arguments?.path);
                const outputPath = String(request.params.arguments?.output);
                await extractZip(zipPath, outputPath);
                const stats = await getFileStats(outputPath);
                return {
                    content: [{
                            type: "text",
                            text: `Extracted to: ${JSON.stringify(stats, null, 2)}`
                        }]
                };
            }
            default:
                throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
        }
    }
    catch (error) {
        if (error instanceof McpError) {
            throw error;
        }
        throw new McpError(ErrorCode.InternalError, `File system error: ${error.message}`);
    }
});
/**
 * Start the server using stdio transport
 */
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('File system MCP server running on stdio');
}
main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});
