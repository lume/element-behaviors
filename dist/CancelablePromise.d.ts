export declare const _: (obj: object) => any;
export interface CancelablePromiseOptions {
    rejectOnCancel?: boolean;
}
export declare class PromiseCancellation extends Error {
}
export declare class CancelablePromise<T> extends Promise<T> {
    canceled: boolean;
    constructor(executor: Promise<T> | ((resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void), options: CancelablePromiseOptions);
    cancel(): void;
}
//# sourceMappingURL=CancelablePromise.d.ts.map