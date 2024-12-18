import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { ToolCategory, ToolRegistration } from './types.js';
import { systemTools } from './system.js';
import { fileTools } from './files.js';
import { directoryTools } from './directories.js';
import { analysisTools } from './analysis.js';
import { compressionTools } from './compression.js';
import { monitoringTools } from './monitoring.js';
import { permissionTools } from './permissions.js';
import { metadataTools } from './metadata.js';
import { streamTools } from './streams.js';

/**
 * Registry class to manage all tool registrations
 */
export class ToolRegistry {
    private tools: Map<string, ToolRegistration>;

    constructor() {
        this.tools = new Map();
        this.registerToolCategory(systemTools);
        this.registerToolCategory(fileTools);
        this.registerToolCategory(directoryTools);
        this.registerToolCategory(analysisTools);
        this.registerToolCategory(compressionTools);
        this.registerToolCategory(monitoringTools);
        this.registerToolCategory(permissionTools);
        this.registerToolCategory(metadataTools);
        this.registerToolCategory(streamTools);
    }

    /**
     * Register a category of tools
     */
    private registerToolCategory(category: ToolCategory): void {
        for (const [name, registration] of Object.entries(category)) {
            if (this.tools.has(name)) {
                throw new Error(`Duplicate tool registration: ${name}`);
            }
            this.tools.set(name, registration);
        }
    }

    /**
     * Get all tool definitions
     */
    getToolDefinitions(): Tool[] {
        return Array.from(this.tools.values()).map(reg => reg.definition);
    }

    /**
     * Get a tool handler by name
     */
    getToolHandler(name: string) {
        const registration = this.tools.get(name);
        if (!registration) {
            throw new Error(`Tool not found: ${name}`);
        }
        return registration.handler;
    }

    /**
     * Check if a tool exists
     */
    hasTool(name: string): boolean {
        return this.tools.has(name);
    }
}

// Export singleton instance
export const toolRegistry = new ToolRegistry();
