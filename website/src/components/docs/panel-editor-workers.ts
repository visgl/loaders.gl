/** Configures Monaco workers at the application boundary so the bundler can emit their URLs. */
export function configurePanelEditorWorkers(): void {
  const runtime = globalThis as typeof globalThis & {
    /** Worker factory shared by the panels module's lazy Monaco runtime. */
    MonacoEnvironment?: {getWorker: (workerId: string, label: string) => Worker};
  };
  if (runtime.MonacoEnvironment) return;
  runtime.MonacoEnvironment = {
    getWorker: (_workerId, label) =>
      label === 'json'
        ? new Worker(
            new URL('monaco-editor/esm/vs/language/json/json.worker.js', import.meta.url),
            {type: 'module'}
          )
        : new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url), {
            type: 'module'
          })
  };
}
