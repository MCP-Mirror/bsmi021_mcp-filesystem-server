import { ToolCategory, ToolResponse } from './types.js';
import { normalizePath, getFileStats } from '../utils.js';
import * as streams from '../operations/streams.js';

/**
 * Stream tools for efficient file operations
 */
export const streamTools: ToolCategory = {
    stream_copy: {
        definition: {
            name: "stream_copy",
            description: "Copy file using streams",
            inputSchema: {
                type: "object",
                properties: {
                    source: { type: "string", description: "Source file path" },
                    destination: { type: "string", description: "Destination file path" }
                },
                required: ["source", "destination"]
            }
        },
        handler: async (args: { source: string; destination: string }): Promise<ToolResponse> => {
            const sourcePath = normalizePath(args.source);
            const destPath = normalizePath(args.destination);

            await streams.streamCopy(sourcePath, destPath);
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
