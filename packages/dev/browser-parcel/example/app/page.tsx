export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="space-y-4 text-left">
        <h1 className="text-2xl font-bold mb-8">Build Tools</h1>
        <ul className="space-y-4">
          <li>
            <a
              href="/esbuild"
              className="text-blue-600 hover:text-blue-800 hover:underline"
              rel="noopener noreferrer"
            >
              esbuild
            </a>
          </li>
          <li>
            <a
              href="/parcel"
              className="text-blue-600 hover:text-blue-800 hover:underline"
              rel="noopener noreferrer"
            >
              ParcelJS
            </a>
          </li>
        </ul>
      </div>
    </main>
  );
}
