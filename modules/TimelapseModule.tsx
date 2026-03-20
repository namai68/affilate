
import React, { useState, useRef, useEffect } from 'react';
import * as service from '../services/timelapseService';
import { TimelapseSegment } from '../types';

declare var JSZip: any;

const DURATION_OPTIONS = [
  { scenes: 3, label: '3 cảnh - 24s' },
  { scenes: 4, label: '4 cảnh - 32s' },
  { scenes: 5, label: '5 cảnh - 40s' },
  { scenes: 6, label: '6 cảnh - 48s' },
  { scenes: 7, label: '7 cảnh - 56s' },
  { scenes: 8, label: '8 cảnh - 64s' },
];

/**
 * Hàm tính toán mảng phần trăm tiến độ.
 * Quy tắc mới: Cảnh 1 (0%), Cảnh 2 (20%), phần còn lại chia đều đến 100%.
 */
const getProgressArray = (count: number): number[] => {
  if (count <= 1) return [0];
  if (count === 2) return [0, 100];
  
  const result = [0, 20];
  const remainingScenes = count - 2; // Số lượng cảnh còn lại sau khi trừ cảnh 0% và 20%
  const totalRemainingProgress = 80; // Từ 20% đến 100% là 80 đơn vị
  const stepSize = totalRemainingProgress / remainingScenes;

  for (let i = 1; i < remainingScenes; i++) {
    result.push(Math.round(20 + i * stepSize));
  }
  
  result.push(100);
  return result;
};

const TimelapseModule: React.FC = () => {
  const storageKey = "timelapse_project_v14_cinematic_final";
  const [baseFile, setBaseFile] = useState<File | null>(null);
  const [basePreview, setBasePreview] = useState<string | null>(null);
  const [finalFile, setFinalFile] = useState<File | null>(null);
  const [finalPreview, setFinalPreview] = useState<string | null>(null);
  const [sceneCount, setSceneCount] = useState(4);
  const [isProcessing, setIsProcessing] = useState(false);
  const [segments, setSegments] = useState<TimelapseSegment[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const finalInputRef = useRef<HTMLInputElement>(null);
  const jsonImportRef = useRef<HTMLInputElement>(null);
  const segmentUploadRef = useRef<HTMLInputElement>(null);
  const [uploadingSegmentId, setUploadingSegmentId] = useState<number | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSceneCount(parsed.sceneCount || 4);
        setBasePreview(parsed.basePreview || null);
        setFinalPreview(parsed.finalPreview || null);
        setSegments((parsed.segments || []).map((s: any) => ({
          ...s,
          image: { ...s.image, url: s.image.url || '', loading: false },
          videoPrompt: { ...s.videoPrompt, loading: false }
        })));
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    try {
      const toSave = {
        sceneCount,
        basePreview: basePreview?.startsWith('data:') ? basePreview : '',
        finalPreview: finalPreview?.startsWith('data:') ? finalPreview : '',
        segments: segments.map(s => ({
          ...s,
          image: { ...s.image, url: s.image.url?.startsWith('data:') ? s.image.url : '' },
          videoPrompt: { ...s.videoPrompt, loading: false }
        }))
      };
      localStorage.setItem(storageKey, JSON.stringify(toSave));
    } catch (e) {}
  }, [sceneCount, basePreview, finalPreview, segments]);

  const handleExportJson = () => {
    if (segments.length === 0) {
      alert("Vui lòng tạo lộ trình trước khi xuất file.");
      return;
    }
    const exportData = segments.map((seg, index) => ({
      stt: index + 1,
      inputs: { sceneCount, basePreview, finalPreview },
      script: seg.content,
      outputImage: seg.image.url || '',
      videoPrompt: seg.videoPrompt.text || ''
    }));
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `timelapse_export_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const processImportData = async (importedData: any) => {
    if (!Array.isArray(importedData) || importedData.length === 0) return;
    
    // Bắt đầu quá trình nạp dữ liệu - Kích hoạt overlay tiến trình trong App.tsx
    window.dispatchEvent(new CustomEvent('IMPORT_DATA_PROGRESS', { detail: { percent: 5, complete: false } }));
    
    try {
      const first = importedData[0].inputs || {};
      setSceneCount(first.sceneCount || importedData.length);
      setBasePreview(first.basePreview || "");
      setFinalPreview(first.finalPreview || "");
      
      const newSegments: TimelapseSegment[] = [];
      const total = importedData.length;
      
      for (let i = 0; i < total; i++) {
        const item = importedData[i];
        newSegments.push({
          id: i + 1,
          content: item.script || '',
          image: { url: item.outputImage || '', loading: false, regenNote: '' },
          videoPrompt: { text: item.videoPrompt || '', loading: false, visible: !!item.videoPrompt }
        });
        
        const percent = Math.round(((i + 1) / total) * 100);
        // Đảm bảo percent không về 100% quá sớm nếu chưa xong hẳn
        window.dispatchEvent(new CustomEvent('IMPORT_DATA_PROGRESS', { 
          detail: { percent: Math.min(percent, 95), complete: false } 
        }));
        await new Promise(r => setTimeout(r, 30));
      }
      
      setSegments(newSegments);
      // Kết thúc hoàn tất
      window.dispatchEvent(new CustomEvent('IMPORT_DATA_PROGRESS', { detail: { percent: 100, complete: true } }));
    } catch (err) {
      alert("Lỗi khi đọc file JSON!");
      window.dispatchEvent(new CustomEvent('IMPORT_DATA_PROGRESS', { detail: { percent: 100, complete: true } }));
    }
  };

  const handleImportJsonClick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        processImportData(data);
      } catch (err) { alert("File JSON không hợp lệ"); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  useEffect(() => {
    const handleGlobalExport = () => {
        if (segments.length === 0) return;
        const exportData = segments.map((seg, index) => ({
          stt: index + 1,
          inputs: { sceneCount, basePreview, finalPreview },
          script: seg.content,
          outputImage: seg.image.url || '',
          videoPrompt: seg.videoPrompt.text || ''
        }));
        window.dispatchEvent(new CustomEvent('EXPORT_DATA_READY', { 
          detail: { data: exportData, moduleName: 'Timelapse_Project' } 
        }));
    };
    const handleGlobalImport = (e: any) => processImportData(e.detail);
    window.addEventListener('REQUEST_EXPORT_DATA', handleGlobalExport);
    window.addEventListener('REQUEST_IMPORT_DATA', handleGlobalImport);
    return () => {
      window.removeEventListener('REQUEST_EXPORT_DATA', handleGlobalExport);
      window.removeEventListener('REQUEST_IMPORT_DATA', handleGlobalImport);
    };
  }, [segments, sceneCount, basePreview, finalPreview]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBaseFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setBasePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleFinalUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFinalFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setFinalPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleStart = async () => {
    if (!basePreview || !finalPreview) {
      alert("Vui lòng tải cả ảnh HIỆN TRẠNG và ảnh KẾT QUẢ để AI phân tích lộ trình thi công.");
      return;
    }
    setIsProcessing(true);
    try {
      const getPart = async (file: File | null, preview: string | null) => {
        if (file) return await service.fileToGenerativePart(file);
        if (preview?.startsWith('data:')) return { mimeType: 'image/png', data: preview.split(',')[1] };
        return null;
      };
      const basePart = await getPart(baseFile, basePreview);
      const finalPart = await getPart(finalFile, finalPreview);
      const progressSteps = getProgressArray(sceneCount);
      const descriptions = await service.generateTimelapseScript(basePart, finalPart, sceneCount, progressSteps);
      const newSegments: TimelapseSegment[] = descriptions.map((desc, i) => ({
        id: i + 1,
        content: desc,
        image: { 
          url: i === 0 ? basePreview : (i === sceneCount - 1 ? finalPreview : ''), 
          loading: false,
          regenNote: ''
        },
        videoPrompt: { text: '', loading: false, visible: false }
      }));
      setSegments(newSegments);
    } catch (e) { console.error(e); } finally { setIsProcessing(false); }
  };

  const handleGenImage = async (id: number) => {
    const idx = id - 1;
    setSegments(prev => prev.map(s => s.id === id ? { ...s, image: { ...s.image, loading: true } } : s));
    try {
      const getPart = async (file: File | null, preview: string | null) => {
        if (file) return await service.fileToGenerativePart(file);
        if (preview?.startsWith('data:')) return { mimeType: 'image/png', data: preview.split(',')[1] };
        return null;
      };
      const basePart = await getPart(baseFile, basePreview);
      const finalPart = await getPart(finalFile, finalPreview);
      const progressSteps = getProgressArray(segments.length);
      const specificProgress = progressSteps[idx];
      const url = await service.generateTimelapseImage(segments[idx].content, basePart, finalPart, specificProgress);
      setSegments(prev => prev.map(s => s.id === id ? { ...s, image: { ...s.image, url, loading: false } } : s));
    } catch (e) {
      setSegments(prev => prev.map(s => s.id === id ? { ...s, image: { ...s.image, loading: false, error: 'Lỗi' } } : s));
    }
  };

  const handleDeleteImage = (id: number) => {
    setSegments(prev => prev.map(s => s.id === id ? { ...s, image: { ...s.image, url: '', loading: false } } : s));
  };

  const triggerSegmentUpload = (id: number) => {
    setUploadingSegmentId(id);
    segmentUploadRef.current?.click();
  };

  const handleSegmentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadingSegmentId !== null) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const b64 = event.target?.result as string;
        setSegments(prev => prev.map(s => s.id === uploadingSegmentId ? { ...s, image: { ...s.image, url: b64, loading: false } } : s));
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
    setUploadingSegmentId(null);
  };

  const handleGenPrompt = async (id: number) => {
    const idx = id - 1;
    const seg = segments[idx];
    if (!seg.image.url) return;
    
    setSegments(prev => prev.map(s => s.id === id ? { ...s, videoPrompt: { ...s.videoPrompt, loading: true, visible: true } } : s));
    
    try {
      const progressSteps = getProgressArray(segments.length);
      const progress = progressSteps[idx];
      const prompt = await service.generateTimelapseVideoPrompt(seg.content, seg.image.url, progress);
      setSegments(prev => prev.map(s => s.id === id ? { ...s, videoPrompt: { text: prompt, loading: false, visible: true } } : s));
    } catch (e) {
      setSegments(prev => prev.map(s => s.id === id ? { ...s, videoPrompt: { ...s.videoPrompt, loading: false } } : s));
    }
  };

  const handleBulkImage = async () => {
    for (const seg of segments) {
      if (!seg.image.url) await handleGenImage(seg.id);
    }
  };

  const handleBulkPrompt = async () => {
    for (const seg of segments) {
      if (seg.image.url && !seg.videoPrompt.text) await handleGenPrompt(seg.id);
    }
  };

  const downloadAllImages = async () => {
    if (typeof JSZip === 'undefined') return alert("ZIP Lib not loaded");
    const zip = new JSZip();
    let count = 0;
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (seg.image?.url) {
        const base64Data = seg.image.url.split(',')[1];
        if (base64Data) {
          zip.file(`${String(i + 1).padStart(2, '0')}.png`, base64Data, { base64: true });
          count++;
        }
      }
    }
    if (count === 0) return alert("Không có ảnh để tải xuống.");
    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `timelapse_images_${Date.now()}.zip`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const downloadAllPrompts = () => {
    const text = segments.map(seg => seg.videoPrompt?.text || "").filter(t => t.trim().length > 0).map(t => t.replace(/\n/g, ' ')).join('\n');
    if (!text) return alert("Vui lòng tạo Video Prompt trước khi tải xuống.");
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `timelapse_prompts_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const progressSteps = getProgressArray(segments.length || sceneCount);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Input hidden file cho từng cảnh */}
      <input type="file" ref={segmentUploadRef} onChange={handleSegmentFileChange} className="hidden" accept="image/*" />

      <div className="bg-white rounded-3xl shadow-sm border border-orange-100 p-8 mb-8">
        <div className="flex flex-col lg:flex-row gap-10 items-center">
          <div className="flex-1 space-y-6 w-full">
            <div className="flex justify-between items-center px-1">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">1. Ảnh đối chiếu tiến trình</label>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Phân phối 0% - 20% - ... - 100%</span>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
                <div onClick={() => fileInputRef.current?.click()} className="aspect-[3/4] border-2 border-dashed border-orange-100 rounded-2xl flex flex-col items-center justify-center bg-orange-50/30 cursor-pointer hover:border-orange-400 transition-all overflow-hidden relative group">
                    {basePreview ? <img src={basePreview} className="w-full h-full object-cover" /> : <span className="text-[10px] font-black uppercase text-slate-400">Hiện Trạng</span>}
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
                    <div className="absolute top-2 left-2 bg-black/60 text-white text-[8px] font-black px-2 py-1 rounded uppercase">START (0%)</div>
                </div>
                <div onClick={() => finalInputRef.current?.click()} className="aspect-[3/4] border-2 border-dashed border-orange-100 rounded-2xl flex flex-col items-center justify-center bg-orange-50/30 cursor-pointer hover:border-orange-400 transition-all overflow-hidden relative group">
                    {finalPreview ? <img src={finalPreview} className="w-full h-full object-cover" /> : <span className="text-[10px] font-black uppercase text-slate-400">Kết Quả</span>}
                    <input type="file" ref={finalInputRef} onChange={handleFinalUpload} className="hidden" accept="image/*" />
                    <div className="absolute top-2 left-2 bg-orange-600 text-white text-[8px] font-black px-2 py-1 rounded uppercase">GOAL (100%)</div>
                </div>
            </div>
          </div>

          <div className="flex-1 space-y-8 w-full">
            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase mb-4 tracking-widest px-1">2. Số lượng cảnh quay (Tiến độ)</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {DURATION_OPTIONS.map(opt => (
                  <button key={opt.scenes} onClick={() => setSceneCount(opt.scenes)} className={`p-4 rounded-xl text-[10px] font-black transition-all border-2 ${sceneCount === opt.scenes ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-slate-100 bg-slate-50 text-slate-400'}`}>{opt.label}</button>
                ))}
              </div>
            </div>
            <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-2xl">
                <p className="text-[9px] text-orange-700 font-bold uppercase tracking-widest mb-2">Lộ trình thi công phân phối:</p>
                <div className="flex gap-2">
                    {getProgressArray(sceneCount).map((p, i) => (
                        <div key={i} className="flex-1 h-1.5 bg-orange-200 rounded-full overflow-hidden">
                            <div className="h-full bg-orange-500" style={{ width: `${p}%` }}></div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-between mt-2">
                   <span className="text-[8px] font-black text-orange-400 uppercase">Khởi điểm (0%)</span>
                   <span className="text-[8px] font-black text-orange-400 uppercase">Giai đoạn 2 (20%)</span>
                   <span className="text-[8px] font-black text-orange-400 uppercase">Kết thúc (100%)</span>
                </div>
            </div>
            <button onClick={handleStart} disabled={isProcessing || !basePreview || !finalPreview} className="w-full py-6 bg-orange-600 text-white font-black rounded-2xl shadow-xl hover:bg-orange-700 transition-all disabled:opacity-50 uppercase tracking-[0.2em] flex items-center justify-center gap-4">
              {isProcessing ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> ĐANG PHÂN TÍCH...</> : "🚀 TẠO LỘ TRÌNH THI CÔNG"}
            </button>
          </div>
        </div>
      </div>

      {segments.length > 0 && (
        <div className="space-y-12 pb-32">
          <div className="bg-orange-950 p-8 rounded-3xl border border-orange-900 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-6">
            <div>
                <h3 className="text-white font-black text-xl uppercase tracking-tight">Timeline Progress</h3>
                <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest mt-1">Phân phối tiến độ 0% - 20% - ... - 100%</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <button onClick={handleBulkImage} className="px-6 py-4 bg-orange-600 text-white text-[11px] font-black rounded-xl hover:bg-orange-700 transition-all uppercase flex items-center gap-2 shadow-lg"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>Vẽ ảnh tiến độ</button>
              <button onClick={handleBulkPrompt} className="px-6 py-4 bg-red-700 text-white text-[11px] font-black rounded-xl hover:bg-red-800 transition-all uppercase flex items-center gap-2 shadow-lg"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M13 10V3L4 14H11V21L20 10H13Z" /></svg>Tạo prompt video</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {segments.map((seg, idx) => {
              const progress = progressSteps[idx];
              return (
                <div key={seg.id} className="bg-white rounded-[2.5rem] border border-orange-100 shadow-sm overflow-hidden flex flex-col h-full group hover:shadow-xl transition-all">
                  <div className="relative aspect-[9/16] bg-slate-100 overflow-hidden">
                    {seg.image.url ? (
                      <>
                        <img src={seg.image.url} className={`w-full h-full object-cover ${seg.image.loading ? 'blur-sm grayscale opacity-50' : ''}`} />
                        <button 
                          onClick={() => handleDeleteImage(seg.id)}
                          className="absolute top-3 right-3 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-700 transition-all z-10"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                        {seg.image.loading ? (
                          <div className="flex flex-col items-center">
                            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="mt-4 text-[10px] font-black text-orange-600 uppercase animate-pulse">Dựng hình {progress}%...</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-4">
                            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-widest px-4">Cảnh {progress}%</span>
                            <button onClick={() => handleGenImage(seg.id)} className="w-40 py-3 bg-[#f3591a] hover:bg-orange-700 text-white rounded-xl text-xs font-black shadow-lg shadow-orange-100 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" clipRule="evenodd" /></svg>Tạo ảnh AI
                            </button>
                            <button onClick={() => triggerSegmentUpload(seg.id)} className="w-40 py-3 bg-[#e8edf2] hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 uppercase">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>Tải ảnh lên
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-black px-4 py-2 rounded-full shadow-lg">#{seg.id} • {progress}% TIẾN ĐỘ</div>
                  </div>

                  <div className="p-6 space-y-4 flex flex-col flex-1">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Trạng thái thi công ({progress}%):</label>
                      <textarea value={seg.content} onChange={e => setSegments(prev => prev.map(s => s.id === seg.id ? { ...s, content: e.target.value } : s))} className="w-full h-24 p-4 bg-orange-50/30 border border-orange-100 rounded-2xl text-xs font-bold text-orange-900 outline-none focus:bg-white transition-all leading-relaxed shadow-inner resize-none" />
                    </div>
                    <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
                      <button onClick={() => handleGenImage(seg.id)} disabled={seg.image.loading} className="py-4 bg-orange-600 text-white text-[10px] font-black rounded-xl uppercase transition-all hover:bg-orange-700 disabled:opacity-50">Vẽ {progress}%</button>
                      <button onClick={() => handleGenPrompt(seg.id)} disabled={seg.videoPrompt.loading || !seg.image.url} className="py-4 bg-orange-50 text-orange-700 text-[10px] font-black rounded-xl uppercase transition-all border border-orange-100">Video Prompt</button>
                    </div>
                  </div>

                  {seg.videoPrompt.visible && (
                    <div className="p-5 bg-red-950 border-t border-red-900 animate-slideUp">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest">VEO-3 Prompt Ready</span>
                        <button onClick={() => navigator.clipboard.writeText(seg.videoPrompt.text)} className="text-[9px] font-black text-white underline font-black">COPY</button>
                      </div>
                      {seg.videoPrompt.loading ? <div className="h-10 flex items-center justify-center"><div className="w-4 h-4 border-2 border-orange-500 border-t-white rounded-full animate-spin"></div></div> : <p className="text-[9px] text-slate-400 italic leading-snug">"{seg.videoPrompt.text}"</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-10 py-12 border-t border-slate-200">
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
               <button 
                onClick={() => jsonImportRef.current?.click()} 
                className="w-full md:w-auto px-10 py-4 bg-orange-50 text-orange-600 font-black rounded-2xl border border-orange-100 hover:bg-orange-100 transition-all flex items-center justify-center gap-3 uppercase text-[11px] tracking-widest shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                Tải Data (Import)
              </button>
              <input type="file" ref={jsonImportRef} onChange={handleImportJsonClick} className="hidden" accept="application/json" />
              
              <button 
                onClick={handleExportJson} 
                className="w-full md:w-auto px-10 py-4 bg-orange-600 text-white font-black rounded-2xl hover:bg-orange-700 transition-all flex items-center justify-center gap-3 uppercase text-[11px] tracking-widest shadow-lg shadow-orange-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                Xuất file JSON
              </button>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
              <button onClick={downloadAllImages} className="w-full md:w-auto px-12 py-5 bg-red-600 text-white font-black rounded-[2rem] shadow-xl hover:bg-red-700 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-base">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>Tải bộ ảnh (.ZIP)
              </button>
              <button onClick={downloadAllPrompts} className="w-full md:w-auto px-12 py-5 bg-orange-600 text-white font-black rounded-[2rem] shadow-xl hover:bg-orange-700 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-base">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1.01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>Tải bộ Prompt (.TXT)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelapseModule;
