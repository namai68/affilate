
import React, { useState, useEffect, useRef } from 'react';
import * as service from '../services/personification2Service';
import { Personification2Segment, AnalyzedCharacter } from '../types';

declare var JSZip: any;

const VOICE_OPTIONS = [
  "Giọng Bắc 20-40 tuổi",
  "Giọng Nam 20-40 tuổi",
  "Giọng Bắc 50-60 tuổi",
  "Giọng Nam 50-60 tuổi",
  "Giọng Bắc 60-80 tuổi",
  "Giọng Nam 60-80 tuổi"
];

const ADDRESSING_OPTIONS = [
  "em - anh chị",
  "tui - mấy bà",
  "mình - cả nhà",
  "tớ - các cậu",
  "mình - các bạn",
  "tao - mày",
  "tui - mấy ní",
  "tui - các bác",
  "tui - mấy ông",
  "mình - mọi người"
];

const SCENE_COUNT_OPTIONS = Array.from({ length: 21 }, (_, i) => {
    const count = i + 3;
    const seconds = count * 8;
    return { count, label: `${count} cảnh - ${seconds}s` };
});

const Personification2Module: React.FC = () => {
  const storageKey = "personification2_v22_final_limits";
  const [originalScript, setOriginalScript] = useState('');
  const [gender, setGender] = useState('Nữ');
  const [voice, setVoice] = useState(VOICE_OPTIONS[0]);
  const [addressing, setAddressing] = useState('');
  const [imageStyle, setImageStyle] = useState<'Realistic' | '3D'>('Realistic');
  const [personDescription, setPersonDescription] = useState('');
  const [contextNote, setContextNote] = useState('');
  const [sceneCount, setSceneCount] = useState(5);
  const [analyzedCharacters, setAnalyzedCharacters] = useState<AnalyzedCharacter[]>([]);
  const [personPreviews, setPersonPreviews] = useState<string[]>([]);
  const [isAnalyzingPerson, setIsAnalyzingPerson] = useState(false);
  const [isPersonified, setIsPersonified] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [segments, setSegments] = useState<Personification2Segment[]>([]);

  const localJsonRef = useRef<HTMLInputElement>(null);
  const segmentFileInputRef = useRef<HTMLInputElement>(null);
  const personInputRef = useRef<HTMLInputElement>(null);
  const [activeSegmentForUpload, setActiveSegmentForUpload] = useState<number | null>(null);

  // Khôi phục dữ liệu từ LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setOriginalScript(parsed.originalScript || '');
        setGender(parsed.gender || 'Nữ');
        setVoice(parsed.voice || VOICE_OPTIONS[0]);
        setAddressing(parsed.addressing || '');
        setImageStyle(parsed.imageStyle || 'Realistic');
        setPersonDescription(parsed.personDescription || '');
        setContextNote(parsed.contextNote || '');
        setSceneCount(parsed.sceneCount || 5);
        setAnalyzedCharacters(parsed.analyzedCharacters || []);
        setPersonPreviews(parsed.personPreviews || []);
        setIsPersonified(parsed.isPersonified !== undefined ? parsed.isPersonified : true);
        setSegments((parsed.segments || []).map((s: any) => ({
          ...s,
          speaker: s.speaker || 'Object',
          image: { ...s.image, url: s.image?.url || '', loading: false },
          videoPrompt: { ...s.videoPrompt, loading: false }
        })));
      } catch (e) {}
    }
  }, []);

  // Đồng bộ dữ liệu vào LocalStorage
  useEffect(() => {
    const toSave = { 
      originalScript, gender, voice, addressing, imageStyle,
      personDescription, contextNote, sceneCount, analyzedCharacters,
      personPreviews, isPersonified,
      segments: segments.map(s => ({ 
        ...s, 
        image: { ...s.image, loading: false },
        videoPrompt: { ...s.videoPrompt, loading: false }
      })) 
    };
    try {
      localStorage.setItem(storageKey, JSON.stringify(toSave));
    } catch (e) {}
  }, [originalScript, gender, voice, addressing, imageStyle, personDescription, contextNote, sceneCount, analyzedCharacters, personPreviews, isPersonified, segments]);

  const processImportData = async (importedData: any) => {
    try {
      if (!Array.isArray(importedData) || importedData.length === 0) {
        throw new Error("Dữ liệu JSON không hợp lệ.");
      }
      window.dispatchEvent(new CustomEvent('IMPORT_DATA_PROGRESS', { detail: { percent: 10, complete: false } }));
      const firstItem = importedData[0] || {};
      const inputs = firstItem.inputs || {};
      const settings = inputs.settings || {};
      setOriginalScript(inputs.originalScript || '');
      setPersonDescription(inputs.personDescription || '');
      setContextNote(inputs.contextNote || '');
      setSceneCount(inputs.sceneCount || importedData.length);
      setAnalyzedCharacters(inputs.analyzedCharacters || []);
      setPersonPreviews(inputs.personPreviews || []);
      setGender(settings.gender || 'Nữ');
      setVoice(settings.voice || VOICE_OPTIONS[0]);
      setAddressing(settings.addressing || '');
      setImageStyle(settings.imageStyle || 'Realistic');
      setIsPersonified(settings.isPersonified !== undefined ? settings.isPersonified : true);
      const newSegments: Personification2Segment[] = [];
      for (let i = 0; i < importedData.length; i++) {
        const item = importedData[i];
        if (!item) continue;
        const itemInputs = item.inputs || {};
        const segData = itemInputs.segmentData || {};
        newSegments.push({
          id: i + 1,
          content: item.script || '',
          characterIdea: segData.characterIdea || '',
          speaker: segData.speaker || 'Object',
          image: { url: item.outputImage || '', loading: false },
          videoPrompt: { text: item.videoPrompt || '', loading: false, visible: !!item.videoPrompt }
        });
        const percent = Math.round(((i + 1) / importedData.length) * 100);
        window.dispatchEvent(new CustomEvent('IMPORT_DATA_PROGRESS', { detail: { percent, complete: i === importedData.length - 1 } }));
        await new Promise(r => setTimeout(r, 20));
      }
      setSegments(newSegments);
    } catch (error: any) {
      alert("Lỗi khi nạp dự án!");
      window.dispatchEvent(new CustomEvent('IMPORT_DATA_PROGRESS', { detail: { percent: 100, complete: true } }));
    }
  };

  useEffect(() => {
    const handleGlobalExport = () => {
      const exportData = segments.map((seg, index) => ({
        stt: index + 1,
        inputs: {
          originalScript, personDescription, contextNote, sceneCount,
          analyzedCharacters, personPreviews,
          settings: { gender, voice, addressing, imageStyle, isPersonified },
          segmentData: { characterIdea: seg.characterIdea, speaker: seg.speaker }
        },
        script: seg.content,
        outputImage: seg.image?.url || '',
        videoPrompt: seg.videoPrompt?.text || ''
      }));
      window.dispatchEvent(new CustomEvent('EXPORT_DATA_READY', { detail: { data: exportData, moduleName: 'Nhan_Hoa_2_Project' } }));
    };
    const handleGlobalImport = (e: any) => processImportData(e.detail);
    window.addEventListener('REQUEST_EXPORT_DATA', handleGlobalExport);
    window.addEventListener('REQUEST_IMPORT_DATA', handleGlobalImport);
    return () => {
      window.removeEventListener('REQUEST_EXPORT_DATA', handleGlobalExport);
      window.removeEventListener('REQUEST_IMPORT_DATA', handleGlobalImport);
    };
  }, [segments, originalScript, gender, voice, addressing, imageStyle, personDescription, contextNote, sceneCount, analyzedCharacters, personPreviews, isPersonified]);

  const handleSplitScript = async () => {
    if (!originalScript.trim()) return;
    setIsProcessing(true);
    try {
      const splitTexts = await service.splitScriptIntoSegments(originalScript, voice, addressing, sceneCount);
      setSegments(splitTexts.map((text, i) => ({
        id: i + 1,
        content: text,
        characterIdea: '',
        speaker: 'Object',
        image: { url: '', loading: false },
        videoPrompt: { text: '', loading: false, visible: false }
      })));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAnalyzePerson = async () => {
    if (!personDescription.trim()) return;
    setIsAnalyzingPerson(true);
    try {
      const characters = await service.analyzePersonDescription(personDescription);
      setAnalyzedCharacters(characters);
    } finally {
      setIsAnalyzingPerson(false);
    }
  };

  const handleDeleteCharacter = (e: React.MouseEvent, idx: number) => {
    e.preventDefault();
    e.stopPropagation();
    setAnalyzedCharacters(prev => prev.filter((_, i) => i !== idx));
  };

  const handlePersonFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const readers = Array.from(files).slice(0, 2).map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target?.result as string);
          reader.readAsDataURL(file);
        });
      });
      Promise.all(readers).then(urls => {
        setPersonPreviews(prev => [...prev, ...urls].slice(0, 2));
      });
    }
    e.target.value = "";
  };

  const removePersonPreview = (idx: number) => {
    setPersonPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleGenImage = async (id: number) => {
    const seg = segments.find(s => s.id === id);
    if (!seg) return;
    setSegments(prev => prev.map(s => s.id === id ? { ...s, image: { ...s.image, loading: true } } : s));
    try {
      const personParts = personPreviews.map(url => ({
        mimeType: 'image/png',
        data: url.split(',')[1]
      }));
      const url = await service.generatePersonifiedImage(
        seg.content, seg.characterIdea, gender, imageStyle, seg.speaker, isPersonified, seg.speaker, personParts, contextNote
      );
      setSegments(prev => prev.map(s => s.id === id ? { ...s, image: { ...s.image, url, loading: false } } : s));
    } catch (e) {
      setSegments(prev => prev.map(s => s.id === id ? { ...s, image: { ...s.image, loading: false, error: 'Lỗi' } } : s));
    }
  };

  const handleGenPrompt = async (id: number) => {
    const seg = segments.find(s => s.id === id);
    if (!seg) return;
    setSegments(prev => prev.map(s => s.id === id ? { ...s, videoPrompt: { ...s.videoPrompt, loading: true, visible: true } } : s));
    try {
      const prompt = await service.generateVideoPromptV2(
        seg.content, seg.characterIdea, gender, voice, imageStyle, seg.speaker, isPersonified, seg.speaker, seg.image.url
      );
      setSegments(prev => prev.map(s => s.id === id ? { ...s, videoPrompt: { text: prompt, loading: false, visible: true } } : s));
    } catch (e) {
      setSegments(prev => prev.map(s => s.id === id ? { ...s, videoPrompt: { ...s.videoPrompt, loading: false } } : s));
    }
  };

  const handleBulkImage = async () => {
    for (const s of segments) await handleGenImage(s.id);
  };

  const handleBulkPrompt = async () => {
    for (const s of segments) await handleGenPrompt(s.id);
  };

  const downloadAllImagesZip = async () => {
    if (typeof JSZip === 'undefined') return alert("ZIP Lib error");
    const zip = new JSZip();
    let count = 0;
    segments.forEach((s, i) => {
      if (s.image.url) {
        zip.file(`${String(i + 1).padStart(2, '0')}.png`, s.image.url.split(',')[1], { base64: true });
        count++;
      }
    });
    if (count === 0) return alert("Không có ảnh để tải");
    const content = await (zip as any).generateAsync({ type: "blob" }); 
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content as any);
    link.download = `nhan_hoa_2_images.zip`;
    link.click();
  };

  const handleDeleteImage = (id: number) => {
    setSegments(prev => prev.map(s => s.id === id ? { ...s, image: { ...s.image, url: '', loading: false } } : s));
  };

  const handleLocalExportJson = () => {
    const exportData = segments.map((seg, index) => ({
      stt: index + 1,
      inputs: {
        originalScript, personDescription, contextNote, sceneCount,
        analyzedCharacters, personPreviews,
        settings: { gender, voice, addressing, imageStyle, isPersonified },
        segmentData: { characterIdea: seg.characterIdea, speaker: seg.speaker }
      },
      script: seg.content,
      outputImage: seg.image?.url || '',
      videoPrompt: seg.videoPrompt?.text || ''
    }));
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nhan_hoa_2_export_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <input type="file" ref={segmentFileInputRef} className="hidden" accept="image/*" onChange={(e) => {
        const file = e.target.files?.[0];
        if (file && activeSegmentForUpload !== null) {
          const reader = new FileReader();
          reader.onload = (event) => setSegments(prev => prev.map(s => s.id === activeSegmentForUpload ? { ...s, image: { ...s.image, url: event.target?.result as string, loading: false } } : s));
          reader.readAsDataURL(file);
        }
        e.target.value = "";
      }} />

      <div className="bg-white rounded-[2rem] border border-orange-200 p-8 shadow-sm mb-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center px-1">
             <label className="block text-[10px] font-black text-orange-400 uppercase tracking-widest flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeWidth="2.5"/></svg>
                1. Kịch bản văn bản gốc
             </label>
             <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Hybrid Mode 2.0</span>
          </div>
          <textarea 
            value={originalScript}
            onChange={e => setOriginalScript(e.target.value)}
            placeholder="Dán kịch bản của bạn vào đây..."
            className="w-full h-32 p-5 bg-orange-50/30 border border-orange-100 rounded-3xl focus:ring-2 focus:ring-orange-100 outline-none transition-all font-medium text-sm leading-relaxed resize-none shadow-inner"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 px-1">Giới tính</label>
              <select value={gender} onChange={e => setGender(e.target.value)} className="w-full p-3 bg-white border border-orange-100 rounded-xl font-bold outline-none focus:border-orange-500 shadow-sm">
                <option value="Nữ">Nữ</option>
                <option value="Nam">Nam</option>
              </select>
            </div>
            <div className="md:col-span-3 space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 px-1">Vùng miền</label>
              <select value={voice} onChange={e => setVoice(e.target.value)} className="w-full p-3 bg-white border border-orange-100 rounded-xl font-bold outline-none focus:border-orange-500 shadow-sm">
                {VOICE_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div className="md:col-span-4 space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 px-1">Xưng hô</label>
              <input 
                list="nhanhoa2-addr-list"
                value={addressing} 
                onChange={e => setAddressing(e.target.value)}
                placeholder="VD: em - anh chị"
                className="w-full p-3 bg-white border border-orange-100 rounded-xl font-bold outline-none focus:border-orange-500 text-sm shadow-sm"
              />
              <datalist id="nhanhoa2-addr-list">
                {ADDRESSING_OPTIONS.map(opt => <option key={opt} value={opt} />)}
              </datalist>
            </div>
            <div className="md:col-span-3 space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 px-1">Số cảnh</label>
              <select 
                value={sceneCount} 
                onChange={e => setSceneCount(parseInt(e.target.value))} 
                className="w-full p-3 bg-white border border-orange-100 rounded-xl font-bold text-orange-600 outline-none focus:border-orange-500 shadow-sm"
              >
                {SCENE_COUNT_OPTIONS.map(opt => <option key={opt.count} value={opt.count}>{opt.label}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-9 space-y-1.5">
                    <label className="block text-[10px] font-black text-orange-600 uppercase tracking-widest px-1 flex items-center gap-2">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" strokeWidth="2.5"/></svg>
                        Nhân vật xuất hiện
                    </label>
                    <input 
                        type="text"
                        value={personDescription}
                        onChange={e => setPersonDescription(e.target.value)}
                        placeholder="VD: Một cô Vy và một anh shipper..."
                        className="w-full p-4 bg-orange-50/50 border border-orange-100 rounded-2xl focus:ring-2 focus:ring-orange-100 outline-none transition-all font-bold text-sm shadow-inner"
                    />
                </div>
                <div className="md:col-span-3">
                    <button 
                        onClick={handleAnalyzePerson}
                        disabled={isAnalyzingPerson || !personDescription.trim()}
                        className="w-full py-4 bg-orange-600 text-white font-black rounded-2xl shadow-lg hover:bg-orange-700 transition-all uppercase text-[10px] tracking-widest disabled:opacity-50"
                    >
                        {isAnalyzingPerson ? "ĐANG LẤY TÊN..." : "XÁC NHẬN NHÂN VẬT"}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 px-1">Phong cách bối cảnh</label>
                    <div className="flex bg-slate-50 p-1 rounded-xl border border-orange-100 h-[46px] shadow-sm">
                        <button onClick={() => setImageStyle('Realistic')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${imageStyle === 'Realistic' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Chân thực</button>
                        <button onClick={() => setImageStyle('3D')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${imageStyle === '3D' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>3D</button>
                    </div>
                </div>
                <div className="space-y-1.5">
                    {analyzedCharacters.length > 0 && (
                        <div className="w-full p-3 bg-red-50 border border-red-100 rounded-xl animate-fadeIn">
                            <span className="text-[9px] font-black text-red-700 uppercase px-1">Danh sách nhân vật:</span>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {analyzedCharacters.map((c, idx) => (
                                    <div key={`${c.name}-${idx}`} className="group relative flex items-center bg-white border border-red-200 px-3 py-1.5 rounded-full shadow-sm">
                                        <span className="text-[10px] text-red-800 font-bold uppercase">{c.name}</span>
                                        <button 
                                            onClick={(e) => handleDeleteCharacter(e, idx)}
                                            className="ml-2 w-5 h-5 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all text-[10px]"
                                        >✕</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-6 bg-orange-50/20 border border-orange-100 rounded-[2rem] space-y-6">
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-2">
                           <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth="2.5"/></svg>
                           Ảnh nhân vật mẫu (Khóa ngoại hình)
                        </label>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                        {personPreviews.map((url, i) => (
                            <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-orange-200 group shadow-sm">
                                <img src={url} className="w-full h-full object-cover" />
                                <button onClick={() => removePersonPreview(i)} className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        ))}
                        {personPreviews.length < 2 && (
                            <div 
                                onClick={() => personInputRef.current?.click()}
                                className="aspect-square border-2 border-dashed border-orange-300 rounded-2xl flex flex-col items-center justify-center bg-white cursor-pointer hover:border-orange-400 transition-all group"
                            >
                                <svg className="w-6 h-6 text-orange-300 group-hover:text-orange-500" fill="none" stroke="currentColor" viewBox="24 24"><path d="M12 4v16m8-8H4" /></svg>
                                <span className="text-[8px] font-black text-orange-400 mt-1 uppercase">THÊM ẢNH</span>
                            </div>
                        )}
                    </div>
                    <input type="file" multiple ref={personInputRef} className="hidden" accept="image/*" onChange={handlePersonFileChange} />
                </div>

                <div className="space-y-1.5 border-t border-orange-100 pt-4">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Ghi chú bối cảnh chung</label>
                    <textarea 
                        value={contextNote}
                        onChange={e => setContextNote(e.target.value)}
                        placeholder="VD: Trong quán cà phê hiện đại, ánh sáng ấm, phong cách vintage..."
                        className="w-full h-20 p-4 bg-white border border-orange-100 rounded-2xl focus:ring-2 focus:ring-orange-100 outline-none transition-all text-xs font-medium resize-none shadow-inner"
                    />
                </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 border-t border-orange-50 mt-4">
            <button 
              onClick={handleSplitScript}
              disabled={isProcessing || !originalScript.trim()}
              className="w-full sm:w-auto px-12 py-4 bg-orange-600 text-white font-black rounded-2xl shadow-xl hover:bg-orange-700 transition-all uppercase tracking-widest disabled:opacity-50 text-sm"
            >
              {isProcessing ? "ĐANG TRIỂN KHAI..." : "TRIỂN KHAI KỊCH BẢN"}
            </button>

            <div className="flex items-center gap-3 px-1">
                 <div className="text-right">
                    <span className={`text-[10px] font-black uppercase block leading-tight transition-colors ${isPersonified ? 'text-orange-600' : 'text-slate-400'}`}>Nhân hóa vật thể</span>
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">Tắt = Xóa vật thể</span>
                 </div>
                 <button onClick={() => setIsPersonified(!isPersonified)} className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${isPersonified ? 'bg-orange-600' : 'bg-slate-300'}`}>
                    <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${isPersonified ? 'translate-x-7' : 'translate-x-0'}`}></div>
                 </button>
            </div>
          </div>
        </div>
      </div>

      {segments.length > 0 && (
        <div className="space-y-12 pb-32">
          <div className="bg-orange-950 p-6 rounded-3xl border border-orange-900 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                  <h3 className="text-white font-black text-lg uppercase tracking-tight">Kịch bản chi tiết ({segments.length} cảnh)</h3>
                  <p className="text-[10px] text-orange-400 font-bold uppercase mt-1 tracking-widest">HỆ THỐNG ĐÃ SẴN SÀNG</p>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                  <button onClick={handleBulkImage} className="px-6 py-3 bg-orange-600 text-white text-[10px] font-black rounded-xl hover:bg-orange-700 transition-all uppercase shadow-lg shadow-orange-900/40">Vẽ tất cả ảnh</button>
                  <button onClick={handleBulkPrompt} className="px-6 py-3 bg-white text-orange-600 text-[10px] font-black rounded-xl hover:bg-orange-50 transition-all uppercase shadow-lg">Viết tất cả prompt</button>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {segments.map((seg) => (
                <div key={seg.id} className="bg-white rounded-[2.5rem] border border-orange-100 shadow-sm overflow-hidden flex flex-col h-full group hover:shadow-xl transition-all">
                  <div className="relative aspect-[9/16] bg-slate-100">
                    {seg.image.url ? (
                      <>
                        <img src={seg.image.url} className="w-full h-full object-cover" />
                        <button onClick={() => handleDeleteImage(seg.id)} className="absolute top-4 right-4 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-700 transition-all z-10">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="3"/></svg>
                        </button>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                        <button onClick={() => { setActiveSegmentForUpload(seg.id); segmentFileInputRef.current?.click(); }} className="px-4 py-2 bg-orange-50 text-orange-600 rounded-xl text-[10px] font-black hover:bg-orange-100 transition-all uppercase border border-orange-100 shadow-sm">Tải ảnh lên</button>
                      </div>
                    )}
                    {seg.image.loading && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/5 backdrop-blur-sm z-20">
                        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin shadow-lg"></div>
                        <span className="mt-4 text-[10px] font-black text-orange-600 uppercase tracking-widest animate-pulse">Đang vẽ...</span>
                      </div>
                    )}
                    <div className="absolute top-4 left-4 bg-orange-900/80 backdrop-blur-md text-white text-[10px] font-black px-4 py-2 rounded-full shadow-md">CẢNH #{seg.id}</div>
                  </div>

                  <div className="p-6 space-y-4 flex flex-col flex-1">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center px-1">
                         <label className="text-[9px] font-black text-orange-600 uppercase">Lời thoại {seg.id}:</label>
                         <span className={`text-[10px] px-2 py-0.5 rounded-full font-black tabular-nums shadow-sm ${seg.content.length >= 140 && seg.content.length <= 160 ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-500'}`}>
                            {seg.content.length}/160
                         </span>
                      </div>
                      <textarea value={seg.content} onChange={e => setSegments(prev => prev.map(s => s.id === seg.id ? { ...s, content: e.target.value } : s))} className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:bg-white resize-none shadow-inner" />
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-1">
                          <label className="text-[9px] font-black text-red-600 uppercase px-1">{isPersonified ? "Mô tả vật thể:" : "Vật thể bị ẩn"}</label>
                          <textarea 
                            value={seg.characterIdea} 
                            onChange={e => setSegments(prev => prev.map(s => s.id === seg.id ? { ...s, characterIdea: e.target.value } : s))} 
                            disabled={!isPersonified}
                            placeholder={isPersonified ? "Miếng sườn có tay chân..." : "Không có vật thể..."} 
                            className={`w-full h-16 p-3 border rounded-2xl text-[11px] font-medium outline-none focus:bg-white resize-none shadow-inner ${isPersonified ? 'bg-red-50/30 border-red-100' : 'bg-slate-100 border-slate-200 opacity-50'}`} 
                          />
                      </div>

                      <div className="space-y-1">
                          <label className="text-[9px] font-black text-orange-600 uppercase px-1">Ai đang nói?</label>
                          <select 
                              value={seg.speaker} 
                              onChange={e => setSegments(prev => prev.map(s => s.id === seg.id ? { ...s, speaker: e.target.value } : s))}
                              className="w-full p-2.5 bg-orange-50 border border-orange-100 rounded-xl text-[10px] font-black outline-none uppercase text-orange-700 shadow-sm"
                          >
                              <option value="Object">Vật thể nhân hóa</option>
                              {analyzedCharacters.map((char, idx) => (
                                <option key={`${char.name}-${idx}`} value={char.name}>{char.name}</option>
                              ))}
                          </select>
                      </div>
                    </div>

                    <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
                      <button onClick={() => handleGenImage(seg.id)} disabled={seg.image.loading} className="py-3 bg-orange-900 text-white text-[10px] font-black rounded-xl uppercase hover:bg-black transition-all shadow-md">Vẽ ảnh</button>
                      <button onClick={() => handleGenPrompt(seg.id)} disabled={seg.videoPrompt.loading} className="py-3 bg-red-100 text-red-700 text-[10px] font-black rounded-xl uppercase border border-red-200 shadow-sm">Prompt</button>
                    </div>
                  </div>

                  {seg.videoPrompt.visible && (
                    <div className="p-4 bg-orange-950 border-t border-orange-900 animate-slideUp">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[8px] font-black text-red-400 uppercase tracking-widest">Video Prompt Ready</span>
                        <button onClick={() => navigator.clipboard.writeText(seg.videoPrompt.text)} className="text-[8px] text-white underline font-black uppercase">Copy</button>
                      </div>
                      {seg.videoPrompt.loading ? <div className="h-8 flex items-center justify-center"><div className="w-4 h-4 border-2 border-red-500 border-t-white rounded-full animate-spin"></div></div> : <p className="text-[9px] text-orange-200 italic leading-snug">"{seg.videoPrompt.text}"</p>}
                    </div>
                  )}
                </div>
            ))}
          </div>

          <div className="flex flex-col gap-10 py-12 border-t border-orange-100">
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
               <button onClick={() => localJsonRef.current?.click()} className="w-full md:w-auto px-10 py-4 bg-orange-50 text-orange-600 font-black rounded-2xl border border-orange-100 hover:bg-orange-100 transition-all flex items-center justify-center gap-3 uppercase text-[11px] tracking-widest shadow-sm">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 0l-3 3m3-3l3 3" strokeWidth="2.5"/></svg>
                 Tải Dự Án (JSON)
               </button>
               <input type="file" ref={localJsonRef} onChange={e => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = (event) => processImportData(JSON.parse(event.target?.result as string)); reader.readAsText(file); } e.target.value = ""; }} className="hidden" accept="application/json" />
               <button onClick={handleLocalExportJson} className="w-full md:w-auto px-10 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white font-black rounded-2xl hover:shadow-orange-200 transition-all flex items-center justify-center gap-3 uppercase text-[11px] tracking-widest shadow-lg">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 0l-3 3m3-3l3 3" strokeWidth="2.5"/></svg>
                 Lưu Dự Án (JSON)
               </button>
            </div>
            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                <button onClick={downloadAllImagesZip} className="w-full md:w-auto px-12 py-5 bg-orange-900 text-white font-black rounded-3xl shadow-xl hover:bg-black transition-all flex items-center justify-center gap-4 uppercase tracking-widest text-base shadow-orange-200/20">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Tải bộ ảnh (ZIP)
                </button>
                <button onClick={() => { const text = segments.map(s => s.videoPrompt.text).filter(t => t).join('\n'); const blob = new Blob([text], { type: 'text/plain' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'prompts.txt'; link.click(); }} className="w-full md:w-auto px-12 py-5 bg-gradient-to-r from-red-600 to-orange-600 text-white font-black rounded-3xl shadow-xl hover:opacity-90 transition-all flex items-center justify-center gap-4 uppercase tracking-widest text-base shadow-orange-200/20">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1.01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Tải Prompt (TXT)
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Personification2Module;
