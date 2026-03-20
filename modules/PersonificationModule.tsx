import React, { useState, useRef, useEffect } from 'react';
import * as service from '../services/personificationService';
import { PersonificationSegment } from '../types';

declare var JSZip: any;

const ADDRESSING_OPTIONS = [
  "em - anh chị",
  "em - các bác",
  "tôi - các bạn",
  "tớ - các cậu",
  "mình - các bạn",
  "tao - mày",
  "tui - mấy bà",
  "tui - mấy ní",
  "tui - các bác",
  "tui - mấy ông",
  "mình - cả nhà",
  "mình - mọi người"
];

const STYLES = [
    { id: 'vui vẻ hài hước', label: 'Vui vẻ hài hước (Funny/Humorous)' },
    { id: 'châm biếm sarki', label: 'Châm biếm - Sarky (Sarcastic)' },
    { id: 'tâm sự trải lòng', label: 'Tâm sự trải lòng (Deep/Emotional)' },
    { id: 'kịch tính & cảm xúc', label: 'Kịch tính & cảm xúc (Dramatic)' },
    { id: 'thẳng thắn gắt', label: 'Thẳng thắn - Gắt (Brutal Honesty)' },
    { id: 'chuyên gia phân tích', label: 'Chuyên gia phân tích (Analytical)' },
    { id: 'truyền cảm hứng', label: 'Truyền cảm hứng (Motivational)' },
    { id: 'vlog đời thường', label: 'Vlog đời thường (Daily Vlog)' }
];

const PersonificationModule: React.FC = () => {
  const storageKey = "personification_project_v6_full_sync";
  const [state, setState] = useState<any>({
    healthKeyword: '',
    ctaProduct: '',
    frameCount: 4,
    gender: 'Nữ',
    voice: 'Miền Bắc',
    addressing: '',
    style: 'vui vẻ hài hước',
    characterDescription: '',
    characterFile: null,
    characterPreviewUrl: null,
    productFiles: [],
    productPreviews: [],
    isGeneratingScript: false,
    segments: []
  });

  const productInputRef = useRef<HTMLInputElement>(null);
  const characterInputRef = useRef<HTMLInputElement>(null);

  // Restore from LocalStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setState((p: any) => ({ 
          ...p, 
          ...parsed, 
          productFiles: [], 
          productPreviews: parsed.productPreviews || [], 
          characterFile: null,
          characterPreviewUrl: parsed.characterPreviewUrl || null,
          segments: (parsed.segments || []).map((s: any) => ({ 
            ...s, 
            image: { ...s.image, url: s.image.url || '', loading: false },
            videoPrompt: { ...s.videoPrompt, loading: false }
          })) 
        }));
      }
    } catch (e) {}
  }, []);

  // Save to LocalStorage (Avoid large base64 to prevent QuotaExceededError, only keep critical UI state)
  useEffect(() => {
    try {
      const { productFiles, characterFile, isGeneratingScript, ...rest } = state;
      localStorage.setItem(storageKey, JSON.stringify(rest));
    } catch (e) {
      console.warn("LocalStorage full, only partial state saved.");
    }
  }, [state]);

  // HANDLE GLOBAL IMPORT / EXPORT
  useEffect(() => {
    const handleExport = async () => {
      const getBase64 = async (file: File | null, fallbackUrl: string | null) => {
        if (file) {
          const part = await service.fileToGenerativePart(file);
          return `data:${part.mimeType};base64,${part.data}`;
        }
        if (fallbackUrl?.startsWith('data:')) return fallbackUrl;
        return "";
      };

      const productImagesBase64 = await Promise.all(
        state.productFiles.length > 0 
          ? state.productFiles.map((f: File) => getBase64(f, null))
          : state.productPreviews.map((url: string) => url.startsWith('data:') ? Promise.resolve(url) : Promise.resolve(""))
      );

      const charImageBase64 = await getBase64(state.characterFile, state.characterPreviewUrl);

      const exportData = state.segments.map((seg: any, index: number) => ({
        stt: index + 1,
        inputs: {
          healthKeyword: state.healthKeyword,
          ctaProduct: state.ctaProduct,
          characterDescription: state.characterDescription,
          sceneIdea: seg.sceneIdea,
          inputMedia: {
            productImages: productImagesBase64.filter(i => i),
            characterReference: charImageBase64
          },
          settings: {
            gender: state.gender,
            voice: state.voice,
            addressing: state.addressing,
            style: state.style,
            frameCount: state.frameCount,
            regenNote: seg.image.regenNote
          }
        },
        script: seg.content,
        outputImage: seg.image.url || '',
        videoPrompt: seg.videoPrompt.text || ''
      }));

      window.dispatchEvent(new CustomEvent('EXPORT_DATA_READY', { 
        detail: { data: exportData, moduleName: 'Nhan_Hoa_Project' } 
      }));
    };

    const smartFind = (obj: any, keys: string[]) => {
      if (!obj) return undefined;
      const lowerKeys = keys.map(k => k.toLowerCase());
      const foundKey = Object.keys(obj).find(k => lowerKeys.includes(k.toLowerCase()));
      return foundKey ? obj[foundKey] : undefined;
    };

    const handleImport = async (e: any) => {
      const importedData = e.detail;
      if (!Array.isArray(importedData) || importedData.length === 0) return;

      const firstItem = importedData[0];
      const inputs = smartFind(firstItem, ['inputs', 'input', 'data']) || {};
      const settings = smartFind(inputs, ['settings', 'config']) || {};
      const media = smartFind(inputs, ['inputMedia', 'media']) || {};

      const newState = {
        ...state,
        healthKeyword: smartFind(inputs, ['healthKeyword', 'keyword']) || state.healthKeyword,
        ctaProduct: smartFind(inputs, ['ctaProduct', 'product']) || state.ctaProduct,
        characterDescription: smartFind(inputs, ['characterDescription', 'character']) || state.characterDescription,
        gender: smartFind(settings, ['gender']) || state.gender,
        voice: smartFind(settings, ['voice']) || state.voice,
        addressing: smartFind(settings, ['addressing', 'xưng hô']) || state.addressing,
        style: smartFind(settings, ['style', 'phong cách']) || state.style,
        frameCount: smartFind(settings, ['frameCount', 'frames']) || importedData.length,
        productPreviews: smartFind(media, ['productImages', 'images']) || [],
        characterPreviewUrl: smartFind(media, ['characterReference', 'char_img']) || "",
        segments: []
      };

      const total = importedData.length;
      for (let i = 0; i < total; i++) {
        const item = importedData[i];
        const itemInputs = smartFind(item, ['inputs', 'input']) || {};
        const itemSettings = smartFind(itemInputs, ['settings']) || {};
        
        newState.segments.push({
          id: i + 1,
          sceneIdea: smartFind(itemInputs, ['sceneIdea', 'ý tưởng cảnh']) || '',
          content: smartFind(item, ['script', 'content', 'text']) || '',
          image: {
            url: smartFind(item, ['outputImage', 'image', 'base64']) || '',
            loading: false,
            regenNote: smartFind(itemSettings, ['regenNote', 'ghi chú sửa']) || ''
          },
          videoPrompt: {
            text: smartFind(item, ['videoPrompt', 'prompt']) || '',
            loading: false,
            visible: !!smartFind(item, ['videoPrompt', 'prompt'])
          }
        });

        const percent = Math.round(((i + 1) / total) * 100);
        window.dispatchEvent(new CustomEvent('IMPORT_DATA_PROGRESS', { 
          detail: { percent, complete: i === total - 1 } 
        }));
        await new Promise(r => setTimeout(r, 50));
      }

      setState(newState);
    };

    window.addEventListener('REQUEST_EXPORT_DATA', handleExport);
    window.addEventListener('REQUEST_IMPORT_DATA', handleImport);
    return () => {
      window.removeEventListener('REQUEST_EXPORT_DATA', handleExport);
      window.removeEventListener('REQUEST_IMPORT_DATA', handleImport);
    };
  }, [state]);

  const handleProductUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = (Array.from(e.target.files) as File[]).slice(0, 5);
      const urls = files.map(f => URL.createObjectURL(f));
      setState((p: any) => ({ ...p, productFiles: files, productPreviews: urls }));
    }
  };

  const handleCharacterUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setState((p: any) => ({ ...p, characterFile: file, characterPreviewUrl: URL.createObjectURL(file) }));
    }
  };

  const handleGenerateScript = async () => {
    if (!state.healthKeyword || !state.ctaProduct) return;
    setState((p: any) => ({ ...p, isGeneratingScript: true }));
    try {
      const scripts = await service.generatePersonificationScript(
        state.healthKeyword,
        state.ctaProduct,
        state.frameCount,
        state.gender,
        state.voice,
        state.addressing,
        state.style,
        state.characterDescription
      );
      const newSegments = scripts.map((content, i) => ({
        id: i + 1,
        sceneIdea: '',
        content,
        image: { url: '', loading: false, regenNote: '' },
        videoPrompt: { text: '', loading: false, visible: false }
      }));
      setState((p: any) => ({ ...p, segments: newSegments, isGeneratingScript: false }));
    } catch (e) {
      setState((p: any) => ({ ...p, isGeneratingScript: false }));
    }
  };

  const handleGenImage = async (id: number) => {
    setState((p: any) => ({ 
      ...p, 
      segments: p.segments.map((s: any) => s.id === id ? { ...s, image: { ...s.image, loading: true } } : s) 
    }));
    
    try {
      const currentSeg = state.segments.find((s: any) => s.id === id);
      
      let productParts = [];
      if (state.productFiles.length > 0) {
        productParts = await Promise.all(state.productFiles.map((f: any) => service.fileToGenerativePart(f)));
      } else {
        productParts = state.productPreviews.map((url: string) => ({ 
          mimeType: 'image/png', 
          data: url.split(',')[1] 
        }));
      }
      
      let charPart = null;
      if (state.characterFile) {
        charPart = await service.fileToGenerativePart(state.characterFile);
      } else if (state.characterPreviewUrl?.startsWith('data:')) {
        charPart = { mimeType: 'image/png', data: state.characterPreviewUrl.split(',')[1] };
      }

      const url = await service.generatePersonificationImage(
        currentSeg.content, 
        productParts, 
        charPart,
        state.healthKeyword, 
        state.ctaProduct, 
        state.gender, 
        state.characterDescription, 
        currentSeg.sceneIdea,
        currentSeg.image.regenNote
      );
      
      setState((p: any) => ({ 
        ...p, 
        segments: p.segments.map((s: any) => s.id === id ? { ...s, image: { ...s.image, url, loading: false } } : s) 
      }));
    } catch (e) {
      setState((p: any) => ({ 
        ...p, 
        segments: p.segments.map((s: any) => s.id === id ? { ...s, image: { ...s.image, loading: false } } : s) 
      }));
    }
  };

  const handleGenPrompt = async (id: number) => {
    setState((p: any) => ({ 
      ...p, 
      segments: p.segments.map((s: any) => s.id === id ? { ...s, videoPrompt: { ...s.videoPrompt, loading: true, visible: true } } : s) 
    }));
    
    try {
      const currentSeg = state.segments.find((s: any) => s.id === id);
      const prompt = await service.generatePersonificationVeoPrompt(
        currentSeg.content, 
        state.healthKeyword, 
        state.gender, 
        state.voice, 
        state.style, 
        state.characterDescription,
        currentSeg.sceneIdea
      );
      setState((p: any) => ({ 
        ...p, 
        segments: p.segments.map((s: any) => s.id === id ? { ...s, videoPrompt: { text: prompt, loading: false, visible: true } } : s) 
      }));
    } catch (e) {
      setState((p: any) => ({ 
        ...p, 
        segments: p.segments.map((s: any) => s.id === id ? { ...s, videoPrompt: { ...s.videoPrompt, loading: false } } : s) 
      }));
    }
  };

  const handleBulkImage = async () => {
    for (const seg of state.segments) {
      await handleGenImage(seg.id);
    }
  };

  const handleBulkPrompt = async () => {
    for (const seg of state.segments) {
      await handleGenPrompt(seg.id);
    }
  };

  const downloadAllImages = async () => {
    if (typeof JSZip === 'undefined') return alert("ZIP lib not loaded");
    const zip = new JSZip();
    let count = 0;
    state.segments.forEach((seg: any, i: number) => {
      if (seg.image.url) { zip.file(`${String(i + 1).padStart(2, '0')}.png`, seg.image.url.split(',')[1], { base64: true }); count++; }
    });
    if (count === 0) return alert("Không có ảnh.");
    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement('a'); link.href = URL.createObjectURL(content); link.download = `nhan_hoa_${Date.now()}.zip`; link.click();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* CỘT TRÁI */}
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">1. Ý tưởng / Bài viết nguồn</label>
              <textarea 
                value={state.healthKeyword}
                onChange={e => setState((p: any) => ({ ...p, healthKeyword: e.target.value }))}
                placeholder="Dán bài viết hoặc ý tưởng về sức khỏe..."
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-100 outline-none transition-all font-medium text-sm h-40 resize-none leading-relaxed"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">2. Sản phẩm muốn CTA</label>
              <input 
                type="text" 
                value={state.ctaProduct}
                onChange={e => setState((p: any) => ({ ...p, ctaProduct: e.target.value }))}
                placeholder="Ví dụ: trà thải độc gan..."
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-100 outline-none font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Giới tính nhân vật</label>
                <select value={state.gender} onChange={e => setState((p: any) => ({ ...p, gender: e.target.value }))} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold">
                  <option value="Nữ">Nữ</option>
                  <option value="Nam">Nam</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Giọng điệu</label>
                <select value={state.voice} onChange={e => setState((p: any) => ({ ...p, voice: e.target.value }))} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold">
                  <option value="Miền Bắc">Miền Bắc</option>
                  <option value="Miền Nam">Miền Nam</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Cách xưng hô (Người nói - Người nghe)</label>
                <div className="relative group">
                  <input 
                    list="personification-addressing-list"
                    value={state.addressing} 
                    onChange={e => setState((p: any) => ({ ...p, addressing: e.target.value }))}
                    placeholder="VD: em - anh chị"
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-100 outline-none font-bold text-sm"
                  />
                  <datalist id="personification-addressing-list">
                    {ADDRESSING_OPTIONS.map(opt => <option key={opt} value={opt} />)}
                  </datalist>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Phong cách kịch bản</label>
                <select value={state.style} onChange={e => setState((p: any) => ({ ...p, style: e.target.value }))} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold">
                  {STYLES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI */}
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">3. Thời lượng video</label>
              <select value={state.frameCount} onChange={e => setState((p: any) => ({ ...p, frameCount: parseInt(e.target.value) }))} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-orange-600">
                {Array.from({ length: 12 }, (_, i) => i + 4).map(n => <option key={n} value={n}>{n} khung hình - {n * 8}s</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">4. Nhân vật & Bối cảnh (Tổng thể)</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div 
                  onClick={() => characterInputRef.current?.click()}
                  className="aspect-square border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center bg-slate-50 cursor-pointer hover:border-orange-400 transition-all overflow-hidden"
                >
                  {state.characterPreviewUrl ? (
                    <img src={state.characterPreviewUrl} className="w-full h-full object-cover" alt="char-ref" />
                  ) : (
                    <div className="text-center opacity-30">
                       <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                       <span className="text-[8px] font-black uppercase tracking-tighter">Ảnh nhân vật</span>
                    </div>
                  )}
                  <input type="file" ref={characterInputRef} onChange={handleCharacterUpload} className="hidden" accept="image/*" />
                </div>
                <div className="md:col-span-2">
                  <textarea 
                    value={state.characterDescription}
                    onChange={e => setState((p: any) => ({ ...p, characterDescription: e.target.value }))}
                    placeholder="Mô tả bối cảnh và ngoại hình tổng thể (VD: Quả Thận màu xanh, bối cảnh vũ trụ...)"
                    className="w-full p-4 bg-orange-50/30 border border-orange-100 rounded-2xl focus:ring-2 focus:ring-orange-100 outline-none transition-all font-medium text-xs h-full resize-none leading-relaxed"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">5. Ảnh sản phẩm mẫu (Tối đa 5)</label>
              <div onClick={() => productInputRef.current?.click()} className="min-h-[140px] border-2 border-dashed border-orange-100 rounded-2xl flex items-center justify-center bg-orange-50/30 cursor-pointer hover:bg-orange-50 transition-all overflow-hidden p-2">
                {state.productPreviews.length > 0 ? (
                  <div className="grid grid-cols-5 gap-2 w-full">{state.productPreviews.map((url: string, i: number) => <img key={i} src={url} className="w-full aspect-square object-cover rounded-lg" />)}</div>
                ) : (
                  <div className="text-center"><svg className="w-8 h-8 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tải ảnh sản phẩm</span></div>
                )}
                <input type="file" multiple ref={productInputRef} onChange={handleProductUpload} className="hidden" accept="image/*" />
              </div>
            </div>
            
            <button onClick={handleGenerateScript} disabled={state.isGeneratingScript || !state.healthKeyword || !state.ctaProduct} className="w-full py-5 bg-orange-600 text-white font-black rounded-2xl shadow-xl shadow-orange-100 hover:bg-orange-700 transition-all disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-tighter">
              {state.isGeneratingScript ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>XỬ LÝ...</> : "BẮT ĐẦU TẠO KỊCH BẢN"}
            </button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {state.segments.length > 0 && (
        <div className="space-y-12 pb-32">
          <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl gap-4">
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Kịch bản chi tiết ({state.frameCount} khung)</h3>
              <p className="text-xs text-orange-500 font-bold uppercase">{state.style} • {state.addressing}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={handleBulkImage} className="px-4 py-2 bg-orange-600 text-white text-[10px] font-black rounded-lg hover:bg-orange-700 transition-all uppercase flex items-center gap-2">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>
                Tự động tạo tất cả ảnh
              </button>
              <button onClick={handleBulkPrompt} className="px-4 py-2 bg-red-600 text-white text-[10px] font-black rounded-lg hover:bg-red-700 transition-all uppercase flex items-center gap-2">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14H11V21L20 10H13Z" /></svg>
                Tự động tạo tất cả prompt
              </button>
              <button onClick={downloadAllImages} className="px-4 py-2 bg-white text-slate-900 text-[10px] font-black rounded-lg hover:bg-slate-100 transition-all uppercase">ZIP Ảnh</button>
              <button onClick={() => { const text = state.segments.map((s: any) => s.videoPrompt.text).filter((t: string) => t).join('\n'); const blob = new Blob([text], { type: 'text/plain' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'nhan_hoa_prompts.txt'; link.click(); }} className="px-4 py-2 bg-orange-600 text-white text-[10px] font-black rounded-lg hover:bg-orange-700 transition-all uppercase">File Prompt</button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {state.segments.map((seg: any) => (
              <div key={seg.id} className="bg-white rounded-[2.5rem] border border-orange-100 shadow-sm overflow-hidden flex flex-col h-full group hover:shadow-xl transition-all">
                <div className="relative aspect-[9/16] bg-slate-100 overflow-hidden">
                  {seg.image.url ? <img src={seg.image.url} className={`w-full h-full object-cover ${seg.image.loading ? 'blur-sm grayscale opacity-50' : ''}`} /> : null}
                  
                  {seg.image.loading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-black/5 backdrop-blur-[2px]">
                      <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="mt-4 text-[10px] font-black text-orange-600 uppercase tracking-widest animate-pulse">Đang xử lý ảnh...</span>
                    </div>
                  ) : !seg.image.url && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center opacity-30">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ready to Gen</span>
                    </div>
                  )}
                  
                  <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-black px-4 py-2 rounded-full border border-white/10">CẢNH #{seg.id}</div>
                </div>

                <div className="p-6 flex flex-col flex-1 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-orange-600 uppercase tracking-wider">Ý tưởng & bối cảnh cảnh này:</label>
                    <textarea 
                      value={seg.sceneIdea || ''} 
                      onChange={e => setState((p: any) => ({ ...p, segments: p.segments.map((s: any) => s.id === seg.id ? { ...s, sceneIdea: e.target.value } : s) }))} 
                      placeholder="Ví dụ: Một củ khoai tây cute đang nằm trong vườn..." 
                      className="w-full h-20 p-3 text-xs font-bold text-slate-600 bg-orange-50/50 border border-orange-100 rounded-xl outline-none resize-none leading-relaxed placeholder:text-slate-300 focus:bg-white transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-orange-600 uppercase tracking-wider">Lời thoại kịch bản:</label>
                    <textarea 
                      value={seg.content} 
                      onChange={e => setState((p: any) => ({ ...p, segments: p.segments.map((s: any) => s.id === seg.id ? { ...s, content: e.target.value } : s) }))} 
                      className="w-full h-32 p-3 text-xs font-bold text-orange-900 bg-orange-50/30 border border-orange-100 rounded-xl outline-none resize-none leading-relaxed focus:bg-white" 
                    />
                    <div className="text-right"><span className={`text-[8px] font-black ${seg.content.length > 190 ? 'text-red-500' : 'text-slate-300'}`}>{seg.content.length}/190</span></div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Ghi chú sửa ảnh:</label>
                    <input 
                      type="text"
                      value={seg.image.regenNote || ''} 
                      onChange={e => setState((p: any) => ({ ...p, segments: p.segments.map((s: any) => s.id === seg.id ? { ...s, image: { ...s.image, regenNote: e.target.value } } : s) }))} 
                      placeholder="VD: Không có sản phẩm, thêm nắng..." 
                      className="w-full p-3 text-[10px] font-bold text-orange-600 bg-orange-50/30 border border-orange-100 rounded-xl outline-none"
                    />
                  </div>

                  <div className="mt-auto grid grid-cols-2 gap-2 pt-4 border-t border-slate-50">
                    <button 
                      onClick={() => handleGenImage(seg.id)} 
                      disabled={seg.image.loading} 
                      className="py-3 bg-orange-600 text-white text-[10px] font-black rounded-xl hover:bg-orange-700 transition-all uppercase tracking-tighter disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {seg.image.loading ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (seg.image.url ? "Tạo lại" : "Vẽ ảnh 3D")}
                    </button>
                    <button 
                      onClick={() => handleGenPrompt(seg.id)} 
                      disabled={seg.videoPrompt.loading} 
                      className="py-3 bg-orange-50 text-orange-600 text-[10px] font-black rounded-xl border border-orange-100 hover:bg-orange-100 transition-all uppercase tracking-tighter disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {seg.videoPrompt.loading ? <div className="w-3 h-3 border-orange-600 border-t-transparent rounded-full animate-spin"></div> : "Prompt"}
                    </button>
                  </div>
                </div>

                {seg.videoPrompt.visible && (
                  <div className="p-4 bg-slate-900 border-t border-slate-800 animate-slideUp">
                    <div className="flex justify-between items-center mb-2"><span className="text-[8px] font-black text-orange-500 uppercase">VEO-3 Prompt</span><button onClick={() => navigator.clipboard.writeText(seg.videoPrompt.text)} className="text-[8px] font-black text-white underline uppercase">Copy</button></div>
                    {seg.videoPrompt.loading ? (
                      <div className="h-8 flex items-center justify-center"><div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div></div>
                    ) : (
                      <p className="text-[9px] text-slate-300 italic opacity-80 leading-tight">"{seg.videoPrompt.text}"</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonificationModule;