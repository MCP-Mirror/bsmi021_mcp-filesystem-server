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
    },

    write_chunks: {
        definition: {
            name: "write_chunks",
            description: "Write data chunks to a file with streaming support",
            inputSchema: {
                type: "object",
                properties: {
                    path: {
                        type: "string",
                        description: "Destination file path"
                    },
                    chunks: {
                        type: "array",
                        items: {
                            type: "string"
                        },
                        description: "Array of data chunks to write"
                    },
                    encoding: {
                        type: "string",
                        description: "Optional encoding for the chunks (default: utf8)",
                        enum: ["utf8", "base64", "hex", "ascii", "binary"],
                        default: "utf8"
                    }
                },
                required: ["path", "chunks"]
            }
        },
        handler: async (args: {
            path: string;
            chunks: string[];
            encoding?: BufferEncoding;
        }): Promise<ToolResponse> => {
            const filePath = normalizePath(args.path);
            const encoding = args.encoding || 'utf8';

            // Create async generator from chunks array
            async function* generateChunks() {
                for (const chunk of args.chunks) {
                    yield Buffer.from(chunk, encoding);
                }
            }

            await streams.writeFileChunks(filePath, generateChunks());
            const stats = await getFileStats(filePath);

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        message: "File written successfully",
                        stats: stats
                    }, null, 2)
                }]
            };
        }
    },

    transform_file: {
        definition: {
            name: "transform_file",
            description: "Transform file contents line by line with streaming",
            inputSchema: {
                type: "object",
                properties: {
                    source: {
                        type: "string",
                        description: "Source file path"
                    },
                    destination: {
                        type: "string",
                        description: "Destination file path"
                    },
                    transform: {
                        type: "string",
                        description: "JavaScript transform function as string, receives line as parameter",
                        examples: ["line => line.toUpperCase()", "line => line.trim()"]
                    }
                },
                required: ["source", "destination", "transform"]
            }
        },
        handler: async (args: {
            source: string;
            destination: string;
            transform: string;
        }): Promise<ToolResponse> => {
            const sourcePath = normalizePath(args.source);
            const destPath = normalizePath(args.destination);

            // Create transform function from string
            const transformFn = new Function('line', `return (${args.transform})(line)`) as (line: string) => string;

            // Create write stream
            const writeStream = await streams.createFileWriteStream(destPath);

            // Process and write lines
            for await (const line of streams.transformLines(sourcePath, transformFn)) {
                if (!writeStream.write(line + '\n')) {
                    // Handle backpressure
                    await new Promise(resolve => writeStream.once('drain', resolve));
                }
            }

            // Close the write stream
            await new Promise<void>((resolve, reject) => {
                writeStream.end((error: Error | null) => {
                    if (error) reject(error);
                    else resolve();
                });
            });

            const stats = await getFileStats(destPath);

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        message: "File transformed successfully",
                        stats: stats
                    }, null, 2)
                }]
            };
        }
    }
};
