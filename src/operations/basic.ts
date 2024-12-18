import { promises as fs } from 'fs';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { FileContent } from '../types.js';
import { ensureParentDir, getFileStats, normalizePath } from '../utils.js';

/**
 * Read file with metadata
 */
export async function readFileWithMetadata(filePath: string, encoding: BufferEncoding = 'utf8'): Promise<FileContent> {
    const stats = await getFileStats(filePath);
    if (stats.isDirectory) {
        throw new McpError(
            ErrorCode.InvalidRequest,
            `Cannot read directory as file: ${filePath}`
        );
    }
    const content = await fs.readFile(filePath, encoding);
    return {
        ...stats,
        content
    };
}

/**
 * Write content to a file
 */
export async function writeFile(filePath: string, content: string, encoding: BufferEncoding = 'utf8'): Promise<void> {
    await ensureParentDir(filePath);
    await fs.writeFile(filePath, content, { encoding });
}

/**
 * Append content to a file
 */
export async function appendFile(filePath: string, content: string, encoding: BufferEncoding = 'utf8'): Promise<void> {
    await ensureParentDir(filePath);
    await fs.appendFile(filePath, content, { encoding });
}

/**
 * Delete a file
 */
export async function deleteFile(filePath: string): Promise<void> {
    const stats = await fs.stat(filePath);
    if (stats.isDirectory()) {
        throw new McpError(
            ErrorCode.InvalidRequest,
            `Cannot delete directory as file: ${filePath}`
        );
    }
    await fs.unlink(filePath);
}

/**
 * Copy a file from source to destination
 */
export async function copyFile(sourcePath: string, destPath: string, overwrite: boolean = false): Promise<void> {
    if (!overwrite && await fs.access(destPath).then(() => true).catch(() => false)) {
        throw new McpError(
            ErrorCode.InvalidRequest,
            `Destination file already exists: ${destPath}`
        );
    }
    await ensureParentDir(destPath);
    await fs.copyFile(sourcePath, destPath);
}

/**
 * Move/rename a file
 */
export async function moveFile(sourcePath: string, destPath: string, overwrite: boolean = false): Promise<void> {
    if (!overwrite && await fs.access(destPath).then(() => true).catch(() => false)) {
        throw new McpError(
            ErrorCode.InvalidRequest,
            `Destination file already exists: ${destPath}`
        );
    }
    await ensureParentDir(destPath);
    await fs.rename(sourcePath, destPath);
}
