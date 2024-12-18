import { promises as fs } from 'fs';
import path from 'path';
import * as compression from '../../operations/compression.js';
import {
    TEST_DIR,
    createTestFile,
    createTestDir,
    readTestFile,
    testFileExists
} from '../setup.js';

describe('Compression Operations', () => {
    describe('createZip', () => {
        it('should create zip archive from files', async () => {
            // Create test files
            const file1Path = await createTestFile('file1.txt', 'content 1');
            const file2Path = await createTestFile('file2.txt', 'content 2');
            const outputPath = path.join(TEST_DIR, 'output.zip');

            // Create zip
            await compression.createZip([file1Path, file2Path], outputPath);

            // Verify zip was created
            const exists = await testFileExists('output.zip');
            expect(exists).toBe(true);

            // Verify zip size is non-zero
            const stats = await fs.stat(outputPath);
            expect(stats.size).toBeGreaterThan(0);
        });

        it('should create zip archive with nested directory structure', async () => {
            // Create test directory structure
            const dirPath = await createTestDir('testdir');
            const file1Path = await createTestFile('testdir/file1.txt', 'content 1');
            const subdirPath = await createTestDir('testdir/subdir');
            const file2Path = await createTestFile('testdir/subdir/file2.txt', 'content 2');

            const outputPath = path.join(TEST_DIR, 'output.zip');

            // Create zip
            await compression.createZip([dirPath], outputPath);

            // Verify zip was created
            const exists = await testFileExists('output.zip');
            expect(exists).toBe(true);

            // Verify zip size is non-zero
            const stats = await fs.stat(outputPath);
            expect(stats.size).toBeGreaterThan(0);
        });

        it('should handle empty file list', async () => {
            const outputPath = path.join(TEST_DIR, 'empty.zip');

            await compression.createZip([], outputPath);

            const exists = await testFileExists('empty.zip');
            expect(exists).toBe(true);
        });
    });

    describe('extractZip', () => {
        it('should extract zip archive', async () => {
            // Create and zip test files
            const file1Path = await createTestFile('file1.txt', 'content 1');
            const file2Path = await createTestFile('file2.txt', 'content 2');
            const zipPath = path.join(TEST_DIR, 'test.zip');
            await compression.createZip([file1Path, file2Path], zipPath);

            // Clean up original files
            await fs.unlink(file1Path);
            await fs.unlink(file2Path);

            // Extract zip
            const extractPath = path.join(TEST_DIR, 'extracted');
            await compression.extractZip(zipPath, extractPath);

            // Verify extracted files
            const file1Content = await fs.readFile(
                path.join(extractPath, 'file1.txt'),
                'utf8'
            );
            const file2Content = await fs.readFile(
                path.join(extractPath, 'file2.txt'),
                'utf8'
            );

            expect(file1Content).toBe('content 1');
            expect(file2Content).toBe('content 2');
        });

        it('should extract zip archive with nested directory structure', async () => {
            // Create and zip test directory structure
            const dirPath = await createTestDir('testdir');
            await createTestFile('testdir/file1.txt', 'content 1');
            await createTestDir('testdir/subdir');
            await createTestFile('testdir/subdir/file2.txt', 'content 2');

            const zipPath = path.join(TEST_DIR, 'test.zip');
            await compression.createZip([dirPath], zipPath);

            // Clean up original directory
            await fs.rm(dirPath, { recursive: true });

            // Extract zip
            const extractPath = path.join(TEST_DIR, 'extracted');
            await compression.extractZip(zipPath, extractPath);

            // Verify extracted files
            const file1Content = await fs.readFile(
                path.join(extractPath, 'testdir', 'file1.txt'),
                'utf8'
            );
            const file2Content = await fs.readFile(
                path.join(extractPath, 'testdir', 'subdir', 'file2.txt'),
                'utf8'
            );

            expect(file1Content).toBe('content 1');
            expect(file2Content).toBe('content 2');
        });

        it('should throw error for invalid zip file', async () => {
            // Create invalid zip file
            const invalidZipPath = await createTestFile('invalid.zip', 'not a zip file');
            const extractPath = path.join(TEST_DIR, 'extracted');

            await expect(compression.extractZip(invalidZipPath, extractPath))
                .rejects
                .toThrow();
        });

        it('should handle empty zip file', async () => {
            const zipPath = path.join(TEST_DIR, 'empty.zip');
            await compression.createZip([], zipPath);

            const extractPath = path.join(TEST_DIR, 'extracted');
            await compression.extractZip(zipPath, extractPath);

            // Verify extraction created the directory
            const stats = await fs.stat(extractPath);
            expect(stats.isDirectory()).toBe(true);
        });
    });
});
