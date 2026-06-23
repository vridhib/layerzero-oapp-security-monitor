import { ChevronDown, Download, File, FileJson, FileText } from "lucide-react";
import { useState } from "react";

/**
 * Dropdown component for downloading a report in different formats.
 *
 * Renders a button that toggles a dropdown menu with three options:
 * - JSON: Downloads the raw JSON report data.
 * - HTML: Downloads the HTML report as a `.html` file.
 * - PDF: Opens the PDF file in a new tab (or downloads, depending on browser).
 *
 * The dropdown closes automatically after a format is selected.
 *
 * @component
 * @param onDownload - Callback function that receives the selected format.
 * @returns The rendered download dropdown.
 *
 * @see {@link SecurityReports} for the parent page using this component.
 */
export function DownloadDropdown({ onDownload }: { onDownload: (format: 'json' | 'html' | 'pdf') => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-indigo-950"
      >
        <Download size={18} />
        <span>Download</span>
        <ChevronDown size={16} />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-indigo-800 border border-indigo-700 rounded-lg shadow-lg z-10">
          <button
            onClick={() => { onDownload('json'); setOpen(false); }}
            className="w-full text-left px-4 py-2 hover:bg-indigo-700/50 flex items-center gap-2 text-sm text-white"
          >
            <FileJson size={16} className="text-violet-400" />
            JSON
          </button>
          <button
            onClick={() => { onDownload('html'); setOpen(false); }}
            className="w-full text-left px-4 py-2 hover:bg-indigo-700/50 flex items-center gap-2 text-sm text-white"
          >
            <FileText size={16} className="text-violet-400" />
            HTML
          </button>
          <button
            onClick={() => { onDownload('pdf'); setOpen(false); }}
            className="w-full text-left px-4 py-2 hover:bg-indigo-700/50 flex items-center gap-2 text-sm text-white"
          >
            <File size={16} className="text-violet-400" />
            PDF
          </button>
        </div>
      )}
    </div>
  );
}
