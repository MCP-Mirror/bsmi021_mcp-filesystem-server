import path from 'path';
import { promises as fs } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import type { FileStats } from './types.js';

const execAsync = promisify(exec);

/**
 * Normalize and resolve a file path
 * Handles both relative and absolute paths, including Windows drive letters
 */
export function normalizePath(filePath: string): string {
    // Use path.resolve to handle relative paths
    const resolvedPath = path.resolve(filePath);

    // Return the path using the system's default separator
    return resolvedPath;
}

/**
 * Check if a path exists
 */
export async function pathExists(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath);
        return true;
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return false;
        }
        throw error;
    }
}

/**
 * Ensure parent directory exists
 */
export async function ensureParentDir(filePath: string): Promise<void> {
    const parentDir = path.dirname(filePath);
    await fs.mkdir(parentDir, { recursive: true });
}

/**
 * Get all files in directory recursively
 */
export async function getAllFiles(dirPath: string, pattern?: string): Promise<string[]> {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const files = await Promise.all(
        entries.map(async (entry): Promise<string[]> => {
            const fullPath = path.join(dirPath, entry.name);
            if (entry.isDirectory()) {
                return getAllFiles(fullPath, pattern);
            }
            if (pattern && !entry.name.match(new RegExp(pattern))) {
                return [];
            }
            return [fullPath];
        })
    );
    return files.flat();
}

/**
 * Get file stats with additional metadata
 */
export async function getFileStats(filePath: string): Promise<FileStats> {
    const stats = await fs.stat(filePath);
    return {
        name: path.basename(filePath),
        path: filePath,
        size: stats.size,
        isDirectory: stats.isDirectory(),
        created: stats.birthtime,
        modified: stats.mtime,
        accessed: stats.atime,
        mode: stats.mode.toString(8).slice(-3), // Convert to octal permission string
    };
}

/**
 * List available drives on Windows systems
 */
export async function listWindowsDrives(): Promise<string[]> {
    if (process.platform !== 'win32') {
        return [];
    }

    try {
        const { stdout } = await execAsync('wmic logicaldisk get name');
        return stdout
            .split('\n')
            .slice(1) // Skip header
            .map(line => line.trim())
            .filter(line => /^[A-Z]:$/.test(line));
    } catch (error) {
        console.error('Error listing drives:', error);
        return [];
    }
}
