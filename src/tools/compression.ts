import { ToolCategory, ToolResponse } from './types.js';
import { normalizePath, getFileStats } from '../utils.js';
import * as compression from '../operations/compression.js';
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";

/**
 * Compression tools for zip file operations
 */
export const compressionTools: ToolCategory = {
    create_zip: {
        definition: {
            name: "create_zip",
            description: "Create zip archive from files",
            inputSchema: {
                type: "object",
                properties: {
                    files: { type: "array", items: { type: "string" }, description: "Array of file paths to include" },
                    output: { type: "string", description: "Output zip file path" }
                },
                required: ["files", "output"]
            }
        },
        handler: async (args: { files: string[]; output: string }): Promise<ToolResponse> => {
            if (!Array.isArray(args.files)) {
                throw new McpError(
                    ErrorCode.InvalidRequest,
                    "files must be an array of file paths"
                );
            }

            const normalizedFiles = args.files.map(file => normalizePath(file));
            const outputPath = normalizePath(args.output);

            await compression.createZip(normalizedFiles, outputPath);
            const stats = await getFileStats(outputPath);

            return {
                content: [{
                    type: "text",
                    text: `Created zip archive: ${JSON.stringify(stats, null, 2)}`
                }]
            };
        }
    },

    extract_zip: {
        definition: {
            name: "extract_zip",
            description: "Extract zip archive",
            inputSchema: {
                type: "object",
                properties: {
                    path: { type: "string", description: "Path to zip file" },
                    output: { type: "string", description: "Output directory path" }
                },
                required: ["path", "output"]
            }
        },
        handler: async (args: { path: string; output: string }): Promise<ToolResponse> => {
            const zipPath = normalizePath(args.path);
            const outputPath = normalizePath(args.output);

            await compression.extractZip(zipPath, outputPath);
            const stats = await getFileStats(outputPath);

            return {
                content: [{
                    type: "text",
                    text: `Extracted to: ${JSON.stringify(stats, null, 2)}`
                }]
            };
        }
    }
};
