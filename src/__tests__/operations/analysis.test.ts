import { promises as fs } from 'fs';
import path from 'path';
import * as analysis from '../../operations/analysis.js';
import {
    TEST_DIR,
    createTestFile,
    createTestDir
} from '../setup.js';

describe('Analysis Operations', () => {
    describe('calculateHash', () => {
        it('should calculate file hash with default algorithm (sha256)', async () => {
            const content = 'test content';
            const filePath = await createTestFile('hash-test.txt', content);

            const hash = await analysis.calculateHash(filePath);

            // Known SHA256 hash for 'test content'
            const expectedHash = '4e67d16de9c154b7e8d708436f9ecc700548354ad04f76e97c669a2d3dec84ea';
            expect(hash).toBe(expectedHash);
        });

        it('should calculate file hash with specified algorithm', async () => {
            const content = 'test content';
            const filePath = await createTestFile('hash-test.txt', content);

            const md5Hash = await analysis.calculateHash(filePath, 'md5');
            const sha1Hash = await analysis.calculateHash(filePath, 'sha1');

            // Known hashes for 'test content'
            expect(md5Hash).toBe('9473fdd0d880a43c21b7778d34872157');
            expect(sha1Hash).toBe('1eebdf4fdc9fc7bf283031b93f9aef3338de9052');
        });
    });

    describe('analyzeTextFile', () => {
        it('should analyze text file content', async () => {
            const content = 'Line 1\nLine 2\nLine 3';
            const filePath = await createTestFile('analyze-test.txt', content);

            const analysis_result = await analysis.analyzeTextFile(filePath);

            expect(analysis_result.lineCount).toBe(3);
            expect(analysis_result.wordCount).toBe(6);
            expect(analysis_result.charCount).toBe(17);
            expect(analysis_result.encoding).toBe('ASCII');
            expect(analysis_result.mimeType).toBe('text/plain');
        });

        it('should handle empty file', async () => {
            const filePath = await createTestFile('empty.txt', '');

            const analysis_result = await analysis.analyzeTextFile(filePath);

            expect(analysis_result.lineCount).toBe(1);
            expect(analysis_result.wordCount).toBe(0);
            expect(analysis_result.charCount).toBe(0);
        });
    });

    describe('searchInFile', () => {
        it('should find matches in file', async () => {
            const content = 'Line with test\nAnother test line\nNo match here\nFinal test';
            const filePath = await createTestFile('search-test.txt', content);

            const matches = await analysis.searchInFile(filePath, /test/);

            expect(matches).toHaveLength(3);
            expect(matches[0].line).toBe(1);
            expect(matches[0].content).toBe('Line with test');
            expect(matches[1].line).toBe(2);
            expect(matches[1].content).toBe('Another test line');
            expect(matches[2].line).toBe(4);
            expect(matches[2].content).toBe('Final test');
        });

        it('should return empty array when no matches found', async () => {
            const content = 'Line one\nLine two\nLine three';
            const filePath = await createTestFile('no-match.txt', content);

            const matches = await analysis.searchInFile(filePath, /test/);

            expect(matches).toHaveLength(0);
        });
    });

    describe('findDuplicates', () => {
        it('should find duplicate files', async () => {
            const content1 = 'test content';
            const content2 = 'different content';

            await createTestFile('file1.txt', content1);
            await createTestFile('file2.txt', content1); // Duplicate of file1
            await createTestFile('file3.txt', content2);
            await createTestFile('file4.txt', content2); // Duplicate of file3

            const duplicates = await analysis.findDuplicates(TEST_DIR);

            expect(duplicates).toHaveLength(2); // Two groups of duplicates

            // Each group should have 2 files
            expect(duplicates[0].files).toHaveLength(2);
            expect(duplicates[1].files).toHaveLength(2);

            // Files in each group should have the same hash
            const group1Files = duplicates[0].files.map(f => path.basename(f)).sort();
            const group2Files = duplicates[1].files.map(f => path.basename(f)).sort();

            // One group should contain file1 and file2
            if (group1Files.includes('file1.txt')) {
                expect(group1Files).toEqual(['file1.txt', 'file2.txt']);
                expect(group2Files).toEqual(['file3.txt', 'file4.txt']);
            } else {
                expect(group1Files).toEqual(['file3.txt', 'file4.txt']);
                expect(group2Files).toEqual(['file1.txt', 'file2.txt']);
            }
        });

        it('should handle directory with no duplicates', async () => {
            await createTestFile('unique1.txt', 'content 1');
            await createTestFile('unique2.txt', 'content 2');
            await createTestFile('unique3.txt', 'content 3');

            const duplicates = await analysis.findDuplicates(TEST_DIR);

            expect(duplicates).toHaveLength(0);
        });

        it('should handle empty directory', async () => {
            const duplicates = await analysis.findDuplicates(TEST_DIR);

            expect(duplicates).toHaveLength(0);
        });

        it('should handle nested directories', async () => {
            const content = 'duplicate content';
            await createTestFile('file1.txt', content);
            await createTestDir('subdir');
            await createTestFile(path.join('subdir', 'file2.txt'), content);

            const duplicates = await analysis.findDuplicates(TEST_DIR);

            expect(duplicates).toHaveLength(1);
            expect(duplicates[0].files).toHaveLength(2);
        });
    });
});
