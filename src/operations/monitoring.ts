import { watch } from 'fs';
import { EventEmitter } from 'events';
import path from 'path';

/**
 * Interface for file change event
 */
export interface FileChangeEvent {
    type: 'add' | 'change' | 'unlink';
    path: string;
    timestamp: Date;
}

/**
 * File watcher class to monitor directory changes
 */
export class FileWatcher extends EventEmitter {
    private watchers: Map<string, ReturnType<typeof watch>> = new Map();

    /**
     * Start watching a directory
     */
    async watchDirectory(dirPath: string, recursive: boolean = false): Promise<void> {
        if (this.watchers.has(dirPath)) {
            throw new Error(`Already watching directory: ${dirPath}`);
        }

        const watcher = watch(
            dirPath,
            { recursive },
            (eventType, filename) => {
                if (filename) {
                    const fullPath = path.join(dirPath, filename);
                    const event: FileChangeEvent = {
                        type: eventType === 'rename' ? 'unlink' : 'change',
                        path: fullPath,
                        timestamp: new Date()
                    };
                    this.emit('change', event);
                }
            }
        );

        this.watchers.set(dirPath, watcher);
    }

    /**
     * Stop watching a directory
     */
    async unwatchDirectory(dirPath: string): Promise<void> {
        const watcher = this.watchers.get(dirPath);
        if (watcher) {
            watcher.close();
            this.watchers.delete(dirPath);
        }
    }

    /**
     * Stop all watchers
     */
    async closeAll(): Promise<void> {
        for (const [dirPath] of this.watchers) {
            await this.unwatchDirectory(dirPath);
        }
    }
}
