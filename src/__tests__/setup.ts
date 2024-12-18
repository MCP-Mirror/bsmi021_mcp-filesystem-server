import { promises as fs } from 'fs';
import path from 'path';

/**
 * Test environment setup and utilities
 */

// Create test directory for file operations
const TEST_DIR = path.join(process.cwd(), 'test-files');

// Clean up function to remove test files
export async function cleanupTestFiles(): Promise<void> {
    try {
        await fs.rm(TEST_DIR, { recursive: true, force: true });
    } catch (error) {
        // Ignore if directory doesn't exist
    }
}

// Create test directory
export async function setupTestFiles(): Promise<void> {
    await cleanupTestFiles();
    await fs.mkdir(TEST_DIR, { recursive: true });
}

// Helper to create a test file with content
export async function createTestFile(filename: string, content: string = ''): Promise<string> {
    const filePath = path.join(TEST_DIR, filename);
    await fs.writeFile(filePath, content);
    return filePath;
}

// Helper to create a test directory
export async function createTestDir(dirname: string): Promise<string> {
    const dirPath = path.join(TEST_DIR, dirname);
    await fs.mkdir(dirPath, { recursive: true });
    return dirPath;
}

// Helper to read a test file
export async function readTestFile(filename: string): Promise<string> {
    const filePath = path.join(TEST_DIR, filename);
    return fs.readFile(filePath, 'utf8');
}

// Helper to check if a test file exists
export async function testFileExists(filename: string): Promise<boolean> {
    const filePath = path.join(TEST_DIR, filename);
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

// Run before all tests
beforeAll(async () => {
    await setupTestFiles();
});

// Run after all tests
afterAll(async () => {
    await cleanupTestFiles();
});

// Run before each test
beforeEach(async () => {
    await cleanupTestFiles();
    await setupTestFiles();
});

// Export test directory path
export { TEST_DIR };
