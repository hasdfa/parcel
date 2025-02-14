import type {PackageJSON, REPLOptions} from '../../types/library';
import defaultsDeep from 'lodash/defaultsDeep';

export type {REPLOptions, PackageJSON};

export function getDefaultTargetEnv(type: REPLOptions['targetType']): string {
  switch (type) {
    case 'node':
      return '12';
    case 'browsers':
      return 'since 2019';
    default:
      throw new Error(`Missing default target env for ${type}`);
  }
}

export function generatePackageJson(
  options: REPLOptions,
  overrides: Partial<PackageJSON> = {},
): string {
  let app: Record<string, unknown> = {};
  if (options.outputFormat) {
    app.outputFormat = options.outputFormat;
  }

  let pkg: PackageJSON = defaultsDeep(
    {},
    {
      name: 'repl',
      version: '0.0.0',
      engines: {
        ...(options.targetType && {
          [options.targetType]:
            options.targetEnv || getDefaultTargetEnv(options.targetType),
        }),
      },
      targets: {app},
      dependencies: Object.fromEntries(
        Object.entries(options.dependencies || {})
          .filter(([a, b]) => a && b)
          .sort(([a], [b]) => a.localeCompare(b)),
      ),
    },
    overrides,
  );

  return JSON.stringify(pkg, null, 2);
}
