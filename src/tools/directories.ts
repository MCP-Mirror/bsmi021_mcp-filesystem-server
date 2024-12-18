import { ToolCategory, ToolResponse } from './types.js';
import { normalizePath, getFileStats } from '../utils.js';
import * as directory from '../operations/directory.js';

/**
 * Directory operation tools for directory manipulation
 */
export const directoryTools: ToolCategory = {
    make_directory: {
        definition: {
            name: "make_directory",
            description: "Create a directory",
            inputSchema: {
                type: "object",
                properties: {
                    path: { type: "string", description: "Directory path to create" },
                    recursive: { type: "boolean", description: "Create parent directories if needed", default: true }
                },
                required: ["path"]
            }
        },
        handler: async (args: { path: string; recursive?: boolean }): Promise<ToolResponse> => {
            const dirPath = normalizePath(args.path);
            const recursive = args.recursive !== false;

            await directory.makeDirectory(dirPath, recursive);
            const stats = await getFileStats(dirPath);

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(stats, null, 2)
                }]
            };
        }
    },

    remove_directory: {
        definition: {
            name: "remove_directory",
            description: "Remove a directory",
            inputSchema: {
                type: "object",
                properties: {
                    path: { type: "string", description: "Directory path to remove" },
                    recursive: { type: "boolean", description: "Remove directory contents recursively", default: false }
                },
                required: ["path"]
            }
        },
        handler: async (args: { path: string; recursive?: boolean }): Promise<ToolResponse> => {
            const dirPath = normalizePath(args.path);
            const recursive = Boolean(args.recursive);
            const stats = await getFileStats(dirPath);

            await directory.removeDirectory(dirPath, recursive);

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(stats, null, 2)
                }]
            };
        }
    },

    copy_directory: {
        definition: {
            name: "copy_directory",
            description: "Copy a directory recursively",
            inputSchema: {
                type: "object",
                properties: {
                    source: { type: "string", description: "Source directory path" },
                    destination: { type: "string", description: "Destination directory path" },
                    overwrite: { type: "boolean", description: "Whether to overwrite existing directory", default: false }
                },
                required: ["source", "destination"]
            }
        },
        handler: async (args: { source: string; destination: string; overwrite?: boolean }): Promise<ToolResponse> => {
            const sourcePath = normalizePath(args.source);
            const destPath = normalizePath(args.destination);
            const overwrite = Boolean(args.overwrite);

            await directory.copyDirectory(sourcePath, destPath, overwrite);
            const stats = await getFileStats(destPath);

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(stats, null, 2)
                }]
            };
        }
    }
};
