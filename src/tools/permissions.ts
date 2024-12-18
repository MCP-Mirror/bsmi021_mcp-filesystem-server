import { ToolCategory, ToolResponse } from './types.js';
import { normalizePath, getFileStats } from '../utils.js';
import * as permissions from '../operations/permissions.js';

/**
 * Permission tools for file permission operations
 */
export const permissionTools: ToolCategory = {
    get_permissions: {
        definition: {
            name: "get_permissions",
            description: "Get file permissions",
            inputSchema: {
                type: "object",
                properties: {
                    path: { type: "string", description: "Path to file" }
                },
                required: ["path"]
            }
        },
        handler: async (args: { path: string }): Promise<ToolResponse> => {
            const filePath = normalizePath(args.path);
            const perms = await permissions.getPermissions(filePath);

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(perms, null, 2)
                }]
            };
        }
    },

    set_permissions: {
        definition: {
            name: "set_permissions",
            description: "Set file permissions",
            inputSchema: {
                type: "object",
                properties: {
                    path: { type: "string", description: "Path to file" },
                    permissions: {
                        type: "object",
                        properties: {
                            owner: {
                                type: "object",
                                properties: {
                                    read: { type: "boolean" },
                                    write: { type: "boolean" },
                                    execute: { type: "boolean" }
                                }
                            },
                            group: {
                                type: "object",
                                properties: {
                                    read: { type: "boolean" },
                                    write: { type: "boolean" },
                                    execute: { type: "boolean" }
                                }
                            },
                            others: {
                                type: "object",
                                properties: {
                                    read: { type: "boolean" },
                                    write: { type: "boolean" },
                                    execute: { type: "boolean" }
                                }
                            }
                        }
                    }
                },
                required: ["path", "permissions"]
            }
        },
        handler: async (args: { path: string; permissions: permissions.FilePermissions }): Promise<ToolResponse> => {
            const filePath = normalizePath(args.path);

            await permissions.setPermissions(filePath, args.permissions);
            const newPerms = await permissions.getPermissions(filePath);

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(newPerms, null, 2)
                }]
            };
        }
    },

    make_executable: {
        definition: {
            name: "make_executable",
            description: "Make file executable",
            inputSchema: {
                type: "object",
                properties: {
                    path: { type: "string", description: "Path to file" }
                },
                required: ["path"]
            }
        },
        handler: async (args: { path: string }): Promise<ToolResponse> => {
            const filePath = normalizePath(args.path);

            await permissions.makeExecutable(filePath);
            const perms = await permissions.getPermissions(filePath);

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(perms, null, 2)
                }]
            };
        }
    }
};
