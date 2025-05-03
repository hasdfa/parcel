import type { ProjectFiles } from '../services/file-system-manager';

const indexTSX = `import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { StyledEngineProvider } from '@mui/material/styles';
import Demo from './Demo';

ReactDOM.createRoot(document.querySelector("#root")!).render(
  <React.StrictMode>
    <StyledEngineProvider injectFirst>
      <Demo />
    </StyledEngineProvider>
  </React.StrictMode>
);
`

const demoTSX = `import * as React from 'react';
import { DataGridPro } from '@mui/x-data-grid-pro';
import { useDemoData } from '@mui/x-data-grid-generator';

export default function PaginationCommunityNoSnap() {
  const { data, loading } = useDemoData({
    dataSet: 'Commodity',
    rowLength: 500,
    maxColumns: 6,
  });

  return (
    <div style={{ height: 300, width: '100%' }}>
      <DataGridPro {...data} loading={loading} />
    </div>
  );
}
`

const packageJSON = JSON.stringify({
  "name": "mui-demo",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "latest",
    "@mui/material": "latest",
    "@mui/x-data-grid-pro": "latest",
    "@mui/x-data-grid-generator": "latest",
    "react-dom": "latest",
    "@emotion/react": "latest",
    "@emotion/styled": "latest",
    "@mui/icons-material": "latest",
    // "typescript": "latest"
  },
  // "devDependencies": {
  //   "@vitejs/plugin-react": "latest",
  //   "vite": "latest",
  //   "@types/react": "latest",
  //   "@types/react-dom": "latest"
  // }
}, null, 2);

const tsconfigJSON = JSON.stringify({
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}, null, 2);

const tsconfigNodeJSON = JSON.stringify({
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}, null, 2);

const indexHTML = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>FlexGrid demo — MUI X</title>
    <meta name="viewport" content="initial-scale=1, width=device-width" />
    <!-- Fonts to support Material Design -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap"
    />
    <!-- Icons to support Material Design -->
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/icon?family=Material+Icons"
    />
    <link rel="stylesheet" href="./src/index.css">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./src/index.js"></script>
  </body>
</html>
`

export const defaultFiles: ProjectFiles = {
  'index.html': {
    contents: indexHTML,
    jsEntry: true,
  },
  'src/index.tsx': {
    contents: indexTSX,
    jsEntry: true,
  },
  'src/Demo.tsx': {
    contents: demoTSX,
  },
  'package.json': {
    contents: packageJSON,
  },
  'tsconfig.json': {
    contents: tsconfigJSON,
  },
  'tsconfig.node.json': {
    contents: tsconfigNodeJSON,
  },
}
