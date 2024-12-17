# Filesystem MCP Server

A comprehensive Model Context Protocol (MCP) server that provides advanced file system operations, file analysis, and compression tools.

## Features

- **File Operations**
  - List directory contents with detailed metadata
  - Create, delete, move, and copy files/directories
  - Read and write files with encoding support
  - Batch operations on multiple files
  - Automatic parent directory creation

- **Search & Analysis**
  - Search files for text/regex patterns with context
  - Text file analysis (lines, words, characters)
  - File encoding detection
  - MIME type identification
  - File integrity verification (hashing)
  - Find duplicate files

- **Compression**
  - Create zip archives
  - Extract zip archives
  - Recursive directory compression

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd filesystem-server
```

2. Install dependencies:

```bash
npm install
```

3. Build the server:

```bash
npm run build
```

4. Add to MCP settings (cline_mcp_settings.json):

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "node",
      "args": ["path/to/filesystem-server/build/index.js"]
    }
  }
}
```

## Tools Reference

### Directory Operations

#### list_directory

List contents of a directory with detailed metadata.

```typescript
{
  name: "list_directory",
  arguments: {
    path: string,       // Directory path to list
    recursive?: boolean // List recursively (default: false)
  }
}
```

Example:

```typescript
{
  "path": "/path/to/directory",
  "recursive": true
}
```

#### create_directory

Create a new directory.

```typescript
{
  name: "create_directory",
  arguments: {
    path: string,       // Path of directory to create
    recursive?: boolean // Create parent directories (default: true)
  }
}
```

### File Operations

#### read_file

Read the contents of a file.

```typescript
{
  name: "read_file",
  arguments: {
    path: string,     // Path of file to read
    encoding?: string // File encoding (default: utf8)
  }
}
```

#### write_file

Write content to a file (creates or overwrites).

```typescript
{
  name: "write_file",
  arguments: {
    path: string,            // Path of file to write
    content: string,         // Content to write
    encoding?: string,       // File encoding (default: utf8)
    createParentDirs?: boolean // Create parent directories (default: true)
  }
}
```

#### append_file

Append content to a file.

```typescript
{
  name: "append_file",
  arguments: {
    path: string,            // Path of file to append to
    content: string,         // Content to append
    encoding?: string,       // File encoding (default: utf8)
    createParentDirs?: boolean // Create parent directories (default: true)
  }
}
```

### Search & Analysis

#### search_in_files

Search for text/regex pattern in files.

```typescript
{
  name: "search_in_files",
  arguments: {
    path: string,       // Directory path to search in
    pattern: string,    // Regular expression pattern
    recursive?: boolean // Search recursively (default: true)
  }
}
```

Example response:

```json
[
  {
    "file": "/path/to/file.txt",
    "line": 42,
    "content": "matching line content",
    "match": "matched text"
  }
]
```

#### analyze_text

Analyze text file statistics.

```typescript
{
  name: "analyze_text",
  arguments: {
    path: string // Path of text file to analyze
  }
}
```

Example response:

```json
{
  "analysis": {
    "lineCount": 100,
    "wordCount": 500,
    "charCount": 2500,
    "encoding": "UTF-8",
    "mimeType": "text/plain"
  }
}
```

#### calculate_hash

Calculate file hash for integrity verification.

```typescript
{
  name: "calculate_hash",
  arguments: {
    path: string,      // Path of file to hash
    algorithm?: string // Hash algorithm (default: sha256)
  }
}
```

Supported algorithms: md5, sha1, sha256, sha512

#### find_duplicates

Find duplicate files in directory based on content hash.

```typescript
{
  name: "find_duplicates",
  arguments: {
    path: string // Directory path to search for duplicates
  }
}
```

Example response:

```json
[
  {
    "hash": "abc123...",
    "size": 1024,
    "files": [
      "/path/to/file1.txt",
      "/path/to/file2.txt"
    ]
  }
]
```

### Compression

#### create_zip

Create zip archive from files.

```typescript
{
  name: "create_zip",
  arguments: {
    files: string[],  // Array of file paths to include
    output: string    // Output zip file path
  }
}
```

#### extract_zip

Extract zip archive.

```typescript
{
  name: "extract_zip",
  arguments: {
    path: string,   // Path to zip file
    output: string  // Output directory path
  }
}
```

## Error Handling

The server uses the MCP error system to provide detailed error information:

- **InvalidRequest**: Invalid parameters or unsupported operations
  - Missing required parameters
  - Invalid file paths
  - Unsupported operations (e.g., reading a directory as file)

- **MethodNotFound**: Unknown tool name

- **InternalError**: File system errors
  - Permission denied
  - File not found
  - Disk full
  - I/O errors

Example error response:

```json
{
  "code": "InvalidRequest",
  "message": "Cannot read directory as file: /path/to/dir"
}
```

## Development

Run in watch mode for development:

```bash
npm run watch
```

Run MCP inspector for testing:

```bash
npm run inspector
```

## Dependencies

- @modelcontextprotocol/sdk: MCP server implementation
- file-type: File type detection
- mime-types: MIME type lookup
- crypto-js: File hashing
- archiver: ZIP file creation
- extract-zip: ZIP file extraction
- iconv-lite: Text encoding conversion
- chardet: Character encoding detection

## License

MIT
