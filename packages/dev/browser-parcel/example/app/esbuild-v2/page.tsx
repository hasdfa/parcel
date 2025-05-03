'use client';

import React, { useState } from 'react';
import { X, Plus, Play } from 'lucide-react';
// import { defaultFiles } from '../_default-files';
import { defaultFiles } from '../_3_example_files';
import type { EsbuildWorker } from '../../../../browser-esbuild/dist/index.js';
import { uploadFiles } from '@/services/uploader';

const PROJECT_ID = 'esbuildv2';

const MultiFileCodeEditor = ({ worker }: { worker: EsbuildWorker }) => {
  const fs = worker.fs;

  // Default files setup
  const [activeFileId, setActiveFileId] = useState(Object.keys(defaultFiles)[0]);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isCompiling, setIsCompiling] = useState(false);

  // Get the active file
  const activeFile = fs.readFile(activeFileId);

  React.useEffect(() => {
    navigator.serviceWorker?.register('/service-worker.mjs');
  }, []);

  // Add a new file
  const addNewFile = () => {
    const newFileName = prompt('Enter file name:');
    if (!newFileName) return;
    const newFilePath = `/${newFileName}`;

    if (fs.exists(newFilePath)) {
      alert('A file with this name already exists.');
      return;
    }

    const fileType = newFileName.endsWith('.js') || newFileName.endsWith('.jsx') ? 'javascript' : 'text';
    fs.writeFile(newFilePath,
      fileType === 'javascript'
        ? `import React from 'react';\n\nfunction ${newFileName.split('.')[0]}() {\n  return (\n    <div>\n      {/* Your code here */}\n    </div>\n  );\n}\n\nexport default ${newFileName.split('.')[0]};`
        : '',
    );

    setActiveFileId(newFilePath);
  };

  // Function to compile the code
  const compileCode = React.useCallback(async () => {
    setIsCompiling(true);
    setError('');

    try {
      // Install dependencies
      await worker.npm__install({
        registryBaseUrl: 'https://npm-packages-cdn.onrender.com',
        cwd: '/',
      });

      // const tryResolve = async (spec: string) => {
      //   const resolved = await esbuild__resolvePackage(spec);
      //   console.log(`resolved:\n\t${spec}\n\t\t=>\n\t${resolved}`);
      //   return resolved;
      // };

      // tryResolve('react');
      // tryResolve('react-dom');
      // tryResolve('@mui/material');
      // tryResolve('@mui/icons-material/Done');
      // tryResolve('clsx');

      // return;

      // // Find the main file (App.js or index.js)
      console.log('fs.files', fs.files);
      const result = await worker.esbuild__bundle({
        entryPoints: Object.entries(fs.files).filter(([path, file]) => file.jsEntry).map(([path]) => path),
      }, {});

      if (result.outputFiles_) {
        await uploadFiles({
          projectId: PROJECT_ID,
          files: result.outputFiles_.reduce<Record<string, string>>((acc, it) => {
            acc[it.path.replace(/^\//, '')] = it.contents as any;
            return acc;
          }, {}),
        });
      }

      console.log('result', result);

      setOutput(`${window.location.origin}/__build/${PROJECT_ID}/index.html`);
    } catch (err: any) {
      setError(err.message);
      setOutput('');
    } finally {
      setIsCompiling(false);
    }
  }, [fs, worker]);

  // Debounce the compilation
  // useEffect(() => {
  //   if (debounceTimeout) {
  //     clearTimeout(debounceTimeout);
  //   }

  //   const timeout = setTimeout(() => {
  //     compileCode(files);
  //   }, 1000);

  //   setDebounceTimeout(timeout);

  //   return () => {
  //     if (debounceTimeout) {
  //       clearTimeout(debounceTimeout);
  //     }
  //   };
  // }, [files, compileCode]);

  // Initial compilation
  // useEffect(() => {
  //   compileCode(files);
  // }, [compileCode, files]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-gray-800 text-white p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">ESBuild Web Bundler Demo</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => compileCode()}
              className="flex items-center px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            >
              <Play size={16} className="mr-1" /> Run
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Editor Panel */}
        <div className="w-1/2 flex flex-col">
          {/* File tabs */}
          <div className="bg-gray-700 text-white flex items-center overflow-x-auto">
            {fs.fileNames.map((fileId) => (
              <div
                key={fileId}
                className={`flex items-center px-3 py-2 cursor-pointer border-r border-gray-600 ${activeFileId === fileId ? 'bg-gray-800' : 'hover:bg-gray-600'}`}
                onClick={() => setActiveFileId(fileId)}
              >
                <span className="mr-2 text-sm whitespace-nowrap">{fileId.slice(5)}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    fs.deleteFile(fileId);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <button
              onClick={addNewFile}
              className="px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-600"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Code editor */}
          <textarea
            id={`code-editor-${activeFileId}`}
            key={`code-editor-${activeFileId}`}
            className="flex-1 p-4 font-mono text-sm border-0 w-full"
            defaultValue={activeFile}
            onChange={(e) => fs.writeFile(activeFileId, e.target.value)}
            spellCheck="false"
          />
        </div>

        {/* Preview Panel */}
        <div className="w-1/2 p-4 flex flex-col border-l border-gray-300">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Preview</h2>
            {/* {!bundler && <div className="text-sm text-gray-500">Loading bundler...</div>} */}
            {isCompiling && <div className="text-sm text-gray-500">Compiling...</div>}
          </div>

          <div className="flex-1 border border-gray-300 rounded overflow-auto bg-white p-4">
            {error ? (
              <div className="text-red-500 p-4">
                <p className="font-bold">Error:</p>
                <p>{error}</p>
              </div>
            ) : output ? (
              <iframe title="ESBuild Web Bundler Demo" src={output} className="w-full h-full" />
            ) : (
              <div className="text-gray-400 flex items-center justify-center h-full">
                No preview available
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="bg-gray-100 border-t border-gray-300 p-2 text-sm text-gray-600 flex justify-between items-center">
        <span>ESBuild Web Bundler demo</span>
        <span>Active file: {activeFileId.slice(5)}</span>
      </footer>
    </div>
  );
};

export default function Wrapper() {
  const [result, setResult] = useState<EsbuildWorker | null>(null);

  React.useEffect(() => {
    import('../../../../browser-esbuild/dist/index.js').then((m) => {
      console.log('m', m);

      return m.initWorker({
        esbuildVersion: '0.25.3',
        workerUrl: '/esbuild-browser/worker.js',
      }).then((worker) => {
        worker.fs.setFiles(defaultFiles);
        console.log('worker.fs.files', worker.fs.files);

        console.log('worker', worker);
        setResult(worker as any);
      });
    }).catch((err) => {
      console.error('Error initializing worker', err);
    });
  }, []);

  if (!result) {
    return <div>Loading...</div>;
  }

  return <MultiFileCodeEditor worker={result} />;
}
