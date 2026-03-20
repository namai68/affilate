
import React, { useState, useRef, useEffect } from 'react';
import * as service from '../services/shopee8sService';
import { Shopee8sProduct, ScriptParts, VideoPromptState, GeneratedImage } from '../types';
import ScriptSection from '../components/ScriptSection';
import ImageCard from '../components/ImageCard';

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

const Shopee8sModule: React.FC = () => {
  const storageKey = "shopee8s_project_v8_voice_addressing";
  const [products, setProducts] = useState<Shopee8sProduct[]>(
    Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      name: '',
      usp: '',
      background: '',
      action: '',
      file: null,
      previewUrl: null,
      script: null,
      images: {},
      videoPrompts: {},
      isLoading: false
    }))
  );
  
  const [activeProductId, setActiveProductId] = useState<number>(1);
  const [faceFile, setFaceFile] = useState<File | null>(null);
  const [facePreview, setFacePreview] = useState<string | null>(null);
  const [gender, setGender] = useState<string>('Nữ');
  const [voice, setVoice] = useState<string>(VOICE_OPTIONS[0]);
  const [addressing, setAddressing] = useState<string>('');
  const [imageStyle, setImageStyle] = useState<'Realistic' | '3D'>('Realistic');
  const [commonNote, setCommonNote] = useState('');
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);

  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const faceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.products) {
          setProducts(prev => prev.map(p => {
            const savedP = parsed.products.find((sp: any) => sp.id === p.id);
            return savedP ? { 
              ...p, 
              ...savedP, 
              file: null, 
              previewUrl: null, 
              isLoading: false,
              images: savedP.images || {},
              videoPrompts: savedP.videoPrompts || {}
            } : p;
          }));
        }
        if (parsed.commonNote) setCommonNote(parsed.commonNote);
        if (parsed.gender) setGender(parsed.gender);
        if (parsed.voice) setVoice(parsed.voice);
        if (parsed.addressing) setAddressing(parsed.addressing);
        if (parsed.imageStyle) setImageStyle(parsed.imageStyle);
      }
    } catch (e) {}
  }, []);

  const handleGenerateAll = async () => {
    const productsToGen = products.filter(p => p.file && p.name);
    if (productsToGen.length === 0) {
      alert("Vui lòng tải ảnh và nhập tên cho ít nhất một sản phẩm.");
      return;
    }
    setIsGlobalLoading(true);
    try {
      const results = await Promise.all(productsToGen.map(async (p) => {
          const script = await service.generateShopee8sScript(p.name, p.usp, voice, addressing, gender);
          const initialImages: any = {}; const initialPrompts: any = {};
          ['v1', 'v2', 'v3', 'v4'].forEach(k => {
            initialImages[k] = { url: '', loading: false, customPrompt: '' };
            initialPrompts[k] = { text: '', loading: false, visible: false };
          });
          return { id: p.id, script, initialImages, initialPrompts };
      }));
      setProducts(prev => prev.map(p => {
        const res = results.find(r => r.id === p.id);
        return res ? { ...p, script: res.script, images: res.initialImages, videoPrompts: res.initialPrompts } : p;
      }));
    } finally { setIsGlobalLoading(false); }
  };

  const handleGenImageForKey = async (productId: number, key: string) => {
    const product = products.find(p => p.id === productId);
    if (!product || !product.file || !product.script) return;
    
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, images: { ...p.images, [key]: { ...p.images[key], loading: true } } } : p));
    try {
        const imagePart = await service.fileToGenerativePart(product.file);
        const facePart = facePreview ? { mimeType: 'image/png', data: facePreview.split(',')[1] } : null;
        const imgUrl = await service.generateShopee8sImage(
            [imagePart], product.name, (product.script as any)[key], commonNote, facePart, key === 'v2' || key === 'v4', imageStyle, gender
        );
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, images: { ...p.images, [key]: { ...p.images[key], url: imgUrl, loading: false } } } : p));
    } catch (e) {
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, images: { ...p.images, [key]: { ...p.images[key], loading: false, error: 'Lỗi' } } } : p));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white rounded-[2rem] border border-orange-100 p-8 shadow-sm space-y-8">
        <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-100 rounded-xl text-orange-600">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66-1.34-3-3-3zm7 17H5V8h14v12zm-7-8c-1.66 0-3-1.34-3-3H9c0 1.66 1.34 3 3 3s3-1.34 3-3h-2c0 1.66-1.34-3-3 3z"/></svg>
            </div>
            <h2 className="text-xl font-black text-orange-900 uppercase tracking-tight">Kịch bản bộ Shopee Video (Batch Processing)</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {products.map((p) => (
            <div key={p.id} onClick={() => setActiveProductId(p.id)} className={`flex flex-col rounded-2xl border-2 p-3 transition-all cursor-pointer ${activeProductId === p.id ? 'border-orange-600 bg-white ring-4 ring-orange-50 shadow-lg' : 'border-orange-50 bg-orange-50/30 hover:border-orange-200'}`}>
              <div className="aspect-[4/5] bg-white rounded-xl border border-dashed border-orange-200 mb-4 flex flex-col items-center justify-center overflow-hidden relative">
                {p.previewUrl ? <img src={p.previewUrl} className="w-full h-full object-cover" /> : <div className="text-center opacity-30"><svg className="w-8 h-8 mx-auto mb-1 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" /></svg><span className="text-[8px] font-black uppercase text-orange-900">OUTFIT {p.id}</span></div>}
                <input type="file" ref={el => { fileInputRefs.current[p.id] = el; }} onChange={e => { if (e.target.files?.[0]) setProducts(prev => prev.map(item => item.id === p.id ? { ...item, file: e.target.files![0], previewUrl: URL.createObjectURL(e.target.files![0]) } : item)) }} className="hidden" accept="image/*" />
              </div>
              <input type="text" value={p.name} onChange={e => setProducts(prev => prev.map(item => item.id === p.id ? { ...item, name: e.target.value } : item))} placeholder="Tên sản phẩm..." className="w-full text-[10px] p-2 bg-white border border-orange-100 rounded-lg outline-none font-bold focus:border-orange-500" />
              <input type="text" value={p.usp} onChange={e => setProducts(prev => prev.map(item => item.id === p.id ? { ...item, usp: e.target.value } : item))} placeholder="USP chính..." className="w-full text-[10px] mt-1 p-2 bg-white border border-orange-100 rounded-lg outline-none font-bold focus:border-orange-500" />
            </div>
          ))}
        </div>

        <div className="bg-orange-50/50 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[11px] font-black text-orange-700 uppercase block px-1 flex items-center gap-1.5"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeWidth={2.5} /></svg> Giới tính</label>
                        <select value={gender} onChange={e => setGender(e.target.value)} className="w-full p-3 bg-white border border-orange-200 rounded-xl font-bold text-xs outline-none"><option value="Nữ">Nữ</option><option value="Nam">Nam</option></select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[11px] font-black text-orange-700 uppercase block px-1 flex items-center gap-1.5"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth={2.5} /></svg> Phong cách</label>
                        <div className="flex bg-white p-1 rounded-xl border border-orange-200 h-[46px]"><button onClick={() => setImageStyle('Realistic')} className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${imageStyle === 'Realistic' ? 'bg-orange-600 text-white' : 'text-slate-400'}`}>Real</button><button onClick={() => setImageStyle('3D')} className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${imageStyle === '3D' ? 'bg-orange-600 text-white' : 'text-slate-400'}`}>3D</button></div>
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-[11px] font-black text-orange-700 uppercase block px-1 flex items-center gap-1.5"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeWidth={2.5} /></svg> Xưng hô</label>
                    <input list="sh-addr" value={addressing} onChange={e => setAddressing(e.target.value)} placeholder="VD: em - các bác" className="w-full p-3 bg-white border border-orange-200 rounded-xl font-bold text-xs outline-none" /><datalist id="sh-addr">{ADDRESSING_OPTIONS.map(o => <option key={o} value={o} />)}</datalist>
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-[11px] font-black text-orange-700 uppercase block px-1 flex items-center gap-1.5"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth={2.5} /></svg> 0. Ảnh mặt mẫu & Ghi chú chung</label>
                <div className="flex gap-4">
                  <div onClick={() => faceInputRef.current?.click()} className="w-24 h-24 border-2 border-dashed border-orange-300 rounded-2xl flex items-center justify-center cursor-pointer bg-white overflow-hidden relative group">
                    {facePreview ? <img src={facePreview} className="w-full h-full object-cover" /> : <div className="text-orange-300 opacity-40"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" /></svg></div>}
                    <input type="file" ref={faceInputRef} onChange={e => { if (e.target.files?.[0]) setFacePreview(URL.createObjectURL(e.target.files[0])) }} className="hidden" accept="image/*" />
                  </div>
                  <textarea value={commonNote} onChange={e => setCommonNote(e.target.value)} placeholder="Ghi chú nhân vật, bối cảnh chung..." className="flex-1 p-3.5 bg-white border border-orange-200 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-orange-100 outline-none resize-none shadow-inner" />
                </div>
            </div>
        </div>

        <button onClick={handleGenerateAll} disabled={isGlobalLoading} className="w-full py-5 bg-gradient-to-r from-orange-600 via-orange-700 to-red-700 text-white font-black rounded-3xl text-lg shadow-xl hover:shadow-orange-200 active:scale-95 disabled:opacity-50 tracking-widest uppercase">
            {isGlobalLoading ? "ĐANG XỬ LÝ TOÀN BỘ..." : "TẠO KỊCH BẢN CHO CẢ BỘ"}
        </button>
      </div>

      {products.filter(p => p.script).length > 0 && (
        <div className="mt-12 space-y-12 pb-32">
          {products.filter(p => p.script).map((p) => (
            <div key={p.id} className="animate-fadeIn">
               <div className="flex items-center gap-3 mb-6 border-l-4 border-orange-600 pl-4"><h2 className="text-2xl font-black text-orange-900 uppercase tracking-tighter">SP #{p.id}: {p.name}</h2></div>
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white rounded-[2.5rem] border border-orange-100 p-6 shadow-sm"><h3 className="text-sm font-black text-orange-700 uppercase mb-4 flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> VIDEO 1 (v1 & v2)</h3><div className="grid grid-cols-2 gap-4">{['v1','v2'].map(k => <div key={k} className="space-y-4"><ScriptSection title={k.toUpperCase()} content={(p.script as any)[k]} color="border-orange-600" onChange={v => setProducts(prev => prev.map(item => item.id === p.id ? {...item, script: {...item.script, [k]: v}} : item))} /><ImageCard label={k.toUpperCase()} imageData={p.images[k] || {url:'', loading:false}} videoPrompt={p.videoPrompts[k] || {text:'', loading:false, visible:false}} onGeneratePrompt={()=>{}} onRegenerate={()=>handleGenImageForKey(p.id, k)} onTranslate={()=>{}} customPrompt={p.images[k]?.customPrompt || ""} onCustomPromptChange={v => setProducts(prev => prev.map(item => item.id === p.id ? {...item, images: {...item.images, [k]: {...item.images[k], customPrompt: v}}} : item))} /></div>)}</div></div>
                  <div className="bg-white rounded-[2.5rem] border border-red-100 p-6 shadow-sm"><h3 className="text-sm font-black text-red-700 uppercase mb-4 flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> VIDEO 2 (v3 & v4)</h3><div className="grid grid-cols-2 gap-4">{['v3','v4'].map(k => <div key={k} className="space-y-4"><ScriptSection title={k.toUpperCase()} content={(p.script as any)[k]} color="border-red-600" onChange={v => setProducts(prev => prev.map(item => item.id === p.id ? {...item, script: {...item.script, [k]: v}} : item))} /><ImageCard label={k.toUpperCase()} imageData={p.images[k] || {url:'', loading:false}} videoPrompt={p.videoPrompts[k] || {text:'', loading:false, visible:false}} onGeneratePrompt={()=>{}} onRegenerate={()=>handleGenImageForKey(p.id, k)} onTranslate={()=>{}} customPrompt={p.images[k]?.customPrompt || ""} onCustomPromptChange={v => setProducts(prev => prev.map(item => item.id === p.id ? {...item, images: {...item.images, [k]: {...item.images[k], customPrompt: v}}} : item))} /></div>)}</div></div>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Shopee8sModule;
