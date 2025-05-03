import type { Diagnostic } from '@parcel/diagnostic';
import { FileSystem } from "../types";
export declare const prettyDiagnosticFn: (diagnostic: Diagnostic, options: {
    projectRoot: string;
    inputFS: FileSystem;
}, maxWidth: number, format: 'html' | 'text') => Promise<{
    message: string;
    stack?: string;
    codeframe?: string;
    hints?: string[];
    documentation?: string;
}>;
export declare function renderDiagnostics(inputFS: FileSystem, diagnostics: Array<Diagnostic>): Promise<string>;
