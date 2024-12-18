import { promises as fs } from 'fs';
import path from 'path';
import * as permissions from '../../operations/permissions.js';
import {
    TEST_DIR,
    createTestFile
} from '../setup.js';

describe('Permissions Operations', () => {
    describe('getPermissions', () => {
        it('should get file permissions', async () => {
            const filePath = await createTestFile('test.txt');

            const perms = await permissions.getPermissions(filePath);

            expect(perms).toHaveProperty('owner');
            expect(perms).toHaveProperty('group');
            expect(perms).toHaveProperty('others');
            expect(perms.owner).toHaveProperty('read');
            expect(perms.owner).toHaveProperty('write');
            expect(perms.owner).toHaveProperty('execute');
        });

        it('should handle non-existent file', async () => {
            const filePath = path.join(TEST_DIR, 'nonexistent.txt');

            await expect(permissions.getPermissions(filePath))
                .rejects
                .toThrow();
        });
    });

    describe('setPermissions', () => {
        it('should set file permissions', async () => {
            const filePath = await createTestFile('test.txt');

            const newPerms: permissions.FilePermissions = {
                owner: { read: true, write: true, execute: true },
                group: { read: true, write: false, execute: false },
                others: { read: true, write: false, execute: false }
            };

            await permissions.setPermissions(filePath, newPerms);
            const perms = await permissions.getPermissions(filePath);

            expect(perms).toEqual(newPerms);
        });

        it('should handle non-existent file', async () => {
            const filePath = path.join(TEST_DIR, 'nonexistent.txt');

            const newPerms: permissions.FilePermissions = {
                owner: { read: true, write: true, execute: false },
                group: { read: true, write: false, execute: false },
                others: { read: true, write: false, execute: false }
            };

            await expect(permissions.setPermissions(filePath, newPerms))
                .rejects
                .toThrow();
        });
    });

    describe('checkReadAccess', () => {
        it('should check read access', async () => {
            const filePath = await createTestFile('test.txt');

            const hasAccess = await permissions.checkReadAccess(filePath);
            expect(hasAccess).toBe(true);
        });

        it('should return false for non-existent file', async () => {
            const filePath = path.join(TEST_DIR, 'nonexistent.txt');

            const hasAccess = await permissions.checkReadAccess(filePath);
            expect(hasAccess).toBe(false);
        });
    });

    describe('checkWriteAccess', () => {
        it('should check write access', async () => {
            const filePath = await createTestFile('test.txt');

            const hasAccess = await permissions.checkWriteAccess(filePath);
            expect(hasAccess).toBe(true);
        });

        it('should return false for non-existent file', async () => {
            const filePath = path.join(TEST_DIR, 'nonexistent.txt');

            const hasAccess = await permissions.checkWriteAccess(filePath);
            expect(hasAccess).toBe(false);
        });
    });

    describe('checkExecuteAccess', () => {
        it('should check execute access', async () => {
            const filePath = await createTestFile('test.txt');

            const hasAccess = await permissions.checkExecuteAccess(filePath);
            // By default, files are not executable
            expect(hasAccess).toBe(false);
        });

        it('should return false for non-existent file', async () => {
            const filePath = path.join(TEST_DIR, 'nonexistent.txt');

            const hasAccess = await permissions.checkExecuteAccess(filePath);
            expect(hasAccess).toBe(false);
        });
    });

    describe('makeExecutable', () => {
        it('should make file executable', async () => {
            const filePath = await createTestFile('test.txt');

            await permissions.makeExecutable(filePath);
            const hasAccess = await permissions.checkExecuteAccess(filePath);

            expect(hasAccess).toBe(true);
        });

        it('should handle non-existent file', async () => {
            const filePath = path.join(TEST_DIR, 'nonexistent.txt');

            await expect(permissions.makeExecutable(filePath))
                .rejects
                .toThrow();
        });
    });

    describe('modeToPermissions and permissionsToMode', () => {
        it('should convert between mode and permissions', () => {
            const mode = 0o755; // rwxr-xr-x

            const perms = permissions.modeToPermissions(mode);
            expect(perms).toEqual({
                owner: { read: true, write: true, execute: true },
                group: { read: true, write: false, execute: true },
                others: { read: true, write: false, execute: true }
            });

            const convertedMode = permissions.permissionsToMode(perms);
            expect(convertedMode).toBe(mode);
        });

        it('should handle all permissions off', () => {
            const mode = 0o000;

            const perms = permissions.modeToPermissions(mode);
            expect(perms).toEqual({
                owner: { read: false, write: false, execute: false },
                group: { read: false, write: false, execute: false },
                others: { read: false, write: false, execute: false }
            });

            const convertedMode = permissions.permissionsToMode(perms);
            expect(convertedMode).toBe(mode);
        });

        it('should handle all permissions on', () => {
            const mode = 0o777;

            const perms = permissions.modeToPermissions(mode);
            expect(perms).toEqual({
                owner: { read: true, write: true, execute: true },
                group: { read: true, write: true, execute: true },
                others: { read: true, write: true, execute: true }
            });

            const convertedMode = permissions.permissionsToMode(perms);
            expect(convertedMode).toBe(mode);
        });
    });
});
