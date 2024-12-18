import { ToolCategory, ToolResponse } from './types.js';
import { normalizePath, getFileStats } from '../utils.js';
import * as basic from '../operations/basic.js';
import { promises as fs } from 'fs';

/**
 * File operation tools for basic file manipulation
 */
export const fileTools: ToolCategory = {
    copy_file: {
        definition: {
            name: "copy_file",
            description: "Copy a file to a new location",
            inputSchema: {
                type: "object",
                properties: {
                    source: { type: "string", description: "Source file path" },
                    destination: { type: "string", description: "Destination file path" },
                    overwrite: { type: "boolean", description: "Whether to overwrite existing file", default: false }
                },
                required: ["source", "destination"]
            }
        },
        handler: async (args: { source: string; destination: string; overwrite?: boolean }): Promise<ToolResponse> => {
            const sourcePath = normalizePath(args.source);
            const destPath = normalizePath(args.destination);
            const overwrite = Boolean(args.overwrite);

            await basic.copyFile(sourcePath, destPath, overwrite);
            const stats = await getFileStats(destPath);

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(stats, null, 2)
                }]
            };
        }
    },

    read_file: {
        definition: {
            name: "read_file",
            description: "Read content from a file",
            inputSchema: {
                type: "object",
                properties: {
                    path: { type: "string", description: "Path of file to read" },
                    encoding: { type: "string", description: "File encoding", default: "utf8" }
                },
                required: ["path"]
            }
        },
        handler: async (args: { path: string; encoding?: BufferEncoding }): Promise<ToolResponse> => {
            const filePath = normalizePath(args.path);
            const encoding = args.encoding || 'utf8';

            const content = await fs.readFile(filePath, { encoding });
            const stats = await getFileStats(filePath);

            return {
                content: [{
                    type: "text",
                    text: content
                }]
            };
        }
    },

    move_file: {
        definition: {
            name: "move_file",
            description: "Move/rename a file",
            inputSchema: {
                type: "object",
                properties: {
                    source: { type: "string", description: "Source file path" },
                    destination: { type: "string", description: "Destination file path" },
                    overwrite: { type: "boolean", description: "Whether to overwrite existing file", default: false }
                },
                required: ["source", "destination"]
            }
        },
        handler: async (args: { source: string; destination: string; overwrite?: boolean }): Promise<ToolResponse> => {
            const sourcePath = normalizePath(args.source);
            const destPath = normalizePath(args.destination);
            const overwrite = Boolean(args.overwrite);

            await basic.moveFile(sourcePath, destPath, overwrite);
            const stats = await getFileStats(destPath);

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(stats, null, 2)
                }]
            };
        }
    },

    delete_file: {
        definition: {
            name: "delete_file",
            description: "Delete a file",
            inputSchema: {
                type: "object",
                properties: {
                    path: { type: "string", description: "Path of file to delete" }
                },
                required: ["path"]
            }
        },
        handler: async (args: { path: string }): Promise<ToolResponse> => {
            const filePath = normalizePath(args.path);
            const stats = await getFileStats(filePath);
            await basic.deleteFile(filePath);

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(stats, null, 2)
                }]
            };
        }
    },

    write_file: {
        definition: {
            name: "write_file",
            description: "Write content to a file",
            inputSchema: {
                type: "object",
                properties: {
                    path: { type: "string", description: "File path to write to" },
                    content: { type: "string", description: "Content to write" },
                    encoding: { type: "string", description: "File encoding", default: "utf8" }
                },
                required: ["path", "content"]
            }
        },
        handler: async (args: { path: string; content: string; encoding?: BufferEncoding }): Promise<ToolResponse> => {
            const filePath = normalizePath(args.path);
            const content = String(args.content);
            const encoding = args.encoding || 'utf8';

            await basic.writeFile(filePath, content, encoding);
            const stats = await getFileStats(filePath);

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(stats, null, 2)
                }]
            };
        }
    },

    append_file: {
        definition: {
            name: "append_file",
            description: "Append content to a file",
            inputSchema: {
                type: "object",
                properties: {
                    path: { type: "string", description: "File path to append to" },
                    content: { type: "string", description: "Content to append" },
                    encoding: { type: "string", description: "File encoding", default: "utf8" }
                },
                required: ["path", "content"]
            }
        },
        handler: async (args: { path: string; content: string; encoding?: BufferEncoding }): Promise<ToolResponse> => {
            const filePath = normalizePath(args.path);
            const content = String(args.content);
            const encoding = args.encoding || 'utf8';

            await basic.appendFile(filePath, content, encoding);
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
