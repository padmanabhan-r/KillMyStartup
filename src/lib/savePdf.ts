import type { jsPDF } from 'jspdf';

// jsPDF's save() builds a blob URL and clicks an <a download>. A browser turns
// that into a file on disk; the Android WebView has no download manager, so
// Capacitor hands the blob to the system as an intent and the user gets a share
// sheet instead of a file on their phone. On native we write the bytes ourselves.

type WriteFile = (options: {
  path: string;
  data: string;
  directory: string;
  recursive?: boolean;
}) => Promise<{ uri: string }>;

interface CapacitorBridge {
  isNativePlatform?: () => boolean;
  Plugins?: { Filesystem?: { writeFile: WriteFile } };
}

export type SaveResult =
  // Handed to the browser's own download machinery.
  | { kind: 'downloaded' }
  // Written to the device at a folder we can name for the user.
  | { kind: 'saved'; folder: string }
  // Running natively, but the native project has no Filesystem plugin to
  // write with. Reported rather than silently falling back to save(), which
  // is the share-sheet behaviour we are here to get rid of.
  | { kind: 'unavailable' };

const ANDROID_DOCUMENTS = 'DOCUMENTS';

function getBridge(): CapacitorBridge | undefined {
  return (window as unknown as { Capacitor?: CapacitorBridge }).Capacitor;
}

// The plugin is read off the global Capacitor bridge rather than imported, so
// the web build pulls in no Capacitor dependency and still compiles whether or
// not the native project has @capacitor/filesystem installed.
export async function savePdf(doc: jsPDF, filename: string): Promise<SaveResult> {
  const bridge = getBridge();

  if (!bridge?.isNativePlatform?.()) {
    doc.save(filename);
    return { kind: 'downloaded' };
  }

  const filesystem = bridge.Plugins?.Filesystem;
  if (!filesystem) return { kind: 'unavailable' };

  // writeFile wants bare base64; jsPDF hands back a full data URI.
  const dataUri = doc.output('datauristring');
  const marker = 'base64,';
  const at = dataUri.indexOf(marker);
  if (at === -1) return { kind: 'unavailable' };

  await filesystem.writeFile({
    path: filename,
    data: dataUri.slice(at + marker.length),
    directory: ANDROID_DOCUMENTS,
    recursive: true,
  });

  return { kind: 'saved', folder: 'Documents' };
}
