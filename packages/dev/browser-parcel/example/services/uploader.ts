import { MessageTarget } from "./message-target";

export async function uploadFiles(options: {
  projectId: string;
  files: Record<string, string>;
}) {
  const sw = await MessageTarget.fromServiceWorker();

  const uploadFinishPromise = new Promise<void>((resolve) => {
    const handler = (event: any) => {
      console.log('from SW', event);

      if (event.data?.type === 'UPLOAD_COMPLETE') {
        sw?.removeEventListener('message', handler);
        resolve();
      }
    };

    sw?.addEventListener('message', handler);
    setTimeout(resolve, 10_000);
  });

  await sw?.postMessage({
    type: 'UPLOAD_FILES',
    payload: {
      projectId: options.projectId,
      files: options.files,
    }
  });

  await uploadFinishPromise
}