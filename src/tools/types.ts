import { Tool } from "@modelcontextprotocol/sdk/types.js";

/**
 * Interface for tool handler response content item
 */
export interface ToolResponseContent {
    type: string;
    text: string;
}

/**
 * Interface for tool handler response
 */
export interface ToolResponse {
    content: ToolResponseContent[];
    isError?: boolean;
    _meta?: Record<string, unknown>;
}

/**
 * Interface for tool handler function
 */
export type ToolHandler = (args: any) => Promise<ToolResponse>;

/**
 * Interface combining tool definition with its handler
 */
export interface ToolRegistration {
    definition: Tool;
    handler: ToolHandler;
}

/**
 * Type for tool category mapping
 */
export interface ToolCategory {
    [toolName: string]: ToolRegistration;
}

/**
 * Interface for tool arguments
 */
export interface ToolArguments {
    [key: string]: unknown;
}

/**
 * Interface for MCP tool response
 */
export interface McpToolResponse {
    content: ToolResponseContent[];
    _meta?: Record<string, unknown>;
}
