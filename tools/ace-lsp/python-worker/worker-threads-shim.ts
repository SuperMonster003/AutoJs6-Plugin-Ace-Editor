export const isMainThread = true;
export const workerData = undefined;
export const parentPort = undefined;
export const threadId = 0;

export class Worker {
    constructor() {
        throw new Error('Nested workers are unavailable in the AutoJs6 Pyright worker');
    }
}

export class MessageChannel {
    constructor() {
        throw new Error('Worker message channels are unavailable');
    }
}
