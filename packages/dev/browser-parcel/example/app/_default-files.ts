export const defaultFiles = [
  {
    id: 'index.html',
    name: 'index.html',
    conten: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Parcel React App</title>
  <link href="./styles.css" type="text/css" rel="stylesheet">
</head>
<body>
  <div id="root"></div>
  <script src="./index.js"></script>
</body>
</html>`,
      type: 'html'
    },
    {
      isEntry: true,
      id: 'index.js',
      name: 'index.js',
      content: `import './styles.css';

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.js';

const root = createRoot(document.getElementById('root'));
root.render(<App />);`,
      type: 'javascript'
    },
    {
      id: 'App.js',
      name: 'App.js',
      content: `import React, { useState } from 'react';
import Button from './components/Button.js';
import Counter from './components/Counter.js';

function App() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold text-blue-600 mb-4">
        Parcel + React + Tailwind
      </h1>
      <p className="text-gray-700 mb-6">
        Edit files to see changes in real-time
      </p>
      <div className="space-y-4">
        <Button />
        <Counter />
      </div>
    </div>
  );
}

export default App;`,
      type: 'javascript'
    },
    {
      id: 'components/Button.js',
      name: 'components/Button.js',
      content: `import React from 'react';

function Button() {
  return (
    <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition">
      Click me
    </button>
  );
}

export default Button;`,
      type: 'javascript'
    },
    {
      id: 'components/Counter.js',
      name: 'components/Counter.js',
      content: `import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex flex-col items-center p-4 bg-white rounded shadow">
      <p className="text-lg font-semibold mb-2">Count: {count}</p>
      <div className="flex space-x-2">
        <button
          onClick={() => setCount(count - 1)}
          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Decrease
        </button>
        <button
          onClick={() => setCount(count + 1)}
          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Increase
        </button>
      </div>
    </div>
  );
}

export default Counter;`,
      type: 'javascript'
    },
    {
      id: 'styles.css',
      name: 'styles.css',
      content: `/* Base Tailwind directives */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom styles */
body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}`,
      type: 'css'
    },
    {
      id: 'package.json',
      name: 'package.json',
      content: JSON.stringify({
        "name": "parcel-react-app",
        "version": "1.0.0",
        "description": "A simple React app bundled with Parcel",
        "main": "index.js",
        "scripts": {
          "start": "parcel index.html",
          "build": "parcel build index.html"
        },
        "dependencies": {
          "react": "^19.0.0",
          "react-dom": "^19.0.0",
          // "tailwindcss": "^4.1.0",
          // "@tailwindcss/postcss": "^4.1.0"
        }
      }, null, 2),
      type: 'json'
    },
    {
      id: 'postcss.config.js',
      name: 'postcss.config.js',
      content: `module.exports = {
  plugins: {
    "@tailwindcss/postcss": {}
  },
};`,
      type: 'javascript'
    }
  ];

  export type FilesList = typeof defaultFiles;
  export type FileType = FilesList[number];