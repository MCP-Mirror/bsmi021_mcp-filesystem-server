import { ToolCategory, ToolResponse } from './types.js';
import { normalizePath } from '../utils.js';
import * as monitoring from '../operations/monitoring.js';

// Create a singleton instance of FileWatcher
const fileWatcher = new monitoring.FileWatcher();

/**
 * Monitoring tools for file system watching operations
 */
export const monitoringTools: ToolCategory = {
    watch_directory: {
        definition: {
            name: "watch_directory",
            description: "Start watching a directory for changes",
            inputSchema: {
                type: "object",
                properties: {
                    path: { type: "string", description: "Directory path to watch" },
                    recursive: { type: "boolean", description: "Watch subdirectories recursively", default: false }
                },
                required: ["path"]
            }
        },
        handler: async (args: { path: string; recursive?: boolean }): Promise<ToolResponse> => {
            const dirPath = normalizePath(args.path);
            const recursive = Boolean(args.recursive);

            await fileWatcher.watchDirectory(dirPath, recursive);

            return {
                content: [{
                    type: "text",
                    text: `Started watching directory: ${dirPath}`
                }]
            };
        }
    },

    unwatch_directory: {
        definition: {
            name: "unwatch_directory",
            description: "Stop watching a directory",
            inputSchema: {
                type: "object",
                properties: {
                    path: { type: "string", description: "Directory path to stop watching" }
                },
                required: ["path"]
            }
        },
        handler: async (args: { path: string }): Promise<ToolResponse> => {
            const dirPath = normalizePath(args.path);

            await fileWatcher.unwatchDirectory(dirPath);

            return {
                content: [{
                    type: "text",
                    text: `Stopped watching directory: ${dirPath}`
                }]
            };
        }
    }
};

/**
 * Clean up function to close all file watchers
 */
export async function closeAllWatchers(): Promise<void> {
    await fileWatcher.closeAll();
}
