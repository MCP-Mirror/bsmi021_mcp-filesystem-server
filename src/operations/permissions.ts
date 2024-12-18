import { promises as fs } from 'fs';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

/**
 * Interface for file permissions
 */
export interface FilePermissions {
    owner: {
        read: boolean;
        write: boolean;
        execute: boolean;
    };
    group: {
        read: boolean;
        write: boolean;
        execute: boolean;
    };
    others: {
        read: boolean;
        write: boolean;
        execute: boolean;
    };
}

/**
 * Convert mode number to permissions object
 */
export function modeToPermissions(mode: number): FilePermissions {
    return {
        owner: {
            read: Boolean(mode & 0o400),
            write: Boolean(mode & 0o200),
            execute: Boolean(mode & 0o100)
        },
        group: {
            read: Boolean(mode & 0o40),
            write: Boolean(mode & 0o20),
            execute: Boolean(mode & 0o10)
        },
        others: {
            read: Boolean(mode & 0o4),
            write: Boolean(mode & 0o2),
            execute: Boolean(mode & 0o1)
        }
    };
}

/**
 * Convert permissions object to mode number
 */
export function permissionsToMode(permissions: FilePermissions): number {
    let mode = 0;

    // Owner permissions
    if (permissions.owner.read) mode |= 0o400;
    if (permissions.owner.write) mode |= 0o200;
    if (permissions.owner.execute) mode |= 0o100;

    // Group permissions
    if (permissions.group.read) mode |= 0o40;
    if (permissions.group.write) mode |= 0o20;
    if (permissions.group.execute) mode |= 0o10;

    // Others permissions
    if (permissions.others.read) mode |= 0o4;
    if (permissions.others.write) mode |= 0o2;
    if (permissions.others.execute) mode |= 0o1;

    return mode;
}

/**
 * Get file permissions
 */
export async function getPermissions(filePath: string): Promise<FilePermissions> {
    try {
        const stats = await fs.stat(filePath);
        return modeToPermissions(stats.mode);
    } catch (error: any) {
        throw new McpError(
            ErrorCode.InternalError,
            `Failed to get permissions: ${error.message}`
        );
    }
}

/**
 * Set file permissions
 */
export async function setPermissions(filePath: string, permissions: FilePermissions): Promise<void> {
    try {
        const mode = permissionsToMode(permissions);
        await fs.chmod(filePath, mode);
    } catch (error: any) {
        throw new McpError(
            ErrorCode.InternalError,
            `Failed to set permissions: ${error.message}`
        );
    }
}

/**
 * Check if current process has read access
 */
export async function checkReadAccess(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath, fs.constants.R_OK);
        return true;
    } catch {
        return false;
    }
}

/**
 * Check if current process has write access
 */
export async function checkWriteAccess(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath, fs.constants.W_OK);
        return true;
    } catch {
        return false;
    }
}

/**
 * Check if current process has execute access
 */
export async function checkExecuteAccess(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath, fs.constants.X_OK);
        return true;
    } catch {
        return false;
    }
}

/**
 * Make file executable
 */
export async function makeExecutable(filePath: string): Promise<void> {
    try {
        const stats = await fs.stat(filePath);
        const newMode = stats.mode | 0o111; // Add execute permission for all
        await fs.chmod(filePath, newMode);
    } catch (error: any) {
        throw new McpError(
            ErrorCode.InternalError,
            `Failed to make file executable: ${error.message}`
        );
    }
}
