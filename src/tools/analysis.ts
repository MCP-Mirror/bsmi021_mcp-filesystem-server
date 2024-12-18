import { ToolCategory, ToolResponse } from './types.js';
import { normalizePath, getFileStats } from '../utils.js';
import * as analysis from '../operations/analysis.js';
import { promises as fs } from 'fs';

/**
 * Analysis tools for file content and metadata analysis
 */
export const analysisTools: ToolCategory = {
    search_in_files: {
        definition: {
            name: "search_in_files",
            description: "Search for text/regex pattern in files",
            inputSchema: {
                type: "object",
                properties: {
                    path: { type: "string", description: "Directory path to search in" },
                    pattern: { type: "string", description: "Regular expression pattern to search for" },
                    recursive: { type: "boolean", description: "Whether to search recursively", default: true }
                },
                required: ["path", "pattern"]
            }
        },
        handler: async (args: { path: string; pattern: string; recursive?: boolean }): Promise<ToolResponse> => {
            const dirPath = normalizePath(args.path);
            const pattern = new RegExp(args.pattern);
            const recursive = args.recursive !== false;

            const files = recursive
                ? await fs.readdir(dirPath, { recursive: true })
                : await fs.readdir(dirPath);

            const results = await Promise.all(
                files.map(async (file: string) => {
                    const fullPath = normalizePath(file);
                    try {
                        const stats = await fs.stat(fullPath);
                        if (!stats.isDirectory()) {
                            return analysis.searchInFile(fullPath, pattern);
                        }
                        return [];
                    } catch {
                        return [];
                    }
                })
            );

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(results.flat(), null, 2)
                }]
            };
        }
    },

    calculate_hash: {
        definition: {
            name: "calculate_hash",
            description: "Calculate file hash (MD5, SHA256, etc.)",
            inputSchema: {
                type: "object",
                properties: {
                    path: { type: "string", description: "Path of file to hash" },
                    algorithm: { type: "string", description: "Hash algorithm (md5, sha1, sha256, sha512)", default: "sha256" }
                },
                required: ["path"]
            }
        },
        handler: async (args: { path: string; algorithm?: string }): Promise<ToolResponse> => {
            const filePath = normalizePath(args.path);
            const algorithm = args.algorithm || 'sha256';

            const hash = await analysis.calculateHash(filePath, algorithm);
            const stats = await getFileStats(filePath);

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({ ...stats, hash }, null, 2)
                }]
            };
        }
    },

    analyze_text: {
        definition: {
            name: "analyze_text",
            description: "Analyze text file (lines, words, encoding)",
            inputSchema: {
                type: "object",
                properties: {
                    path: { type: "string", description: "Path of text file to analyze" }
                },
                required: ["path"]
            }
        },
        handler: async (args: { path: string }): Promise<ToolResponse> => {
            const filePath = normalizePath(args.path);
            const analysisResult = await analysis.analyzeTextFile(filePath);
            const stats = await getFileStats(filePath);

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({ ...stats, analysis: analysisResult }, null, 2)
                }]
            };
        }
    },

    find_duplicates: {
        definition: {
            name: "find_duplicates",
            description: "Find duplicate files in directory",
            inputSchema: {
                type: "object",
                properties: {
                    path: { type: "string", description: "Directory path to search for duplicates" }
                },
                required: ["path"]
            }
        },
        handler: async (args: { path: string }): Promise<ToolResponse> => {
            const dirPath = normalizePath(args.path);
            const duplicates = await analysis.findDuplicates(dirPath);

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(duplicates, null, 2)
                }]
            };
        }
    }
};
