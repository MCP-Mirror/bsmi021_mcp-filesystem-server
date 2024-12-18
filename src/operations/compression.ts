import { createWriteStream } from 'fs';
import Archiver from 'archiver';
import extract from 'extract-zip';
import path from 'path';
import { promises as fs } from 'fs';

/**
 * Create zip archive from files
 */
export async function createZip(files: string[], outputPath: string): Promise<void> {
    const output = createWriteStream(outputPath);
    const archive = Archiver('zip', { zlib: { level: 9 } });

    archive.pipe(output);

    for (const file of files) {
        const stats = await fs.stat(file);
        if (stats.isDirectory()) {
            archive.directory(file, path.basename(file));
        } else {
            archive.file(file, { name: path.basename(file) });
        }
    }

    return new Promise((resolve, reject) => {
        output.on('close', resolve);
        archive.on('error', reject);
        archive.finalize();
    });
}

/**
 * Extract zip archive
 */
export async function extractZip(zipPath: string, outputPath: string): Promise<void> {
    await extract(zipPath, { dir: outputPath });
}
