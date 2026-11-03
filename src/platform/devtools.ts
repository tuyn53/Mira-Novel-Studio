// Vue Devtools probes localStorage during import; Mira's opaque-origin iframe forbids it.
// Disable only the optional inspector bridge, keeping application state in Pinia.
export const setupDevtoolsPlugin = () => undefined
