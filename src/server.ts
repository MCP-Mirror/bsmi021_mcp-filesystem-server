import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    ErrorCode,
    McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { toolRegistry, McpToolResponse, closeAllWatchers } from './tools/index.js';

/**
 * Create an MCP server with tools for file system operations
 */
export const server = new Server(
    {
        name: "my-filesystem-server",
        version: "0.1.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

/**
 * Handler that lists available tools for file system operations
 */
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: toolRegistry.getToolDefinitions()
}));

/**
 * Handler for file system operation tools
 */
server.setRequestHandler(CallToolRequestSchema, async (request): Promise<McpToolResponse> => {
    try {
        if (!toolRegistry.hasTool(request.params.name)) {
            throw new McpError(
                ErrorCode.MethodNotFound,
                `Unknown tool: ${request.params.name}`
            );
        }

        const handler = toolRegistry.getToolHandler(request.params.name);
        const response = await handler(request.params.arguments || {});

        // Convert ToolResponse to McpToolResponse
        return {
            content: response.content,
            _meta: response._meta
        };
    } catch (error: any) {
        if (error instanceof McpError) {
            throw error;
        }
        throw new McpError(
            ErrorCode.InternalError,
            `File system error: ${error.message}`
        );
    }
});

// Clean up file watchers when server closes
server.onclose = async () => {
    await closeAllWatchers();
};
