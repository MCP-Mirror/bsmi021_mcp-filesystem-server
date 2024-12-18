import { ToolCategory, ToolResponse } from './types.js';
import { normalizePath, getFileStats } from '../utils.js';
import * as metadata from '../operations/metadata.js';

/**
 * Metadata tools for file metadata operations
 */
export const metadataTools: ToolCategory = {
    get_metadata: {
        definition: {
            name: "get_metadata",
            description: "Get extended file metadata",
            inputSchema: {
                type: "object",
                properties: {
                    path: { type: "string", description: "Path to file" }
                },
                required: ["path"]
            }
        },
        handler: async (args: { path: string }): Promise<ToolResponse> => {
            const filePath = normalizePath(args.path);
            const meta = await metadata.getExtendedMetadata(filePath);

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(meta, null, 2)
                }]
            };
        }
    },

    compare_files: {
        definition: {
            name: "compare_files",
            description: "Compare two files",
            inputSchema: {
                type: "object",
                properties: {
                    file1: { type: "string", description: "Path to first file" },
                    file2: { type: "string", description: "Path to second file" }
                },
                required: ["file1", "file2"]
            }
        },
        handler: async (args: { file1: string; file2: string }): Promise<ToolResponse> => {
            const file1Path = normalizePath(args.file1);
            const file2Path = normalizePath(args.file2);

            const comparison = await metadata.compareFiles(file1Path, file2Path);

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(comparison, null, 2)
                }]
            };
        }
    },

    create_symlink: {
        definition: {
            name: "create_symlink",
            description: "Create a symbolic link",
            inputSchema: {
                type: "object",
                properties: {
                    target: { type: "string", description: "Target path" },
                    link: { type: "string", description: "Link path" }
                },
                required: ["target", "link"]
            }
        },
        handler: async (args: { target: string; link: string }): Promise<ToolResponse> => {
            const targetPath = normalizePath(args.target);
            const linkPath = normalizePath(args.link);

            await metadata.createSymlink(targetPath, linkPath);
            const stats = await getFileStats(linkPath);

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(stats, null, 2)
                }]
            };
        }
    },

    touch_file: {
        definition: {
            name: "touch_file",
            description: "Update file timestamps or create empty file",
            inputSchema: {
                type: "object",
                properties: {
                    path: { type: "string", description: "Path to file" }
                },
                required: ["path"]
            }
        },
        handler: async (args: { path: string }): Promise<ToolResponse> => {
            const filePath = normalizePath(args.path);

            await metadata.touchFile(filePath);
            const stats = await getFileStats(filePath);

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(stats, null, 2)
                }]
            };
        }
    }
};
