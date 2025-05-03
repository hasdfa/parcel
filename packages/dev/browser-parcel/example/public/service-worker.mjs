// Store for uploaded files
const fileStore = new Map();

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  console.log('to SW', event.data);

  if (event.data.type === 'UPLOAD_FILES') {
    const { projectId, files } = event.data.payload;

    // Store files in memory
    fileStore.set(projectId, files);

    // Send confirmation back to main thread
    event.source.postMessage({
      type: 'UPLOAD_COMPLETE',
      projectId
    });
  }
});

// Handle fetch events
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Check if the request matches our pattern
  if (url.pathname.startsWith('/__build/')) {
    const pathParts = url.pathname.split('/');
    const projectId = pathParts[2];
    const filePath = pathParts.slice(3).join('/');

    // Get the project's files
    const projectFiles = fileStore.get(projectId);

    if (projectFiles && projectFiles[filePath]) {
      // Create a response with the file content
      const response = new Response(projectFiles[filePath], {
        headers: {
          'Content-Type': getContentType(filePath)
        }
      });

      event.respondWith(response);
    } else {
      // File not found
      event.respondWith(new Response('Not Found', { status: 404 }));
    }
  }
});

// Helper function to determine content type based on file extension
function getContentType(filePath) {
  const extension = filePath.split('.').pop().toLowerCase();
  const contentTypes = {
    'js': 'application/javascript',
    'css': 'text/css',
    'html': 'text/html',
    'json': 'application/json',
    'txt': 'text/plain',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml'
  };

  return contentTypes[extension] || 'application/octet-stream';
}
