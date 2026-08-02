import React, { useState, useEffect } from 'react';
import {
  Code,
  Download,
  Copy,
  Check,
  FileCode,
  FolderArchive,
  Terminal,
  Shield,
  ExternalLink,
  CheckCircle,
  RefreshCw,
  Sparkles,
  Layers,
  Layout
} from 'lucide-react';
import { MalikApp } from '../types';
import { Card } from './ui';

interface SdkFilesTabProps {
  app: MalikApp | null;
}

interface SdkFile {
  fileName: string;
  path: string;
  content: string;
}

export const SdkFilesTab: React.FC<SdkFilesTabProps> = ({ app }) => {
  const [files, setFiles] = useState<SdkFile[]>([]);
  const [selectedFileName, setSelectedFileName] = useState<string>('MalikAuthClient.cs');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const fetchSdkFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/sdk/csharp-files');
      const data = await res.json();
      if (data.success && Array.isArray(data.files)) {
        setFiles(data.files);
        if (data.files.length > 0 && !data.files.some((f: SdkFile) => f.fileName === selectedFileName)) {
          setSelectedFileName(data.files[0].fileName);
        }
      } else {
        setError(data.message || 'Failed to load C# SDK files');
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching C# SDK files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSdkFiles();
  }, []);

  const getCustomizedContent = (file: SdkFile): string => {
    if (!app) return file.content;
    let content = file.content;

    // Replace placeholder App Credentials with real selected App credentials
    content = content.replace(
      /appId:\s*"[^"]*"/g,
      `appId: "${app.appId}"`
    );
    content = content.replace(
      /ownerId:\s*"[^"]*"/g,
      `ownerId: "${app.ownerId || 'owner_78625'}"`
    );
    content = content.replace(
      /appSecret:\s*"[^"]*"/g,
      `appSecret: "${(app.appSecret || '').replace(/^(secret_|sec_|scret_|secret)/i, '')}"`
    );
    content = content.replace(
      /version:\s*"[^"]*"/g,
      `version: "${app.version || '1.0.0'}"`
    );
    content = content.replace(
      /webhookUrl:\s*"[^"]*"/g,
      `webhookUrl: "${app.discordWebhook || ''}"`
    );
    content = content.replace(
      /https:\/\/malikauth\.ai\.studio/g,
      window.location.origin
    );

    return content;
  };

  const currentFile = files.find((f) => f.fileName === selectedFileName);
  const customizedCode = currentFile ? getCustomizedContent(currentFile) : '';

  const handleCopyCode = () => {
    if (!customizedCode) return;
    navigator.clipboard.writeText(customizedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = (fileName: string, content: string) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadAll = () => {
    files.forEach((f) => {
      const code = getCustomizedContent(f);
      handleDownloadFile(f.fileName, code);
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded-lg text-xs font-semibold flex items-center space-x-1">
                <Code className="w-3.5 h-3.5" />
                <span>C# Windows Forms SDK v2.5</span>
              </span>
              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-lg text-xs font-semibold flex items-center space-x-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Visual Studio 2019 / 2022 Compatible</span>
              </span>
            </div>

            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              C# WinForms Solution Files & SDK Engine
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              All files below are updated live with your active app's credentials (<span className="text-indigo-300 font-mono font-bold">{app?.name || 'Selected App'}</span> • ID: <span className="text-indigo-300 font-mono font-bold">{app?.appId}</span>). Copy or download these files into your C# project solution.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleDownloadAll}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-2 border border-indigo-400/30"
            >
              <Download className="w-4 h-4" />
              <span>Download All 8 Project Files</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Files Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Directory Explorer */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3 lg:col-span-1">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Project Solution Files</span>
            </span>
            <button
              onClick={fetchSdkFiles}
              title="Refresh files"
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400 space-y-2">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-indigo-600" />
              <p>Loading SDK files...</p>
            </div>
          ) : error ? (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs">
              {error}
            </div>
          ) : (
            <div className="space-y-1">
              {files.map((file) => {
                const isSelected = selectedFileName === file.fileName;
                const isCoreSdk = file.fileName === 'MalikAuthClient.cs';
                return (
                  <button
                    key={file.fileName}
                    onClick={() => setSelectedFileName(file.fileName)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-mono text-left transition-all ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200/80 shadow-xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <FileCode
                        className={`w-4 h-4 shrink-0 ${
                          isSelected ? 'text-indigo-600' : isCoreSdk ? 'text-amber-500' : 'text-slate-400'
                        }`}
                      />
                      <span className="truncate">{file.fileName}</span>
                    </div>
                    {isCoreSdk && (
                      <span className="px-1.5 py-0.5 text-[9px] font-sans font-bold uppercase bg-amber-100 text-amber-800 rounded">
                        Core SDK
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <div className="pt-3 border-t border-slate-100">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-1 text-slate-600">
              <span className="font-bold text-slate-800 block">How to use in C# WinForms:</span>
              <p className="text-[11px] leading-relaxed">
                Add these files to your C# Windows Forms application in Visual Studio (.NET Framework 4.7.2+ or .NET 6/7/8).
              </p>
            </div>
          </div>
        </div>

        {/* Right Code Viewer */}
        <div className="bg-[#1e1e1e] rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col lg:col-span-3 min-h-[520px]">
          {/* Editor Header Bar */}
          <div className="bg-slate-900 px-5 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-rose-500 inline-block"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500 inline-block"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></div>
              <span className="text-slate-400 text-xs font-mono ml-2 flex items-center space-x-2">
                <FileCode className="w-4 h-4 text-indigo-400" />
                <span className="text-slate-200 font-bold">{selectedFileName}</span>
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopyCode}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-sans font-semibold flex items-center space-x-1.5 transition-all shadow-sm"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy File Content'}</span>
              </button>
              <button
                onClick={() => currentFile && handleDownloadFile(currentFile.fileName, customizedCode)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-sans font-semibold flex items-center space-x-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span>Save .cs File</span>
              </button>
            </div>
          </div>

          {/* Editor Content Area */}
          <div className="p-5 flex-1 overflow-auto font-mono text-xs leading-relaxed text-slate-200">
            {loading ? (
              <div className="py-20 text-center text-slate-500 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-400" />
                <p>Loading code preview...</p>
              </div>
            ) : customizedCode ? (
              <pre
                className="whitespace-pre overflow-x-auto text-xs font-mono leading-relaxed"
                style={{ fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace' }}
              >
                {customizedCode}
              </pre>
            ) : (
              <p className="text-slate-500 italic">No content available for this file.</p>
            )}
          </div>

          {/* Editor Footer Bar */}
          <div className="bg-slate-900 px-5 py-2.5 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between shrink-0 font-mono">
            <span>Encoding: UTF-8 • Language: C# (.NET Framework / .NET Core)</span>
            <span>Target Server: {window.location.origin}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
