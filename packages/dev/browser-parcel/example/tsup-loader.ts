export default function webpackTsupLoader(source: string) {
  console.log('webpackTsupLoader::source', source)
  return `export default ${JSON.stringify(source)}`;
}
