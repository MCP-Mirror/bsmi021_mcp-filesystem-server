import { promises as fs } from 'fs';
import path from 'path';
import { Readable, Writable } from 'stream';
import * as streams from '../../operations/streams.js';
import {
    TEST_DIR,
    createTestFile,
    readTestFile
} from '../setup.js';

describe('Stream Operations', () => {
    describe('createFileReadStream', () => {
        it('should create readable stream for file', async () => {
            const content = 'test content';
            const filePath = await createTestFile('test.txt', content);

            const stream = streams.createFileReadStream(filePath);
            const chunks: Buffer[] = [];

            await new Promise((resolve, reject) => {
                stream.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
                stream.on('end', resolve);
                stream.on('error', reject);
            });

            const result = Buffer.concat(chunks).toString();
            expect(result).toBe(content);
        });

        it('should respect start and end options', async () => {
            const content = 'test content';
            const filePath = await createTestFile('test.txt', content);

            const stream = streams.createFileReadStream(filePath, {
                start: 5,
                end: 8
            });
            const chunks: Buffer[] = [];

            await new Promise((resolve, reject) => {
                stream.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
                stream.on('end', resolve);
                stream.on('error', reject);
            });

            const result = Buffer.concat(chunks).toString();
            expect(result).toBe('con');
        });
    });

    describe('createFileWriteStream', () => {
        it('should create writable stream for file', async () => {
            const filePath = path.join(TEST_DIR, 'write-stream.txt');
            const content = 'test content';

            const stream = await streams.createFileWriteStream(filePath);

            await new Promise<void>((resolve, reject) => {
                stream.write(content, (error) => {
                    if (error) reject(error);
                    stream.end(resolve);
                });
            });

            const written = await readTestFile('write-stream.txt');
            expect(written).toBe(content);
        });

        it('should create parent directories if needed', async () => {
            const filePath = path.join(TEST_DIR, 'nested', 'deep', 'write-stream.txt');
            const content = 'test content';

            const stream = await streams.createFileWriteStream(filePath);

            await new Promise<void>((resolve, reject) => {
                stream.write(content, (error) => {
                    if (error) reject(error);
                    stream.end(resolve);
                });
            });

            const written = await fs.readFile(filePath, 'utf8');
            expect(written).toBe(content);
        });
    });

    describe('streamCopy', () => {
        it('should copy file using streams', async () => {
            const content = 'test content';
            const sourcePath = await createTestFile('source.txt', content);
            const destPath = path.join(TEST_DIR, 'dest.txt');

            await streams.streamCopy(sourcePath, destPath);

            const copied = await readTestFile('dest.txt');
            expect(copied).toBe(content);
        });

        it('should handle large files', async () => {
            // Create a large file (1MB)
            const content = 'x'.repeat(1024 * 1024);
            const sourcePath = await createTestFile('large.txt', content);
            const destPath = path.join(TEST_DIR, 'large-copy.txt');

            await streams.streamCopy(sourcePath, destPath);

            const copied = await readTestFile('large-copy.txt');
            expect(copied).toBe(content);
        });
    });

    describe('readFileChunks', () => {
        it('should read file in chunks', async () => {
            const content = 'test content';
            const filePath = await createTestFile('chunks.txt', content);

            const chunks: Buffer[] = [];
            for await (const chunk of streams.readFileChunks(filePath)) {
                chunks.push(Buffer.from(chunk));
            }

            const result = Buffer.concat(chunks).toString();
            expect(result).toBe(content);
        });

        it('should respect chunk size', async () => {
            const content = 'test content';
            const filePath = await createTestFile('chunks.txt', content);

            const chunks: Buffer[] = [];
            for await (const chunk of streams.readFileChunks(filePath, 4)) {
                chunks.push(Buffer.from(chunk));
            }

            expect(chunks.length).toBeGreaterThan(1);
            const result = Buffer.concat(chunks).toString();
            expect(result).toBe(content);
        });
    });

    describe('writeFileChunks', () => {
        it('should write chunks to file', async () => {
            const filePath = path.join(TEST_DIR, 'chunks-write.txt');
            const content = 'test content';

            // Create an async iterable of chunks
            async function* generateChunks() {
                for (const c of content) {
                    yield Buffer.from(c);
                }
            }

            await streams.writeFileChunks(filePath, generateChunks());

            const written = await readTestFile('chunks-write.txt');
            expect(written).toBe(content);
        });

        it('should handle backpressure', async () => {
            const filePath = path.join(TEST_DIR, 'backpressure.txt');

            // Create an async iterable of chunks
            async function* generateLargeChunks() {
                for (let i = 0; i < 1000; i++) {
                    yield Buffer.from('x'.repeat(1024));
                }
            }

            await streams.writeFileChunks(filePath, generateLargeChunks());

            const stats = await fs.stat(filePath);
            expect(stats.size).toBe(1024 * 1000);
        });
    });

    describe('transformLines', () => {
        it('should transform lines in file', async () => {
            const content = 'line1\nline2\nline3';
            const filePath = await createTestFile('lines.txt', content);

            const transformed: string[] = [];
            for await (const line of streams.transformLines(filePath, line => line.toUpperCase())) {
                transformed.push(line);
            }

            expect(transformed).toEqual(['LINE1', 'LINE2', 'LINE3']);
        });

        it('should handle empty lines', async () => {
            const content = 'line1\n\nline3';
            const filePath = await createTestFile('empty-lines.txt', content);

            const transformed: string[] = [];
            for await (const line of streams.transformLines(filePath, line => line || 'empty')) {
                transformed.push(line);
            }

            expect(transformed).toEqual(['line1', 'empty', 'line3']);
        });
    });

    describe('pipeThrough', () => {
        it('should pipe file through transform', async () => {
            const content = 'test content';
            const sourcePath = await createTestFile('source.txt', content);
            const destPath = path.join(TEST_DIR, 'transformed.txt');

            await streams.pipeThrough(
                sourcePath,
                destPath,
                chunk => chunk.toString().toUpperCase()
            );

            const transformed = await readTestFile('transformed.txt');
            expect(transformed).toBe(content.toUpperCase());
        });

        it('should handle transform errors', async () => {
            const sourcePath = await createTestFile('source.txt', 'test');
            const destPath = path.join(TEST_DIR, 'error.txt');

            await expect(streams.pipeThrough(
                sourcePath,
                destPath,
                () => { throw new Error('Transform error'); }
            )).rejects.toThrow('Transform error');
        });
    });
});
