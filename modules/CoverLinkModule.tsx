
import React, { useState, useEffect } from 'react';

const CoverLinkModule: React.FC = () => {
  const storageKey = "coverlink_project";
  const [state, setState] = useState({
    coverLinkInput: '',
    coverLinkNames: '',
    coverLinkUrls: '',
    coverLinkOutput: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) setState(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state]);

  const handleSplit = () => {
    const lines = state.coverLinkInput.split(/\r?\n/);
    let names = ""; let urls = "";
    lines.forEach(line => {
      const httpIndex = line.lastIndexOf("http");
      if (httpIndex !== -1) {
          names += line.substring(0, httpIndex).trim().replace(/:$/, '') + "\n";
          urls += line.substring(httpIndex).trim() + "\n";
      } else {
          names += line.trim() + "\n";
          urls += "\n";
      }
    });
    setState(p => ({ ...p, coverLinkNames: names.trimEnd(), coverLinkUrls: urls.trimEnd() }));
  };

  const handleMerge = () => {
      const names = state.coverLinkNames.split(/\r?\n/);
      const urls = state.coverLinkUrls.split(/\r?\n/);
      let out = "";
      for (let i = 0; i < Math.max(names.length, urls.length); i++) {
          const n = names[i]?.trim(); const u = urls[i]?.trim();
          if (n && u) out += `${n}: ${u}\n`;
          else if (n || u) out += `${n || u}\n`;
      }
      setState(p => ({ ...p, coverLinkOutput: out.trimEnd() }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl p-6 border space-y-6">
            <textarea value={state.coverLinkInput} onChange={e=>setState(p=>({...p, coverLinkInput: e.target.value}))} placeholder="Nhập text gốc (Tên: Link)" className="w-full h-48 p-4 border rounded-xl font-mono" />
            <button onClick={handleSplit} className="w-full py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors">1. Tách Link</button>
            <div className="grid grid-cols-2 gap-4">
                <textarea value={state.coverLinkNames} onChange={e=>setState(p=>({...p, coverLinkNames: e.target.value}))} className="h-64 border rounded-xl p-3 font-mono focus:ring-2 focus:ring-orange-200 outline-none" />
                <textarea value={state.coverLinkUrls} onChange={e=>setState(p=>({...p, coverLinkUrls: e.target.value}))} className="h-64 border rounded-xl p-3 font-mono focus:ring-2 focus:ring-orange-200 outline-none" />
            </div>
            <button onClick={handleMerge} className="w-full py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all">2. Ghép Link</button>
            <textarea readOnly value={state.coverLinkOutput} className="w-full h-48 border rounded-xl p-4 bg-slate-50 font-mono" />
        </div>
    </div>
  );
};

export default CoverLinkModule;
