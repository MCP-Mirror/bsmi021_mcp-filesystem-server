import { promises as fs } from 'fs';
import path from 'path';
import * as metadata from '../../operations/metadata.js';
import {
    TEST_DIR,
    createTestFile,
    createTestDir
} from '../setup.js';

describe('Metadata Operations', () => {
    describe('getExtendedMetadata', () => {
        it('should get extended file metadata', async () => {
            const content = 'test content';
            const filePath = await createTestFile('test.txt', content);

            const meta = await metadata.getExtendedMetadata(filePath);

            expect(meta.name).toBe('test.txt');
            expect(meta.extension).toBe('.txt');
            expect(meta.mimeType).toBe('text/plain');
            expect(meta.size).toBe(content.length);
            expect(meta.isSymlink).toBe(false);
            expect(meta.isHidden).toBe(false);
            expect(meta.parentDir).toBe(TEST_DIR);
            expect(meta.absolutePath).toBe(path.resolve(filePath));
            expect(meta.relativePath).toBe(path.relative(process.cwd(), filePath));
        });

        it('should detect hidden files', async () => {
            const filePath = await createTestFile('.hidden-file', 'content');

            const meta = await metadata.getExtendedMetadata(filePath);

            expect(meta.isHidden).toBe(true);
        });

        it('should handle different file types', async () => {
            const textFile = await createTestFile('text.txt', 'text content');
            const jsonFile = await createTestFile('data.json', '{"key": "value"}');

            const textMeta = await metadata.getExtendedMetadata(textFile);
            const jsonMeta = await metadata.getExtendedMetadata(jsonFile);

            expect(textMeta.extension).toBe('.txt');
            expect(textMeta.mimeType).toBe('text/plain');
            expect(jsonMeta.extension).toBe('.json');
            expect(jsonMeta.mimeType).toBe('application/json');
        });
    });

    describe('compareFiles', () => {
        it('should compare identical files', async () => {
            const content = 'test content';
            const file1 = await createTestFile('file1.txt', content);
            const file2 = await createTestFile('file2.txt', content);

            const result = await metadata.compareFiles(file1, file2);

            expect(result.areIdentical).toBe(true);
            expect(result.differences).toEqual({});
        });

        it('should detect content differences', async () => {
            const file1 = await createTestFile('file1.txt', 'content 1');
            const file2 = await createTestFile('file2.txt', 'content 2');

            const result = await metadata.compareFiles(file1, file2);

            expect(result.areIdentical).toBe(false);
            expect(result.differences.content).toBe(true);
        });

        it('should detect size differences', async () => {
            const file1 = await createTestFile('file1.txt', 'short');
            const file2 = await createTestFile('file2.txt', 'much longer content');

            const result = await metadata.compareFiles(file1, file2);

            expect(result.areIdentical).toBe(false);
            expect(result.differences.size).toBe(true);
        });

        it('should handle non-existent files', async () => {
            const file1 = await createTestFile('file1.txt', 'content');
            const nonexistent = path.join(TEST_DIR, 'nonexistent.txt');

            await expect(metadata.compareFiles(file1, nonexistent))
                .rejects
                .toThrow();
        });
    });

    describe('createSymlink', () => {
        it('should create symbolic link', async () => {
            const targetPath = await createTestFile('target.txt', 'content');
            const linkPath = path.join(TEST_DIR, 'link.txt');

            await metadata.createSymlink(targetPath, linkPath);

            const meta = await metadata.getExtendedMetadata(linkPath);
            expect(meta.isSymlink).toBe(true);

            const content = await fs.readFile(linkPath, 'utf8');
            expect(content).toBe('content');
        });

        it('should handle non-existent target', async () => {
            const targetPath = path.join(TEST_DIR, 'nonexistent.txt');
            const linkPath = path.join(TEST_DIR, 'link.txt');

            await metadata.createSymlink(targetPath, linkPath);

            const meta = await metadata.getExtendedMetadata(linkPath);
            expect(meta.isSymlink).toBe(true);
        });
    });

    describe('touchFile', () => {
        it('should update timestamps of existing file', async () => {
            const filePath = await createTestFile('test.txt', 'content');
            const originalStats = await fs.stat(filePath);

            // Wait a moment to ensure timestamps will be different
            await new Promise(resolve => setTimeout(resolve, 1000));

            await metadata.touchFile(filePath);
            const newStats = await fs.stat(filePath);

            expect(newStats.mtime.getTime()).toBeGreaterThan(originalStats.mtime.getTime());
            expect(newStats.atime.getTime()).toBeGreaterThan(originalStats.atime.getTime());
        });

        it('should create new empty file if it doesn\'t exist', async () => {
            const filePath = path.join(TEST_DIR, 'new-file.txt');

            await metadata.touchFile(filePath);

            const exists = await fs.access(filePath).then(() => true).catch(() => false);
            expect(exists).toBe(true);

            const content = await fs.readFile(filePath, 'utf8');
            expect(content).toBe('');
        });
    });

    describe('setFileTimestamps', () => {
        it('should set specific timestamps', async () => {
            const filePath = await createTestFile('test.txt', 'content');
            const accessTime = new Date('2023-01-01');
            const modifyTime = new Date('2023-01-02');

            await metadata.setFileTimestamps(filePath, accessTime, modifyTime);

            const stats = await fs.stat(filePath);
            expect(stats.atime.toISOString()).toBe(accessTime.toISOString());
            expect(stats.mtime.toISOString()).toBe(modifyTime.toISOString());
        });

        it('should use current time when timestamps not provided', async () => {
            const filePath = await createTestFile('test.txt', 'content');
            const beforeTime = new Date();

            await metadata.setFileTimestamps(filePath);

            const stats = await fs.stat(filePath);
            expect(stats.atime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
            expect(stats.mtime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
        });

        it('should handle non-existent file', async () => {
            const filePath = path.join(TEST_DIR, 'nonexistent.txt');

            await expect(metadata.setFileTimestamps(filePath))
                .rejects
                .toThrow();
        });
    });
});
