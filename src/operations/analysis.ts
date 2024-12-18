import { createReadStream } from 'fs';
import { promises as fs } from 'fs';
import * as crypto from 'crypto';
import * as chardet from 'chardet';
import * as mimeTypes from 'mime-types';
import { TextAnalysis, SearchMatch, DuplicateGroup } from '../types.js';
import { getAllFiles } from '../utils.js';

/**
 * Calculate file hash
 */
export async function calculateHash(filePath: string, algorithm: string = 'sha256'): Promise<string> {
    const hash = crypto.createHash(algorithm);
    const stream = createReadStream(filePath);

    return new Promise((resolve, reject) => {
        stream.on('data', data => hash.update(data));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', error => reject(error));
    });
}

/**
 * Analyze text file
 */
export async function analyzeTextFile(filePath: string): Promise<TextAnalysis> {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    const words = content.split(/\s+/).filter(word => word.length > 0);
    const encoding = await chardet.detectFile(filePath) || 'unknown';

    return {
        lineCount: lines.length,
        wordCount: words.length,
        charCount: content.length,
        encoding: encoding.toString(),
        mimeType: mimeTypes.lookup(filePath) || 'application/octet-stream'
    };
}

/**
 * Search for pattern in file
 */
export async function searchInFile(filePath: string, pattern: RegExp): Promise<SearchMatch[]> {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    const matches: SearchMatch[] = [];

    lines.forEach((line, index) => {
        const match = line.match(pattern);
        if (match) {
            matches.push({
                file: filePath,
                line: index + 1,
                content: line,
                match: match[0]
            });
        }
    });

    return matches;
}

/**
 * Find duplicate files in directory
 */
export async function findDuplicates(dirPath: string): Promise<DuplicateGroup[]> {
    const files = await getAllFiles(dirPath);
    const hashMap = new Map<string, string[]>();

    for (const file of files) {
        const hash = await calculateHash(file);
        const existing = hashMap.get(hash) || [];
        hashMap.set(hash, [...existing, file]);
    }

    const duplicates: DuplicateGroup[] = [];
    for (const [hash, files] of hashMap.entries()) {
        if (files.length > 1) {
            const stats = await fs.stat(files[0]);
            duplicates.push({
                hash,
                size: stats.size,
                files
            });
        }
    }

    return duplicates;
}
