// Die @fontsource-Pakete mappen `./*` auf `./*.css` – Import daher ohne
// Endung (z. B. '@fontsource/atkinson-hyperlegible/700'), was tsc sonst nicht
// auflöst.
declare module '@fontsource/*'
