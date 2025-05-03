import { IPCInitOptions } from "./ipc";
interface Value {
    ready: boolean;
    reload: IPCInitOptions;
    status: string;
}
export declare const emitter: {
    ready: Value["ready"];
    reload: Value["reload"];
    status: Value["status"];
    on: <Ev extends keyof Value>(event: Ev, callback: (value: Value[Ev]) => void) => void;
};
export {};
