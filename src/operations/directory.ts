import { promises as fs } from 'fs';
import path from 'path';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { DirectoryEntry } from '../types.js';
import { getFileStats } from '../utils.js';
import { copyFile } from './basic.js';

/**
 * List directory contents recursively
 */
export async function listDirectoryContents(dirPath: string, recursive: boolean): Promise<DirectoryEntry[]> {
    const files = await fs.readdir(dirPath);
    const results = await Promise.all(
        files.map(async (file): Promise<DirectoryEntry> => {
            const fullPath = path.join(dirPath, file);
            const stats = await getFileStats(fullPath);

            if (recursive && stats.isDirectory) {
                const subResults = await listDirectoryContents(fullPath, true);
                return {
                    ...stats,
                    contents: subResults
                };
            }

            return stats;
        })
    );
    return results;
}

/**
 * Create a directory
 */
export async function makeDirectory(dirPath: string, recursive: boolean = true): Promise<void> {
    await fs.mkdir(dirPath, { recursive });
}

/**
 * Remove a directory
 */
export async function removeDirectory(dirPath: string, recursive: boolean = false): Promise<void> {
    if (recursive) {
        await fs.rm(dirPath, { recursive: true, force: true });
    } else {
        await fs.rmdir(dirPath);
    }
}

/**
 * Copy a directory recursively
 */
export async function copyDirectory(sourcePath: string, destPath: string, overwrite: boolean = false): Promise<void> {
    const stats = await fs.stat(sourcePath);
    if (!stats.isDirectory()) {
        throw new McpError(
            ErrorCode.InvalidRequest,
            `Source is not a directory: ${sourcePath}`
        );
    }

    if (!overwrite && await fs.access(destPath).then(() => true).catch(() => false)) {
        throw new McpError(
            ErrorCode.InvalidRequest,
            `Destination directory already exists: ${destPath}`
        );
    }

    await makeDirectory(destPath);
    const entries = await fs.readdir(sourcePath, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(sourcePath, entry.name);
        const dstPath = path.join(destPath, entry.name);

        if (entry.isDirectory()) {
            await copyDirectory(srcPath, dstPath, overwrite);
        } else {
            await copyFile(srcPath, dstPath, overwrite);
        }
    }
}
