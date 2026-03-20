
import React, { useState, useRef, useEffect } from 'react';
import * as service from '../services/fashionTrackingService';

declare var JSZip: any;

interface FashionSlot {
  id: number;
  inputFile: File | null;
  inputPreview: string | null;
  outputUrl: string;
  loading: boolean;
  videoPrompt: string;
  isPromptLoading: boolean;
}

const FashionTrackingModule: React.FC = () => {
  const storageKey = "fashion_tracking_v2_stable";
  const [slots, setSlots] = useState<FashionSlot[]>(
    Array.from({ length: 6 }, (_, i) => ({
      id: i + 1,
      inputFile: null,
      inputPreview: null,
      outputUrl: '',
      loading: false,
      videoPrompt: '',
      isPromptLoading: false
    }))
  );

  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const localJsonRef = useRef<HTMLInputElement>(null);

  // Khôi phục dữ liệu từ LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setSlots(prev => prev.map((s, i) => ({
            ...s,
            ...(parsed[i] || {}),
            inputFile: null,
            loading: false,
            isPromptLoading: false
          })));
        }
      } catch (e) {
        console.error("Lỗi khôi phục Fashion Tracking:", e);
      }
    }
  }, []);

  // Lưu dữ liệu vào LocalStorage
  useEffect(() => {
    const toSave = slots.map(s => ({
      id: s.id,
      inputPreview: s.inputPreview || '',
      outputUrl: s.outputUrl || '',
      videoPrompt: s.videoPrompt || ''
    }));
    try {
      localStorage.setItem(storageKey, JSON.stringify(toSave));
    } catch (e) {
      console.warn("LocalStorage đầy, không thể lưu toàn bộ ảnh.");
    }
  }, [slots]);

  // --- LOGIC IMPORT / EXPORT ---

  const processImportData = async (importedData: any) => {
    if (!Array.isArray(importedData)) return;
    window.dispatchEvent(new CustomEvent('IMPORT_DATA_PROGRESS', { detail: { percent: 10, complete: false } }));
    
    try {
      const newSlots = Array.from({ length: 6 }, (_, i) => ({
        id: i + 1,
        inputFile: null,
        inputPreview: null,
        outputUrl: '',
        loading: false,
        videoPrompt: '',
        isPromptLoading: false
      }));

      const total = Math.min(importedData.length, 6);
      for (let i = 0; i < total; i++) {
        const item = importedData[i];
        newSlots[i] = {
          ...newSlots[i],
          inputPreview: item.inputs?.inputImage || item.inputPreview || null,
          outputUrl: item.outputImage || item.outputUrl || '',
          videoPrompt: item.script || item.videoPrompt || ''
        };
        const percent = Math.round(((i + 1) / total) * 100);
        window.dispatchEvent(new CustomEvent('IMPORT_DATA_PROGRESS', { detail: { percent, complete: i === total - 1 } }));
        await new Promise(r => setTimeout(r, 50));
      }
      setSlots(newSlots);
    } catch (error) {
      alert("Lỗi khi nạp dữ liệu JSON!");
    }
  };

  const constructExportData = () => {
    return slots.map((s, i) => ({
      stt: i + 1,
      inputs: {
        inputImage: s.inputPreview || '',
      },
      script: s.videoPrompt,
      outputImage: s.outputUrl || '',
      videoPrompt: s.videoPrompt
    }));
  };

  // Lắng nghe sự kiện từ App.tsx (Navbar buttons)
  useEffect(() => {
    const handleGlobalExport = () => {
      const data = constructExportData();
      window.dispatchEvent(new CustomEvent('EXPORT_DATA_READY', { 
        detail: { data, moduleName: 'Fashion_Tracking' } 
      }));
    };
    const handleGlobalImport = (e: any) => processImportData(e.detail);

    window.addEventListener('REQUEST_EXPORT_DATA', handleGlobalExport);
    window.addEventListener('REQUEST_IMPORT_DATA', handleGlobalImport);
    return () => {
      window.removeEventListener('REQUEST_EXPORT_DATA', handleGlobalExport);
      window.removeEventListener('REQUEST_IMPORT_DATA', handleGlobalImport);
    };
  }, [slots]);

  const handleLocalExportJson = () => {
    const data = constructExportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Fashion_Tracking_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // --- XỬ LÝ SLOT ---

  const updateSlot = (id: number, updates: Partial<FashionSlot>) => {
    setSlots(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleFileUpload = (id: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      updateSlot(id, { 
        inputFile: file, 
        inputPreview: e.target?.result as string, 
        outputUrl: '', 
        videoPrompt: '' 
      });
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateImage = async (id: number) => {
    const slot = slots.find(s => s.id === id);
    if (!slot?.inputPreview) return;

    updateSlot(id, { loading: true, outputUrl: '' });
    try {
      // Vì inputPreview bây giờ luôn là Base64, ta trích xuất phần data trực tiếp
      const dataPart = slot.inputPreview.split(',')[1];
      const mimeType = slot.inputPreview.split(',')[0].split(':')[1].split(';')[0];
      
      const part = { mimeType, data: dataPart };
      const url = await service.generateFashionTrackingImage(part, id - 1);
      updateSlot(id, { outputUrl: url, loading: false });
    } catch (e) {
      alert("Lỗi khi tạo ảnh slot " + id);
      updateSlot(id, { loading: false });
    }
  };

  const handleGeneratePrompt = async (id: number) => {
    const slot = slots.find(s => s.id === id);
    if (!slot?.outputUrl) return;

    updateSlot(id, { isPromptLoading: true });
    try {
      const prompt = await service.generateFashionTrackingVideoPrompt(slot.outputUrl);
      updateSlot(id, { videoPrompt: prompt, isPromptLoading: false });
    } catch (e) {
      updateSlot(id, { isPromptLoading: false });
    }
  };

  const handleBulkImage = async () => {
    const pendingSlots = slots.filter(s => s.inputPreview && !s.outputUrl);
    if (pendingSlots.length === 0) return alert("Vui lòng tải ít nhất một bộ trang phục chưa có kết quả.");
    
    for (const slot of pendingSlots) {
      await handleGenerateImage(slot.id);
    }
  };

  const handleBulkPrompt = async () => {
    const slotsWithImages = slots.filter(s => s.outputUrl && !s.videoPrompt);
    if (slotsWithImages.length === 0) return alert("Cần có hình ảnh kết quả trước khi tạo prompt.");

    for (const slot of slotsWithImages) {
      await handleGeneratePrompt(slot.id);
    }
  };

  const downloadAllImagesZip = async () => {
    if (typeof JSZip === 'undefined') return alert("Thư viện ZIP chưa tải xong.");
    const zip = new JSZip();
    let count = 0;
    slots.forEach((s, i) => {
      if (s.outputUrl) {
        const b64 = s.outputUrl.split(',')[1];
        zip.file(`${String(i + 1).padStart(2, '0')}.png`, b64, { base64: true });
        count++;
      }
    });
    if (count === 0) return alert("Chưa có ảnh nào để tải.");
    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `fashion_tracking_images_${Date.now()}.zip`;
    link.click();
  };

  const downloadAllPromptsTxt = () => {
    const text = slots
      .map(s => s.videoPrompt)
      .filter(p => p.trim() !== '')
      .join('\n');
    
    if (!text) return alert("Chưa có prompt nào được tạo.");
    const blob = new Blob([text], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `fashion_tracking_prompts_${Date.now()}.txt`;
    link.click();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* 1. SECTION TRANG PHỤC (INPUT) */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8 mb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">1. TẢI LÊN BỘ TRANG PHỤC</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Hỗ trợ tối đa 6 bộ trang phục tham chiếu</p>
          </div>
          <div className="flex flex-wrap gap-3">
             <button 
                onClick={() => localJsonRef.current?.click()}
                className="px-6 py-4 bg-slate-100 text-slate-600 text-[10px] font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest border border-slate-200 flex items-center gap-2"
              >
                📥 Tải Data
              </button>
              <input type="file" ref={localJsonRef} className="hidden" accept="application/json" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    try {
                      processImportData(JSON.parse(event.target?.result as string));
                    } catch(err) {
                      alert("File JSON lỗi định dạng!");
                    }
                  };
                  reader.readAsText(file);
                }
                e.target.value = "";
              }} />
              <button 
                onClick={handleBulkImage}
                disabled={!slots.some(s => s.inputPreview && !s.outputUrl)}
                className="px-8 py-4 bg-orange-600 text-white text-[10px] font-black rounded-2xl hover:bg-orange-700 transition-all uppercase tracking-widest shadow-xl shadow-orange-100 flex items-center gap-3 active:scale-95 disabled:opacity-30"
              >
                🚀 Tạo tất cả ảnh
              </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {slots.map((slot, idx) => (
            <div key={slot.id} className="space-y-3">
              <div 
                onClick={() => fileInputRefs.current[idx]?.click()}
                className={`aspect-[3/4] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden relative cursor-pointer ${slot.inputPreview ? 'border-orange-500 bg-white shadow-lg' : 'border-slate-300 hover:border-orange-400 bg-slate-50'}`}
              >
                {slot.inputPreview ? (
                  <>
                    <img src={slot.inputPreview} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-orange-600/10 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                       <span className="bg-white text-orange-600 text-[8px] font-black px-2 py-1 rounded shadow-sm">ĐỔI ẢNH</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-2 opacity-30">
                    <svg className="w-6 h-6 mx-auto mb-1 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" /></svg>
                    <span className="text-[8px] font-black uppercase tracking-tighter">OUTFIT {slot.id}</span>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={el => { fileInputRefs.current[idx] = el; }}
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(slot.id, e.target.files[0])}
                  className="hidden" 
                  accept="image/*"
                />
              </div>
              <div className="flex justify-between items-center px-1">
                 <span className="text-[9px] font-bold text-slate-400 uppercase">Slot {slot.id}</span>
                 {slot.inputPreview && (
                    <button 
                      onClick={() => updateSlot(slot.id, { inputFile: null, inputPreview: null, outputUrl: '', videoPrompt: '' })}
                      className="text-slate-300 hover:text-red-500 transition-colors"
                      title="Xóa trang phục"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                 )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. SECTION KẾT QUẢ (OUTPUT) */}
      <div className="space-y-8 pb-32">
        <div className="bg-white rounded-[2.5rem] p-8 border border-orange-100 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col">
            <h2 className="text-2xl font-black text-orange-900 uppercase tracking-tighter">2. KẾT QUẢ HÌNH ẢNH (9:16)</h2>
            <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mt-1">Chất lượng 8K • Cinematic Lighting • Candid Paparazzi</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
             <button 
                onClick={handleBulkPrompt}
                disabled={!slots.some(s => s.outputUrl && !s.videoPrompt)}
                className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white text-[10px] font-black rounded-xl hover:shadow-orange-500/20 transition-all uppercase tracking-widest shadow-lg disabled:opacity-30 active:scale-95"
              >
                ✨ Tạo tất cả Prompt
              </button>
             <button 
                onClick={downloadAllImagesZip}
                disabled={!slots.some(s => s.outputUrl)}
                className="px-6 py-3 bg-orange-50 text-orange-600 border border-orange-100 text-[10px] font-black rounded-xl hover:bg-orange-100 transition-all uppercase tracking-widest shadow-lg disabled:opacity-30 active:scale-95"
              >
                📦 Tải ZIP Ảnh
              </button>
              <button 
                onClick={handleLocalExportJson}
                disabled={!slots.some(s => s.outputUrl || s.inputPreview)}
                className="px-6 py-3 bg-orange-500 text-white text-[10px] font-black rounded-xl hover:bg-orange-600 transition-all uppercase tracking-widest shadow-lg active:scale-95"
              >
                📤 Xuất JSON
              </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {slots.map((slot) => (
            <div key={slot.id} className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-2xl transition-all duration-500 relative min-h-[500px]">
              {/* Image result container */}
              <div className="relative aspect-[9/16] bg-slate-50 border-b border-slate-100 overflow-hidden">
                {slot.outputUrl ? (
                  <>
                    <img src={slot.outputUrl} className="w-full h-full object-cover animate-fadeIn" />
                    <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => updateSlot(slot.id, { outputUrl: '', videoPrompt: '' })}
                        className="w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center shadow-xl hover:bg-red-700 active:scale-90"
                        title="Xóa hình ảnh này"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </>
                ) : slot.loading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/5 backdrop-blur-[2px]">
                    <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="mt-4 text-[10px] font-black text-orange-600 uppercase tracking-widest animate-pulse">Đang chụp lén...</span>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center opacity-20">
                     <svg className="w-16 h-16 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                     <span className="text-xs font-black uppercase tracking-widest">Đợi tín hiệu...</span>
                  </div>
                )}
                <div className="absolute top-4 left-4 bg-orange-900/80 backdrop-blur-md text-white text-[9px] font-black px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
                  RESULT #{slot.id}
                </div>
              </div>

              {/* Controls container */}
              <div className="p-6 space-y-3 bg-white flex-1 flex flex-col">
                <button 
                  onClick={() => handleGenerateImage(slot.id)}
                  disabled={!slot.inputPreview || slot.loading}
                  className="w-full py-4 bg-orange-600 text-white text-[11px] font-black rounded-2xl hover:bg-orange-700 transition-all uppercase tracking-widest disabled:opacity-30 flex items-center justify-center gap-2 shadow-lg active:scale-95"
                >
                  {slot.outputUrl ? "Chụp lại ảnh" : "Tạo ảnh AI (9:16)"}
                </button>
                
                <button 
                  onClick={() => handleGeneratePrompt(slot.id)}
                  disabled={!slot.outputUrl || slot.isPromptLoading}
                  className="w-full py-4 bg-orange-50 text-orange-600 text-[11px] font-black rounded-2xl hover:bg-orange-100 transition-all uppercase tracking-widest disabled:opacity-30 shadow-sm active:scale-95"
                >
                  {slot.isPromptLoading ? "Đang viết prompt..." : "Tạo Prompt Video"}
                </button>

                {slot.videoPrompt && (
                  <div className="mt-4 bg-orange-50 p-5 rounded-3xl animate-slideUp border border-orange-100">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest flex items-center gap-2">
                         <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></div>
                         VEO-3 Prompt Ready
                      </span>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(slot.videoPrompt);
                          alert("Đã copy prompt!");
                        }} 
                        className="text-[9px] font-black text-orange-500 underline uppercase hover:text-orange-700"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-600 italic leading-relaxed line-clamp-5 font-medium opacity-90">
                      "{slot.videoPrompt}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Global Footer Actions */}
        <div className="flex flex-col items-center gap-10 py-16 border-t border-slate-100 mt-16">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 w-full">
            <button 
              onClick={downloadAllImagesZip}
              className="w-full md:w-auto px-12 py-5 bg-gradient-to-r from-orange-600 to-red-600 text-white font-black rounded-3xl shadow-2xl hover:shadow-orange-500/20 transition-all flex items-center justify-center gap-4 uppercase tracking-widest text-sm active:scale-95"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Tải bộ ảnh (ZIP)
            </button>
            <button 
              onClick={downloadAllPromptsTxt}
              className="w-full md:w-auto px-12 py-5 bg-orange-50 text-orange-600 border border-orange-100 font-black rounded-3xl shadow-2xl hover:bg-orange-100 transition-all flex items-center justify-center gap-4 uppercase tracking-widest text-sm active:scale-95"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1.01.707.293l5.414 5.414a1 1 0 01-2 2z" /></svg>
              Tải File Prompt (.TXT)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FashionTrackingModule;
