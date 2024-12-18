import { ToolCategory, ToolResponse } from './types.js';
import { normalizePath, getFileStats, listWindowsDrives } from '../utils.js';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * System tools for drive and directory operations
 */
export const systemTools: ToolCategory = {
    list_drives: {
        definition: {
            name: "list_drives",
            description: "List available drives on Windows systems",
            inputSchema: {
                type: "object",
                properties: {},
                required: []
            }
        },
        handler: async (): Promise<ToolResponse> => {
            const drives = await listWindowsDrives();
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(drives, null, 2)
                }]
            };
        }
    },

    list_directory: {
        definition: {
            name: "list_directory",
            description: "List contents of a directory",
            inputSchema: {
                type: "object",
                properties: {
                    path: { type: "string", description: "Directory path to list" },
                    recursive: { type: "boolean", description: "List subdirectories recursively", default: false },
                    showHidden: { type: "boolean", description: "Show hidden files and directories", default: false }
                },
                required: ["path"]
            }
        },
        handler: async (args: { path: string; recursive?: boolean; showHidden?: boolean }): Promise<ToolResponse> => {
            const dirPath = normalizePath(args.path);
            const recursive = Boolean(args.recursive);
            const showHidden = Boolean(args.showHidden);

            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            const contents = await Promise.all(
                entries
                    .filter(entry => showHidden || !entry.name.startsWith('.'))
                    .map(async (entry) => {
                        const fullPath = path.join(dirPath, entry.name);
                        const stats = await getFileStats(fullPath);

                        if (recursive && entry.isDirectory()) {
                            try {
                                const subContents = await systemTools.list_directory.handler({
                                    path: fullPath,
                                    recursive: true,
                                    showHidden
                                });
                                return {
                                    ...stats,
                                    contents: JSON.parse(subContents.content[0].text)
                                };
                            } catch (error) {
                                return stats;
                            }
                        }

                        return stats;
                    })
            );

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(contents, null, 2)
                }]
            };
        }
    }
};
