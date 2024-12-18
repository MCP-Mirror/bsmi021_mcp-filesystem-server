import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { Transform } from 'stream';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { ensureParentDir } from '../utils.js';

/**
 * Stream options interface
 */
export interface StreamOptions {
    encoding?: BufferEncoding;
    start?: number;
    end?: number;
    highWaterMark?: number;
}

/**
 * Create a readable stream for a file
 */
export function createFileReadStream(filePath: string, options: StreamOptions = {}) {
    try {
        return createReadStream(filePath, {
            encoding: options.encoding,
            start: options.start,
            end: options.end,
            highWaterMark: options.highWaterMark
        });
    } catch (error: any) {
        throw new McpError(
            ErrorCode.InternalError,
            `Failed to create read stream: ${error.message}`
        );
    }
}

/**
 * Create a writable stream for a file
 */
export async function createFileWriteStream(filePath: string, options: StreamOptions = {}) {
    try {
        await ensureParentDir(filePath);
        return createWriteStream(filePath, {
            encoding: options.encoding,
            start: options.start,
            highWaterMark: options.highWaterMark
        });
    } catch (error: any) {
        throw new McpError(
            ErrorCode.InternalError,
            `Failed to create write stream: ${error.message}`
        );
    }
}

/**
 * Copy a file using streams
 */
export async function streamCopy(sourcePath: string, destPath: string): Promise<void> {
    try {
        await ensureParentDir(destPath);
        const readStream = createReadStream(sourcePath);
        const writeStream = createWriteStream(destPath);

        await pipeline(readStream, writeStream);
    } catch (error: any) {
        throw new McpError(
            ErrorCode.InternalError,
            `Failed to stream copy: ${error.message}`
        );
    }
}

/**
 * Read file in chunks
 */
export async function* readFileChunks(filePath: string, chunkSize: number = 64 * 1024): AsyncGenerator<Buffer> {
    try {
        const stream = createReadStream(filePath, {
            highWaterMark: chunkSize
        });

        for await (const chunk of stream) {
            yield chunk;
        }
    } catch (error: any) {
        throw new McpError(
            ErrorCode.InternalError,
            `Failed to read file chunks: ${error.message}`
        );
    }
}

/**
 * Write chunks to file
 */
export async function writeFileChunks(filePath: string, chunks: AsyncIterable<Buffer | string>): Promise<void> {
    try {
        await ensureParentDir(filePath);
        const writeStream = createWriteStream(filePath);

        for await (const chunk of chunks) {
            if (!writeStream.write(chunk)) {
                // Handle backpressure
                await new Promise(resolve => writeStream.once('drain', resolve));
            }
        }

        await new Promise<void>((resolve, reject) => {
            writeStream.end((error: Error | null) => {
                if (error) reject(error);
                else resolve();
            });
        });
    } catch (error: any) {
        throw new McpError(
            ErrorCode.InternalError,
            `Failed to write file chunks: ${error.message}`
        );
    }
}

/**
 * Transform stream line by line
 */
export async function* transformLines(filePath: string, transform: (line: string) => string): AsyncGenerator<string> {
    try {
        const stream = createReadStream(filePath, { encoding: 'utf8' });
        let remainder = '';

        for await (const chunk of stream) {
            const lines = (remainder + chunk).split('\n');
            remainder = lines.pop() || '';

            for (const line of lines) {
                yield transform(line);
            }
        }

        if (remainder) {
            yield transform(remainder);
        }
    } catch (error: any) {
        throw new McpError(
            ErrorCode.InternalError,
            `Failed to transform lines: ${error.message}`
        );
    }
}

/**
 * Pipe file through transform stream
 */
export async function pipeThrough(
    sourcePath: string,
    destPath: string,
    transformFn: (chunk: any) => any
): Promise<void> {
    try {
        await ensureParentDir(destPath);
        const readStream = createReadStream(sourcePath);
        const writeStream = createWriteStream(destPath);

        const transform = new Transform({
            transform(chunk, encoding, callback) {
                try {
                    const transformed = transformFn(chunk);
                    callback(null, transformed);
                } catch (error) {
                    callback(error as Error);
                }
            }
        });

        await pipeline(
            readStream,
            transform,
            writeStream
        );
    } catch (error: any) {
        throw new McpError(
            ErrorCode.InternalError,
            `Failed to pipe through transform: ${error.message}`
        );
    }
}
