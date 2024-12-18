/**
 * Type definitions for filesystem operations
 */

/**
 * Interface for file/directory metadata
 */
export interface FileStats {
    name: string;
    path: string;
    size: number;
    isDirectory: boolean;
    created: Date;
    modified: Date;
    accessed: Date;
    mode: string;
}

/**
 * Interface for directory entry with optional recursive contents
 */
export interface DirectoryEntry extends FileStats {
    contents?: DirectoryEntry[];
}

/**
 * Interface for file content with metadata
 */
export interface FileContent extends FileStats {
    content: string;
}

/**
 * Interface for text file analysis results
 */
export interface TextAnalysis {
    lineCount: number;
    wordCount: number;
    charCount: number;
    encoding: string;
    mimeType: string;
}

/**
 * Interface for file search match
 */
export interface SearchMatch {
    file: string;
    line: number;
    content: string;
    match: string;
}

/**
 * Interface for duplicate file group
 */
export interface DuplicateGroup {
    hash: string;
    size: number;
    files: string[];
}
