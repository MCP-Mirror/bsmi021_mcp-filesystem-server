import { promises as fs } from 'fs';
import path from 'path';
import * as directory from '../../operations/directory.js';
import {
    TEST_DIR,
    createTestFile,
    createTestDir,
    testFileExists
} from '../setup.js';

describe('Directory Operations', () => {
    describe('listDirectoryContents', () => {
        it('should list directory contents non-recursively', async () => {
            await createTestFile('file1.txt');
            await createTestFile('file2.txt');
            await createTestDir('subdir');

            const contents = await directory.listDirectoryContents(TEST_DIR, false);

            expect(contents).toHaveLength(3);
            expect(contents.map(c => c.name).sort()).toEqual(['file1.txt', 'file2.txt', 'subdir'].sort());
            expect(contents.find(c => c.name === 'subdir')?.isDirectory).toBe(true);
        });

        it('should list directory contents recursively', async () => {
            await createTestFile('file1.txt');
            await createTestDir('subdir');
            await createTestFile(path.join('subdir', 'file2.txt'));

            const contents = await directory.listDirectoryContents(TEST_DIR, true);

            expect(contents).toHaveLength(2);
            const subdir = contents.find(c => c.name === 'subdir');
            expect(subdir?.isDirectory).toBe(true);
            expect(subdir?.contents).toHaveLength(1);
            expect(subdir?.contents?.[0].name).toBe('file2.txt');
        });
    });

    describe('makeDirectory', () => {
        it('should create directory', async () => {
            const dirPath = path.join(TEST_DIR, 'newdir');

            await directory.makeDirectory(dirPath);
            const stats = await fs.stat(dirPath);

            expect(stats.isDirectory()).toBe(true);
        });

        it('should create nested directories when recursive is true', async () => {
            const dirPath = path.join(TEST_DIR, 'nested', 'deep', 'dir');

            await directory.makeDirectory(dirPath, true);
            const stats = await fs.stat(dirPath);

            expect(stats.isDirectory()).toBe(true);
        });

        it('should throw error for nested directories when recursive is false', async () => {
            const dirPath = path.join(TEST_DIR, 'nested', 'deep', 'dir');

            await expect(directory.makeDirectory(dirPath, false))
                .rejects
                .toThrow();
        });
    });

    describe('removeDirectory', () => {
        it('should remove empty directory', async () => {
            const dirPath = await createTestDir('emptydir');

            await directory.removeDirectory(dirPath);
            const exists = await testFileExists('emptydir');

            expect(exists).toBe(false);
        });

        it('should throw error for non-empty directory when recursive is false', async () => {
            const dirPath = await createTestDir('nonempty');
            await createTestFile(path.join('nonempty', 'file.txt'));

            await expect(directory.removeDirectory(dirPath, false))
                .rejects
                .toThrow();
        });

        it('should remove directory and contents when recursive is true', async () => {
            const dirPath = await createTestDir('nonempty');
            await createTestFile(path.join('nonempty', 'file.txt'));

            await directory.removeDirectory(dirPath, true);
            const exists = await testFileExists('nonempty');

            expect(exists).toBe(false);
        });
    });

    describe('copyDirectory', () => {
        it('should copy directory and contents', async () => {
            const sourceDir = await createTestDir('source');
            await createTestFile(path.join('source', 'file1.txt'), 'content1');
            await createTestDir(path.join('source', 'subdir'));
            await createTestFile(path.join('source', 'subdir', 'file2.txt'), 'content2');

            const destPath = path.join(TEST_DIR, 'dest');
            await directory.copyDirectory(sourceDir, destPath);

            // Check directory structure
            const destStats = await fs.stat(destPath);
            expect(destStats.isDirectory()).toBe(true);

            const file1Path = path.join(destPath, 'file1.txt');
            const file1Content = await fs.readFile(file1Path, 'utf8');
            expect(file1Content).toBe('content1');

            const subdirPath = path.join(destPath, 'subdir');
            const subdirStats = await fs.stat(subdirPath);
            expect(subdirStats.isDirectory()).toBe(true);

            const file2Path = path.join(subdirPath, 'file2.txt');
            const file2Content = await fs.readFile(file2Path, 'utf8');
            expect(file2Content).toBe('content2');
        });

        it('should throw error when source is not a directory', async () => {
            const sourcePath = await createTestFile('source.txt');
            const destPath = path.join(TEST_DIR, 'dest');

            await expect(directory.copyDirectory(sourcePath, destPath))
                .rejects
                .toThrow('Source is not a directory');
        });

        it('should throw error when destination exists and overwrite is false', async () => {
            const sourceDir = await createTestDir('source');
            const destDir = await createTestDir('dest');

            await expect(directory.copyDirectory(sourceDir, destDir, false))
                .rejects
                .toThrow('Destination directory already exists');
        });

        it('should overwrite destination when overwrite is true', async () => {
            const sourceDir = await createTestDir('source');
            await createTestFile(path.join('source', 'file.txt'), 'new content');

            const destDir = await createTestDir('dest');
            await createTestFile(path.join('dest', 'old.txt'), 'old content');

            await directory.copyDirectory(sourceDir, destDir, true);

            const oldExists = await testFileExists(path.join('dest', 'old.txt'));
            expect(oldExists).toBe(false);

            const newContent = await fs.readFile(path.join(destDir, 'file.txt'), 'utf8');
            expect(newContent).toBe('new content');
        });
    });
});
