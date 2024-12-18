# Filesystem MCP Server

A comprehensive Model Context Protocol (MCP) server that provides advanced file system operations, file analysis, and compression tools with enterprise-grade security and performance features.

## Features

- **File Operations**
  - List directory contents with detailed metadata
  - Create, delete, move, and copy files/directories
  - Read and write files with encoding support
  - Batch operations on multiple files
  - Automatic parent directory creation
  - Secure file handling with access controls

- **Search & Analysis**
  - Search files for text/regex patterns with context
  - Text file analysis (lines, words, characters)
  - File encoding detection
  - MIME type identification
  - File integrity verification (hashing)
  - Find duplicate files
  - Performance optimized for large directories

- **Compression**
  - Create zip archives with configurable compression levels
  - Extract zip archives with security validation
  - Recursive directory compression
  - Streaming support for large files

- **Security**
  - Path traversal protection
  - File access controls
  - Resource usage limits
  - Input validation
  - Secure error handling

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

4. Configure server settings (config/server.json):

```json
{
  "security": {
    "maxFileSize": 104857600,        // 100MB
    "allowedPaths": ["/data", "/tmp"],
    "blockedExtensions": [".exe", ".dll"],
    "enableAccessControl": true
  },
  "performance": {
    "maxConcurrentOperations": 10,
    "cacheSize": 1000,
    "streamingThreshold": 52428800   // 50MB
  },
  "monitoring": {
    "enableMetrics": true,
    "logLevel": "info",
    "metricsPort": 9090
  }
}
```

5. Add to MCP settings (cline_mcp_settings.json):

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "node",
      "args": ["path/to/filesystem-server/build/index.js"],
      "env": {
        "NODE_ENV": "production",
        "CONFIG_PATH": "path/to/config/server.json"
      }
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
    recursive?: boolean, // List recursively (default: false)
    includeHidden?: boolean, // Include hidden files (default: false)
    maxDepth?: number,  // Maximum recursion depth
    filter?: string     // File pattern filter
  }
}
```

Example:

```typescript
{
  "path": "/path/to/directory",
  "recursive": true,
  "maxDepth": 3,
  "filter": "*.{txt,md,json}"
}
```

#### create_directory

Create a new directory with secure permissions.

```typescript
{
  name: "create_directory",
  arguments: {
    path: string,       // Path of directory to create
    recursive?: boolean, // Create parent directories (default: true)
    mode?: number,      // Directory permissions (default: 0755)
    owner?: string      // Directory owner (if supported)
  }
}
```

### File Operations

#### read_file

Read the contents of a file with streaming support.

```typescript
{
  name: "read_file",
  arguments: {
    path: string,     // Path of file to read
    encoding?: string, // File encoding (default: utf8)
    start?: number,   // Start byte position
    end?: number,     // End byte position
    stream?: boolean  // Use streaming for large files
  }
}
```

#### write_file

Write content to a file with atomic operations.

```typescript
{
  name: "write_file",
  arguments: {
    path: string,            // Path of file to write
    content: string,         // Content to write
    encoding?: string,       // File encoding (default: utf8)
    createParentDirs?: boolean, // Create parent directories (default: true)
    mode?: number,          // File permissions (default: 0644)
    atomic?: boolean        // Use atomic write (default: true)
  }
}
```

#### append_file

Append content to a file with locking.

```typescript
{
  name: "append_file",
  arguments: {
    path: string,            // Path of file to append to
    content: string,         // Content to append
    encoding?: string,       // File encoding (default: utf8)
    createParentDirs?: boolean, // Create parent directories (default: true)
    lockFile?: boolean       // Use file locking (default: true)
  }
}
```

### Search & Analysis

#### search_in_files

Search for text/regex pattern in files with performance optimizations.

```typescript
{
  name: "search_in_files",
  arguments: {
    path: string,       // Directory path to search in
    pattern: string,    // Regular expression pattern
    recursive?: boolean, // Search recursively (default: true)
    maxResults?: number, // Maximum results to return
    contextLines?: number, // Lines of context around matches
    ignoreCase?: boolean  // Case-insensitive search
  }
}
```

Example response:

```json
{
  "results": [
    {
      "file": "/path/to/file.txt",
      "line": 42,
      "content": "matching line content",
      "match": "matched text",
      "context": {
        "before": ["line 40", "line 41"],
        "after": ["line 43", "line 44"]
      }
    }
  ],
  "metadata": {
    "totalMatches": 5,
    "filesScanned": 100,
    "timeElapsed": "1.2s"
  }
}
```

#### analyze_text

Comprehensive text file analysis with encoding detection.

```typescript
{
  name: "analyze_text",
  arguments: {
    path: string, // Path of text file to analyze
    advanced?: boolean // Enable advanced analysis
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
    "mimeType": "text/plain",
    "advanced": {
      "averageLineLength": 25,
      "longestLine": 80,
      "whitespacePercentage": 15.5,
      "uniqueWords": 300
    }
  }
}
```

#### calculate_hash

Calculate file hash with progress reporting.

```typescript
{
  name: "calculate_hash",
  arguments: {
    path: string,      // Path of file to hash
    algorithm?: string, // Hash algorithm (default: sha256)
    progress?: boolean // Enable progress reporting
  }
}
```

Supported algorithms: md5, sha1, sha256, sha512

#### find_duplicates

Find duplicate files with optimization options.

```typescript
{
  name: "find_duplicates",
  arguments: {
    path: string, // Directory path to search for duplicates
    minSize?: number, // Minimum file size to consider
    quickScan?: boolean, // Use size-only comparison first
    hashAlgorithm?: string // Hash algorithm for comparison
  }
}
```

Example response:

```json
{
  "duplicates": [
    {
      "hash": "abc123...",
      "size": 1024,
      "files": [
        "/path/to/file1.txt",
        "/path/to/file2.txt"
      ]
    }
  ],
  "statistics": {
    "totalFiles": 1000,
    "duplicateGroups": 5,
    "wastedSpace": "10.5MB"
  }
}
```

### Compression

#### create_zip

Create optimized zip archives with progress reporting.

```typescript
{
  name: "create_zip",
  arguments: {
    files: string[],    // Array of file paths to include
    output: string,     // Output zip file path
    level?: number,     // Compression level (0-9)
    password?: string,  // Optional encryption
    progress?: boolean  // Enable progress reporting
  }
}
```

#### extract_zip

Extract zip archives with security validation.

```typescript
{
  name: "extract_zip",
  arguments: {
    path: string,    // Path to zip file
    output: string,  // Output directory path
    validate?: boolean, // Validate contents before extraction
    preservePermissions?: boolean // Keep original permissions
  }
}
```

## Security Considerations

### Path Safety
- All paths are normalized and validated
- Prevents directory traversal attacks
- Blocks access to sensitive system directories
- Validates file extensions

### Resource Protection
- File size limits
- Concurrent operation limits
- Rate limiting for intensive operations
- Memory usage monitoring

### Access Control
- Optional file permission enforcement
- Owner/group validation
- Operation auditing
- Secure temporary file handling

## Performance Optimization

### File Operations
- Streaming for large files
- Buffered I/O for small files
- Operation batching
- Cache frequently accessed metadata

### Search Operations
- Worker thread pool
- Incremental result streaming
- Early termination options
- Memory-efficient algorithms

### Compression
- Parallel compression
- Adaptive buffer sizes
- Progress reporting
- Cancelable operations

## Monitoring and Debugging

### Metrics
- Operation latency
- Resource usage
- Error rates
- Cache hit rates

### Logging
- Structured JSON logs
- Log levels configuration
- Operation correlation IDs
- Error context capture

### Debugging
- Debug mode with detailed logs
- Operation tracing
- Memory profiling
- Performance analysis tools

## Error Handling

The server implements comprehensive error handling:

### Operation Errors
```typescript
interface OperationError {
  code: string;        // Error code
  message: string;     // Human-readable message
  details?: {          // Additional context
    path: string;      // Affected path
    operation: string; // Attempted operation
    reason: string;    // Failure reason
  };
  stack?: string;      // Stack trace (debug mode)
}
```

### Error Categories
- **InvalidRequest**: Invalid parameters or unsupported operations
  - Missing required parameters
  - Invalid file paths
  - Unsupported operations
  - Permission violations

- **MethodNotFound**: Unknown tool name

- **SecurityError**: Security violations
  - Path traversal attempts
  - Permission denied
  - Resource limits exceeded

- **InternalError**: File system errors
  - Permission denied
  - File not found
  - Disk full
  - I/O errors

Example error response:

```json
{
  "code": "SecurityError",
  "message": "Access denied: operation not permitted on path",
  "details": {
    "path": "/protected/file.txt",
    "operation": "write_file",
    "reason": "path not in allowed paths list"
  }
}
```

## Development

### Setup Development Environment

```bash
# Install dependencies with exact versions
npm ci

# Setup pre-commit hooks
npm run prepare

# Generate TypeScript types
npm run codegen
```

### Development Mode

```bash
# Run in watch mode with hot reload
npm run watch

# Run with debug logging
DEBUG=filesystem-server:* npm run watch
```

### Testing

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- --grep "file operations"

# Run tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

### Debugging

```bash
# Run MCP inspector
npm run inspector

# Enable debug logging
DEBUG=filesystem-server:* npm start

# Run with Node inspector
node --inspect build/index.js
```

### Code Quality

```bash
# Run linter
npm run lint

# Run type checker
npm run type-check

# Run security audit
npm audit

# Generate documentation
npm run docs
```

## API Documentation

Full API documentation is available in the `docs` directory:

- [API Reference](docs/api.md)
- [Security Guide](docs/security.md)
- [Performance Tuning](docs/performance.md)
- [Error Codes](docs/errors.md)
- [Configuration Guide](docs/configuration.md)

## Dependencies

Core dependencies:
- @modelcontextprotocol/sdk: MCP server implementation
- file-type: File type detection
- mime-types: MIME type lookup
- crypto-js: File hashing
- archiver: ZIP file creation
- extract-zip: ZIP file extraction
- iconv-lite: Text encoding conversion
- chardet: Character encoding detection

Development dependencies:
- typescript: Type checking and compilation
- jest: Testing framework
- eslint: Code linting
- prettier: Code formatting
- husky: Git hooks
- ts-node: TypeScript execution
- nodemon: Development server
- nyc: Code coverage

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## License

MIT - See [LICENSE](LICENSE) for details.
