import { promises as fs } from 'fs';
import path from 'path';
import { FileWatcher } from '../../operations/monitoring.js';
import {
    TEST_DIR,
    createTestFile,
    createTestDir
} from '../setup.js';

describe('Monitoring Operations', () => {
    let watcher: FileWatcher;

    beforeEach(() => {
        watcher = new FileWatcher();
    });

    afterEach(async () => {
        await watcher.closeAll();
    });

    describe('FileWatcher', () => {
        it('should detect file creation', async () => {
            const changes: any[] = [];
            watcher.on('change', (event) => changes.push(event));

            await watcher.watchDirectory(TEST_DIR);

            // Create a file
            const filePath = path.join(TEST_DIR, 'new-file.txt');
            await fs.writeFile(filePath, 'content');

            // Wait for event to be processed
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(changes.length).toBeGreaterThan(0);
            expect(changes.some(event =>
                event.type === 'change' &&
                event.path.endsWith('new-file.txt')
            )).toBe(true);
        });

        it('should detect file modification', async () => {
            const filePath = await createTestFile('test.txt', 'initial content');
            const changes: any[] = [];

            watcher.on('change', (event) => changes.push(event));
            await watcher.watchDirectory(TEST_DIR);

            // Modify the file
            await fs.writeFile(filePath, 'modified content');

            // Wait for event to be processed
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(changes.length).toBeGreaterThan(0);
            expect(changes.some(event =>
                event.type === 'change' &&
                event.path.endsWith('test.txt')
            )).toBe(true);
        });

        it('should detect file deletion', async () => {
            const filePath = await createTestFile('test.txt', 'content');
            const changes: any[] = [];

            watcher.on('change', (event) => changes.push(event));
            await watcher.watchDirectory(TEST_DIR);

            // Delete the file
            await fs.unlink(filePath);

            // Wait for event to be processed
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(changes.length).toBeGreaterThan(0);
            expect(changes.some(event =>
                event.type === 'unlink' &&
                event.path.endsWith('test.txt')
            )).toBe(true);
        });

        it('should watch recursively when specified', async () => {
            const subdirPath = await createTestDir('subdir');
            const changes: any[] = [];

            watcher.on('change', (event) => changes.push(event));
            await watcher.watchDirectory(TEST_DIR, true);

            // Create a file in subdirectory
            const filePath = path.join(subdirPath, 'nested-file.txt');
            await fs.writeFile(filePath, 'content');

            // Wait for event to be processed
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(changes.length).toBeGreaterThan(0);
            expect(changes.some(event =>
                event.type === 'change' &&
                event.path.endsWith('nested-file.txt')
            )).toBe(true);
        });

        it('should not watch recursively when not specified', async () => {
            const subdirPath = await createTestDir('subdir');
            const changes: any[] = [];

            watcher.on('change', (event) => changes.push(event));
            await watcher.watchDirectory(TEST_DIR, false);

            // Create a file in subdirectory
            const filePath = path.join(subdirPath, 'nested-file.txt');
            await fs.writeFile(filePath, 'content');

            // Create a file in root directory
            const rootFilePath = path.join(TEST_DIR, 'root-file.txt');
            await fs.writeFile(rootFilePath, 'content');

            // Wait for events to be processed
            await new Promise(resolve => setTimeout(resolve, 100));

            // Should only detect the root file
            expect(changes.some(event =>
                event.type === 'change' &&
                event.path.endsWith('root-file.txt')
            )).toBe(true);

            // Should not detect the nested file
            expect(changes.some(event =>
                event.path.endsWith('nested-file.txt')
            )).toBe(false);
        });

        it('should stop watching when unwatchDirectory is called', async () => {
            const changes: any[] = [];

            watcher.on('change', (event) => changes.push(event));
            await watcher.watchDirectory(TEST_DIR);

            // Unwatch the directory
            await watcher.unwatchDirectory(TEST_DIR);

            // Create a file
            const filePath = path.join(TEST_DIR, 'new-file.txt');
            await fs.writeFile(filePath, 'content');

            // Wait for potential events
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(changes.length).toBe(0);
        });

        it('should handle watching multiple directories', async () => {
            const dir1 = await createTestDir('dir1');
            const dir2 = await createTestDir('dir2');
            const changes: any[] = [];

            watcher.on('change', (event) => changes.push(event));
            await watcher.watchDirectory(dir1);
            await watcher.watchDirectory(dir2);

            // Create files in both directories
            await fs.writeFile(path.join(dir1, 'file1.txt'), 'content');
            await fs.writeFile(path.join(dir2, 'file2.txt'), 'content');

            // Wait for events to be processed
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(changes.length).toBeGreaterThan(1);
            expect(changes.some(event => event.path.endsWith('file1.txt'))).toBe(true);
            expect(changes.some(event => event.path.endsWith('file2.txt'))).toBe(true);
        });

        it('should clean up all watchers when closeAll is called', async () => {
            const dir1 = await createTestDir('dir1');
            const dir2 = await createTestDir('dir2');
            const changes: any[] = [];

            watcher.on('change', (event) => changes.push(event));
            await watcher.watchDirectory(dir1);
            await watcher.watchDirectory(dir2);

            // Close all watchers
            await watcher.closeAll();

            // Create files in both directories
            await fs.writeFile(path.join(dir1, 'file1.txt'), 'content');
            await fs.writeFile(path.join(dir2, 'file2.txt'), 'content');

            // Wait for potential events
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(changes.length).toBe(0);
        });
    });
});
