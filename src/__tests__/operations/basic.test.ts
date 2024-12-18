import { promises as fs } from 'fs';
import path from 'path';
import * as basic from '../../operations/basic.js';
import {
    TEST_DIR,
    createTestFile,
    readTestFile,
    testFileExists
} from '../setup.js';

describe('Basic File Operations', () => {
    describe('readFileWithMetadata', () => {
        it('should read file content with metadata', async () => {
            const content = 'test content';
            const filePath = await createTestFile('test.txt', content);

            const result = await basic.readFileWithMetadata(filePath);

            expect(result.content).toBe(content);
            expect(result.name).toBe('test.txt');
            expect(result.isDirectory).toBe(false);
            expect(result.size).toBe(content.length);
        });

        it('should throw error when reading directory as file', async () => {
            const dirPath = path.join(TEST_DIR, 'testdir');
            await fs.mkdir(dirPath);

            await expect(basic.readFileWithMetadata(dirPath))
                .rejects
                .toThrow('Cannot read directory as file');
        });
    });

    describe('writeFile', () => {
        it('should write content to file', async () => {
            const filePath = path.join(TEST_DIR, 'write-test.txt');
            const content = 'test content';

            await basic.writeFile(filePath, content);
            const written = await readTestFile('write-test.txt');

            expect(written).toBe(content);
        });

        it('should create parent directories if they don\'t exist', async () => {
            const filePath = path.join(TEST_DIR, 'nested', 'deep', 'write-test.txt');
            const content = 'test content';

            await basic.writeFile(filePath, content);
            const written = await fs.readFile(filePath, 'utf8');

            expect(written).toBe(content);
        });
    });

    describe('appendFile', () => {
        it('should append content to existing file', async () => {
            const filePath = await createTestFile('append-test.txt', 'initial content\n');
            const appendContent = 'appended content';

            await basic.appendFile(filePath, appendContent);
            const content = await readTestFile('append-test.txt');

            expect(content).toBe('initial content\nappended content');
        });

        it('should create file if it doesn\'t exist', async () => {
            const filePath = path.join(TEST_DIR, 'new-append.txt');
            const content = 'new content';

            await basic.appendFile(filePath, content);
            const written = await readTestFile('new-append.txt');

            expect(written).toBe(content);
        });
    });

    describe('deleteFile', () => {
        it('should delete existing file', async () => {
            const filePath = await createTestFile('delete-test.txt');

            await basic.deleteFile(filePath);
            const exists = await testFileExists('delete-test.txt');

            expect(exists).toBe(false);
        });

        it('should throw error when deleting directory', async () => {
            const dirPath = path.join(TEST_DIR, 'testdir');
            await fs.mkdir(dirPath);

            await expect(basic.deleteFile(dirPath))
                .rejects
                .toThrow('Cannot delete directory as file');
        });
    });

    describe('copyFile', () => {
        it('should copy file to new location', async () => {
            const content = 'test content';
            const sourcePath = await createTestFile('source.txt', content);
            const destPath = path.join(TEST_DIR, 'dest.txt');

            await basic.copyFile(sourcePath, destPath);
            const copied = await readTestFile('dest.txt');

            expect(copied).toBe(content);
        });

        it('should throw error when destination exists and overwrite is false', async () => {
            const sourcePath = await createTestFile('source.txt');
            const destPath = await createTestFile('dest.txt');

            await expect(basic.copyFile(sourcePath, destPath, false))
                .rejects
                .toThrow('Destination file already exists');
        });

        it('should overwrite destination when overwrite is true', async () => {
            const content = 'new content';
            const sourcePath = await createTestFile('source.txt', content);
            const destPath = await createTestFile('dest.txt', 'old content');

            await basic.copyFile(sourcePath, destPath, true);
            const copied = await readTestFile('dest.txt');

            expect(copied).toBe(content);
        });
    });

    describe('moveFile', () => {
        it('should move file to new location', async () => {
            const content = 'test content';
            const sourcePath = await createTestFile('source.txt', content);
            const destPath = path.join(TEST_DIR, 'moved.txt');

            await basic.moveFile(sourcePath, destPath);

            const sourceExists = await testFileExists('source.txt');
            const movedContent = await readTestFile('moved.txt');

            expect(sourceExists).toBe(false);
            expect(movedContent).toBe(content);
        });

        it('should throw error when destination exists and overwrite is false', async () => {
            const sourcePath = await createTestFile('source.txt');
            const destPath = await createTestFile('dest.txt');

            await expect(basic.moveFile(sourcePath, destPath, false))
                .rejects
                .toThrow('Destination file already exists');
        });

        it('should overwrite destination when overwrite is true', async () => {
            const content = 'new content';
            const sourcePath = await createTestFile('source.txt', content);
            const destPath = await createTestFile('dest.txt', 'old content');

            await basic.moveFile(sourcePath, destPath, true);

            const sourceExists = await testFileExists('source.txt');
            const movedContent = await readTestFile('dest.txt');

            expect(sourceExists).toBe(false);
            expect(movedContent).toBe(content);
        });
    });
});
