import { promises as fs } from 'fs';
import * as path from 'path';
import { fileTypeFromFile } from 'file-type';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { getFileStats } from '../utils.js';

/**
 * Extended metadata interface
 */
export interface ExtendedMetadata {
    name: string;
    path: string;
    extension: string;
    mimeType: string | null;
    size: number;
    created: Date;
    modified: Date;
    accessed: Date;
    isSymlink: boolean;
    isHidden: boolean;
    parentDir: string;
    absolutePath: string;
    relativePath: string;
}

/**
 * File comparison result
 */
export interface FileComparisonResult {
    areIdentical: boolean;
    differences: {
        size?: boolean;
        content?: boolean;
        permissions?: boolean;
        modificationTime?: boolean;
    };
}

/**
 * Get extended file metadata
 */
export async function getExtendedMetadata(filePath: string): Promise<ExtendedMetadata> {
    try {
        const stats = await getFileStats(filePath);
        const lstat = await fs.lstat(filePath);
        const absolutePath = path.resolve(filePath);
        const fileType = await fileTypeFromFile(filePath);

        return {
            name: path.basename(filePath),
            path: filePath,
            extension: path.extname(filePath),
            mimeType: fileType?.mime || null,
            size: stats.size,
            created: stats.created,
            modified: stats.modified,
            accessed: stats.accessed,
            isSymlink: lstat.isSymbolicLink(),
            isHidden: path.basename(filePath).startsWith('.'),
            parentDir: path.dirname(filePath),
            absolutePath: absolutePath,
            relativePath: path.relative(process.cwd(), absolutePath)
        };
    } catch (error: any) {
        throw new McpError(
            ErrorCode.InternalError,
            `Failed to get extended metadata: ${error.message}`
        );
    }
}

/**
 * Compare two files
 */
export async function compareFiles(file1Path: string, file2Path: string): Promise<FileComparisonResult> {
    try {
        const stats1 = await fs.stat(file1Path);
        const stats2 = await fs.stat(file2Path);

        const differences: FileComparisonResult['differences'] = {};

        // Compare sizes
        if (stats1.size !== stats2.size) {
            differences.size = true;
        }

        // Compare modification times
        if (stats1.mtime.getTime() !== stats2.mtime.getTime()) {
            differences.modificationTime = true;
        }

        // Compare permissions
        if (stats1.mode !== stats2.mode) {
            differences.permissions = true;
        }

        // Compare content only if sizes are equal
        if (!differences.size) {
            const content1 = await fs.readFile(file1Path);
            const content2 = await fs.readFile(file2Path);
            if (!content1.equals(content2)) {
                differences.content = true;
            }
        } else {
            differences.content = true;
        }

        return {
            areIdentical: Object.keys(differences).length === 0,
            differences
        };
    } catch (error: any) {
        throw new McpError(
            ErrorCode.InternalError,
            `Failed to compare files: ${error.message}`
        );
    }
}

/**
 * Create a symbolic link
 */
export async function createSymlink(targetPath: string, linkPath: string): Promise<void> {
    try {
        await fs.symlink(targetPath, linkPath);
    } catch (error: any) {
        throw new McpError(
            ErrorCode.InternalError,
            `Failed to create symlink: ${error.message}`
        );
    }
}

/**
 * Read a symbolic link
 */
export async function readSymlink(linkPath: string): Promise<string> {
    try {
        return await fs.readlink(linkPath);
    } catch (error: any) {
        throw new McpError(
            ErrorCode.InternalError,
            `Failed to read symlink: ${error.message}`
        );
    }
}

/**
 * Touch a file (update access and modification times)
 */
export async function touchFile(filePath: string): Promise<void> {
    try {
        const time = new Date();
        await fs.utimes(filePath, time, time);
    } catch (error: any) {
        // If file doesn't exist, create it
        if (error.code === 'ENOENT') {
            await fs.writeFile(filePath, '');
        } else {
            throw new McpError(
                ErrorCode.InternalError,
                `Failed to touch file: ${error.message}`
            );
        }
    }
}

/**
 * Set file timestamps
 */
export async function setFileTimestamps(
    filePath: string,
    accessTime?: Date,
    modifyTime?: Date
): Promise<void> {
    try {
        const atime = accessTime || new Date();
        const mtime = modifyTime || new Date();
        await fs.utimes(filePath, atime, mtime);
    } catch (error: any) {
        throw new McpError(
            ErrorCode.InternalError,
            `Failed to set file timestamps: ${error.message}`
        );
    }
}
