// @ts-ignore
import type { Diagnostic } from '@parcel/diagnostic';
// @ts-ignore
import { prettyDiagnostic } from '@parcel/utils';
import { FileSystem } from "../../types";

export const prettyDiagnosticFn = prettyDiagnostic as (
  diagnostic: Diagnostic,
  options: { projectRoot: string; inputFS: FileSystem },
  maxWidth: number,
  format: 'html' | 'text',
) => Promise<{
  message: string;
  stack?: string;
  codeframe?: string;
  hints?: string[];
  documentation?: string;
}>;

export async function renderDiagnostics(
  inputFS: FileSystem,
  diagnostics: Array<Diagnostic>,
): Promise<string> {
  return (
    await Promise.all(
      diagnostics.map(async diagnostic => {
        let { message, stack, codeframe, hints, documentation } =
          await prettyDiagnosticFn(
            diagnostic,
            { projectRoot: '/', inputFS },
            80,
            'html',
          );
        let result = '';

        result += message;
        result += '\n\n';
        if (stack) {
          result += stack;
          result += '\n';
        }
        if (codeframe) {
          result += codeframe;
          result += '\n';
        }
        if (hints && hints.length > 0) {
          for (let h of hints) {
            result += h;
            result += '\n';
          }
        }
        if (documentation) {
          result += documentation;
          result += '\n';
        }

        return result;
      }),
    )
  ).join(`\n${'-'.repeat(80)}\n\n`);
}
