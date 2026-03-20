
import React, { useState, useEffect, useRef } from 'react';
import { ScriptPartKey, ScriptParts } from '../types';
import * as service from '../services/kocReviewService';
import ScriptSection from '../components/ScriptSection';
import ImageCard, { KOC_POSES, CAMERA_ANGLES } from '../components/ImageCard';

declare var JSZip: any;

const LAYOUT_OPTIONS = [
  "Hình ảnh cá nhân + nỗi đau trong cuộc sống + trải nghiệm thực tế + giới thiệu sản phẩm/chức năng + trường hợp sử dụng + CTA",
  "Câu chuyện theo chủ đề + giới thiệu sản phẩm + đánh giá so sánh + sử dụng sản phẩm trong nhiều trường hợp + CTA",
  "Hình thức phỏng vấn + chia sẻ trải nghiệm người dùng + giới thiệu sản phẩm + CTA",
  "Chủ đề đời sống + đánh giá só sánh + điểm nổi bật + sử dụng sản phẩm trong nhiều trường hợp",
  "Nỗi đau + nguyên nhân + bán hàng từ nhà san xuất + uy tín thương hiệu + CTA",
  "Hình ảnh cá nhân + nỗi đau + trải nghiệm thực tế + đánh giá so sánh + bằng chứng khoa học + CTA",
  "Chia sẻ chân thực + kiến thức nghành + giới thiệu chức năng + đặc điểm nổi bật + ưu đãi + CTA",
  "Thu hút đối tượng mục tiêu cụ thể + câu hỏi từ góc độ người dùng + giải đáp + giới thiệu sản phẩm + ưu đãi + CTA",
  "Kết quả và đánh giá trước + nỗi đau trong cuộc sống + giới thiệu sản phẩm + ưu đãi + CTA",
  "Câu hỏi + giải pháp cho nỗi đau + đặc điểm nổi bật sản phẩm + đảm bảo từ nhiều góc độ/trường hợp + CTA",
  "Nỗi đau theo khu vực/mùa + giới thiệu sản phẩm + hoàn cảnh sử dụng + hình thức và cảm nhận khi trải nghiệm + đảm bảo + CTA",
  "Sở thích + giới thiệu sản phẩm + so sánh + giải thích về giá trị và hình thức + đảm bảo + CTA",
  "Xác định đối tượng mục tiêu + giới thiệu sản phẩm + hướng dẫn sử dụng + thử nghiệm và đánh giá + CTA",
  "Phản hồi và trải nghiệm của người dùng + kiến thức chuyên môn + nỗi đau + giới thiệu sản phẩm + ưu đãi + CTA",
  "Nỗi đau của khách hàng + giải pháp của sản phẩm + kết quả thực tế + CTA",
  "Câu chuyện thất bại + bài học rút ra + sản phẩm là giải pháp + CTA",
  "Đặt câu hỏi + kể chuyện + dẫn dắt + thuyết phục + đưa ra sản phẩm + khẳng định + CTA",
  "Câu chuyện hàng ngày + biến cố bất ngờ + loay hoay tìm cách giải quyết + gặp sản phẩm như cơ duyên + kết quả + CTA",
  "Sai lầm phổ biến + tôi cũng vậy + hậu quả kéo dài + quyết định đổi hướng + sản phẩm xuất hiện + CTA",
  "Ước muốn + rào cản + thử nhiều cách vẫn thất bại + một lựa chọn khác biệt + đạt được điều mong muốn + CTA",
  "Hook mạnh + giới thiệu công năng + CTA"
];

const SCENE_COUNT_OPTIONS = Array.from({ length: 13 }, (_, i) => {
  const count = i + 3;
  const seconds = count * 8;
  return { count, label: `${count} cảnh - ${seconds}s` };
});

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

const KocReviewModule: React.FC = () => {
  const storageKey = "koc_project_v22_angles_descriptive";
  const [state, setState] = useState<any>({
    faceFile: null,
    facePreviewUrl: null,
    outfitFile: null,
    outfitPreviewUrl: null,
    processedOutfitUrl: null,
    isExtractingOutfit: false,
    backgroundFile: null,
    backgroundPreviewUrl: null,
    characterDescription: '',
    gender: 'Nữ',
    voice: 'Giọng Bắc 20-40 tuổi',
    addressing: '',
    targetAudience: '',
    imageStyle: 'Realistic',
    sceneCount: 5,
    productFiles: [], 
    productPreviewUrls: [],
    productName: '',
    keyword: '',
    scriptTone: '',
    productSize: '',
    scriptNote: '', 
    visualNote: '',
    scriptLayout: '',
    isGeneratingScript: false,
    isRegeneratingPart: {},
    script: null,
    images: {},
    videoPrompts: {}
  });

  const productInputRef = useRef<HTMLInputElement>(null);
  const faceInputRef = useRef<HTMLInputElement>(null);
  const outfitInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          const safeSceneCount = typeof parsed.sceneCount === 'object' ? (parsed.sceneCount.count || 5) : (parsed.sceneCount || 5);
          
          setState((prev: any) => ({
            ...prev,
            ...parsed,
            sceneCount: safeSceneCount,
            productFiles: [],
            faceFile: null,
            outfitFile: null,
            backgroundFile: null,
            isGeneratingScript: false,
            isExtractingOutfit: false,
            isRegeneratingPart: {}
          }));
        }
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    try {
      const { isGeneratingScript, isExtractingOutfit, isRegeneratingPart, productFiles, faceFile, outfitFile, backgroundFile, images, ...persistentData } = state;
      const safeImages = Object.keys(images || {}).reduce((acc: any, key) => {
        acc[key] = { ...images[key], url: images[key]?.url || '' };
        return acc;
      }, {});
      localStorage.setItem(storageKey, JSON.stringify({ ...persistentData, images: safeImages }));
    } catch (e) {}
  }, [state]);

  const handleProductFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      const updatedFiles = [...state.productFiles, ...selectedFiles].slice(0, 3);
      const updatedUrls = updatedFiles.map(f => URL.createObjectURL(f));
      setState((prev: any) => ({
        ...prev,
        productFiles: updatedFiles,
        productPreviewUrls: updatedUrls
      }));
    }
  };

  const handleGenerate = async () => {
    if (state.productFiles.length === 0 && state.productPreviewUrls.length === 0) {
      alert("Vui lòng tải ảnh sản phẩm.");
      return;
    }
    if (!state.productName) {
      alert("Vui lòng nhập tên sản phẩm.");
      return;
    }

    const activeKeys = Array.from({ length: state.sceneCount }, (_, i) => `v${i + 1}`);
    const initialImages: any = {};
    const initialPrompts: any = {};
    activeKeys.forEach(k => {
      initialImages[k] = { url: '', loading: false, customPrompt: '', pose: '', angle: '' };
      initialPrompts[k] = { text: '', loading: false, visible: false };
    });

    setState((prev: any) => ({
      ...prev,
      isGeneratingScript: true,
      script: null,
      images: initialImages,
      videoPrompts: initialPrompts
    }));

    try {
      let imageParts = [];
      if (state.productFiles.length > 0) {
        imageParts = await Promise.all(state.productFiles.map((file: File) => service.fileToGenerativePart(file)));
      } else {
        imageParts = state.productPreviewUrls.map((url: string) => ({
          mimeType: 'image/png',
          data: url.split(',')[1]
        }));
      }

      let layoutToUse = state.scriptLayout;
      if (!layoutToUse) layoutToUse = LAYOUT_OPTIONS[Math.floor(Math.random() * LAYOUT_OPTIONS.length)];

      const script = await service.generateKocScript(
        imageParts, state.productName, state.keyword, state.scriptTone,
        state.productSize, state.scriptNote, layoutToUse, state.gender, state.voice,
        state.addressing, state.sceneCount, state.targetAudience
      );
      setState((prev: any) => ({ ...prev, script, scriptLayout: layoutToUse }));
    } finally {
      setState((prev: any) => ({ ...prev, isGeneratingScript: false }));
    }
  };

  const handleBulkAction = async (type: 'image' | 'prompt') => {
    const keys = Array.from({ length: state.sceneCount }, (_, i) => `v${i + 1}`);
    for (const key of keys) {
      if (type === 'image') await handleGenImageForKey(key);
      else await handleGeneratePromptForKey(key);
    }
  };

  const handleGenImageForKey = async (key: string) => {
    setState((prev: any) => ({ ...prev, images: { ...prev.images, [key]: { ...prev.images[key], loading: true } } }));
    try {
      let productParts = state.productFiles.length > 0 
        ? await Promise.all(state.productFiles.map((file: File) => service.fileToGenerativePart(file)))
        : state.productPreviewUrls.map((url: string) => ({ mimeType: 'image/png', data: url.split(',')[1] }));

      const facePart = state.facePreviewUrl ? { mimeType: 'image/png', data: state.facePreviewUrl.split(',')[1] } : null;
      const outfitPart = state.processedOutfitUrl ? { mimeType: 'image/png', data: state.processedOutfitUrl.split(',')[1] } : null;
      const bgPart = state.backgroundPreviewUrl ? { mimeType: 'image/png', data: state.backgroundPreviewUrl.split(',')[1] } : null;

      const currentPoseKey = state.images[key]?.pose || "";
      const poseLabel = KOC_POSES.find(p => p.value === currentPoseKey)?.label || "";

      const url = await service.generateKocImage(
        productParts, facePart, outfitPart, "", state.productName, state.script[key],
        state.characterDescription, state.images[key]?.customPrompt, state.gender,
        state.imageStyle, state.scriptNote, state.visualNote, poseLabel, bgPart, state.images[key]?.angle
      );
      setState((prev: any) => ({ ...prev, images: { ...prev.images, [key]: { ...prev.images[key], url, loading: false } } }));
    } catch (e) {
      setState((prev: any) => ({ ...prev, images: { ...prev.images, [key]: { ...prev.images[key], loading: false, error: 'Failed' } } }));
    }
  };

  const handleGeneratePromptForKey = async (key: string) => {
    setState(p => ({ ...p, videoPrompts: { ...p.videoPrompts, [key]: { ...p.videoPrompts[key], loading: true, visible: true } } }));
    try {
      const productImageData = state.productPreviewUrls[0]?.split(',')[1] || "";
      const prompt = await service.generateKocVeoPrompt(
        state.productName, state.script[key], state.gender, state.voice, productImageData, state.images[key].url, false, state.imageStyle
      );
      setState(p => ({ ...p, videoPrompts: { ...p.videoPrompts, [key]: { text: prompt, loading: false, visible: true } } }));
    } catch (e) {
      setState(p => ({ ...p, videoPrompts: { ...p.videoPrompts, [key]: { ...p.videoPrompts[key], loading: false } } }));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-orange-100 p-8 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-5 space-y-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[11px] font-black text-orange-600 uppercase tracking-widest px-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                1. Hình ảnh sản phẩm
              </label>
              <div 
                onClick={() => productInputRef.current?.click()} 
                className="w-full h-32 rounded-2xl border-2 border-dashed border-orange-200 flex flex-col items-center justify-center cursor-pointer bg-orange-50/30 hover:bg-orange-50 transition-all group"
              >
                <div className="text-center opacity-40 group-hover:opacity-60">
                   <svg className="w-8 h-8 text-orange-600 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                   <span className="text-[9px] font-black uppercase tracking-tighter text-orange-900">Tải ảnh sản phẩm</span>
                </div>
                <input type="file" multiple ref={productInputRef} onChange={handleProductFilesChange} className="hidden" accept="image/*" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[11px] font-black text-orange-600 uppercase tracking-widest px-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    0. Ảnh mặt mẫu
                  </label>
                  <div onClick={() => faceInputRef.current?.click()} className="aspect-square rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50/30 flex items-center justify-center cursor-pointer overflow-hidden group">
                     {state.facePreviewUrl ? <img src={state.facePreviewUrl} className="h-full object-cover" /> : <span className="text-[9px] font-bold text-orange-300 uppercase">Khuôn mặt</span>}
                     <input type="file" ref={faceInputRef} onChange={e => { if (e.target.files?.[0]) setState({...state, facePreviewUrl: URL.createObjectURL(e.target.files[0])}) }} className="hidden" accept="image/*" />
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[11px] font-black text-orange-600 uppercase tracking-widest px-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V5a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    2. Trang phục
                  </label>
                  <div onClick={() => outfitInputRef.current?.click()} className="aspect-square rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50/30 flex items-center justify-center cursor-pointer overflow-hidden group">
                     {state.outfitPreviewUrl ? <img src={state.outfitPreviewUrl} className="h-full object-cover" /> : <span className="text-[9px] font-bold text-orange-300 uppercase">Bộ đồ</span>}
                     <input type="file" ref={outfitInputRef} onChange={e => { if (e.target.files?.[0]) setState({...state, outfitPreviewUrl: URL.createObjectURL(e.target.files[0])}) }} className="hidden" accept="image/*" />
                  </div>
               </div>
            </div>

            <div className="space-y-1">
              <label className="flex items-center gap-2 text-[11px] font-black text-orange-600 uppercase tracking-widest px-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Mô tả nhân vật
              </label>
              <textarea value={state.characterDescription} onChange={e => setState({...state, characterDescription: e.target.value})} placeholder="Vẻ ngoài nhân vật..." className="w-full p-4 bg-orange-50/30 border border-orange-100 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-orange-200" rows={3} />
            </div>
          </div>

          <div className="md:col-span-7 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="flex items-center gap-2 text-[10px] font-black text-orange-600 uppercase px-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                  Tên sản phẩm
                </label>
                <input type="text" value={state.productName} onChange={e => setState({...state, productName: e.target.value})} className="w-full p-3.5 bg-orange-50/30 border border-orange-100 rounded-xl font-bold focus:ring-2 focus:ring-orange-200 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="flex items-center gap-2 text-[10px] font-black text-red-600 uppercase px-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  Khách hàng mục tiêu
                </label>
                <input type="text" value={state.targetAudience} onChange={e => setState({...state, targetAudience: e.target.value})} className="w-full p-3.5 bg-orange-50/30 border border-orange-100 rounded-xl font-bold focus:ring-2 focus:ring-red-200 outline-none" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="flex items-center gap-2 text-[10px] font-black text-orange-600 uppercase px-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                USP & Tính năng nổi bật
              </label>
              <textarea value={state.keyword} onChange={e => setState({...state, keyword: e.target.value})} className="w-full p-4 bg-orange-50/30 border border-orange-100 rounded-2xl h-20 text-xs font-bold focus:ring-2 focus:ring-orange-200 outline-none" />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-orange-400 uppercase px-1">Giới tính</label>
                    <select value={state.gender} onChange={e => setState({...state, gender: e.target.value})} className="w-full p-3.5 bg-white border border-orange-100 rounded-xl font-bold outline-none focus:ring-2 focus:ring-orange-200"><option value="Nữ">Nữ</option><option value="Nam">Nam</option></select>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-orange-400 uppercase px-1">Vùng miền</label>
                    <select value={state.voice} onChange={e => setState({...state, voice: e.target.value})} className="w-full p-3.5 bg-white border border-orange-100 rounded-xl font-bold outline-none focus:ring-2 focus:ring-orange-200">{VOICE_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}</select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-orange-400 uppercase px-1">Thời lượng</label>
                    <select value={state.sceneCount} onChange={e => setState({...state, sceneCount: parseInt(e.target.value)})} className="w-full p-3.5 bg-white border border-orange-100 rounded-xl font-bold text-orange-600 outline-none">{SCENE_COUNT_OPTIONS.map(o => <option key={o.count} value={o.count}>{o.label}</option>)}</select>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-orange-400 uppercase px-1">Phong cách ảnh</label>
                    <div className="flex bg-orange-50/30 p-1 rounded-xl border border-orange-100 h-[50px]">
                        <button onClick={() => setState({...state, imageStyle: 'Realistic'})} className={`flex-1 py-1 text-[10px] font-black uppercase rounded-lg transition-all ${state.imageStyle === 'Realistic' ? 'bg-orange-600 text-white shadow-md' : 'text-orange-400'}`}>Chân thực</button>
                        <button onClick={() => setState({...state, imageStyle: '3D'})} className={`flex-1 py-1 text-[10px] font-black uppercase rounded-lg transition-all ${state.imageStyle === '3D' ? 'bg-orange-600 text-white shadow-md' : 'text-orange-400'}`}>3D</button>
                    </div>
                </div>
            </div>

            <button onClick={handleGenerate} disabled={state.isGeneratingScript} className="w-full py-5 bg-gradient-to-r from-orange-600 via-orange-700 to-red-700 text-white font-black rounded-3xl shadow-xl hover:shadow-orange-200 uppercase tracking-widest flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50">
                {state.isGeneratingScript ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" strokeWidth={2.5} /></svg> BẮT ĐẦU TẠO KỊCH BẢN</>}
            </button>
          </div>
        </div>
      </div>

      {state.script && (
        <div className="space-y-10 pb-32">
          <div className="bg-white p-8 rounded-[2.5rem] border border-orange-100 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h3 className="text-xl font-black text-orange-900 uppercase tracking-tight">KẾT QUẢ CHIẾN DỊCH</h3>
              <p className="text-[10px] font-bold text-orange-400 uppercase tracking-[0.3em] mt-1">Đã sẵn sàng tạo Visuals cho {state.sceneCount} phân cảnh</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
               <button onClick={() => handleBulkAction('image')} className="px-6 py-3.5 bg-orange-600 text-white text-[10px] font-black rounded-2xl hover:bg-orange-700 transition-all uppercase tracking-widest shadow-lg shadow-orange-900/40">Vẽ tất cả ảnh</button>
               <button onClick={() => handleBulkAction('prompt')} className="px-6 py-3.5 bg-red-600 text-white text-[10px] font-black rounded-2xl hover:bg-red-700 transition-all uppercase tracking-widest shadow-lg shadow-red-900/40">Tạo tất cả prompt</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
            {Array.from({ length: state.sceneCount }, (_, i) => `v${i + 1}`).map((key, idx) => (
              <div key={key} className="space-y-4 animate-fadeIn">
                <ScriptSection title={`Phần ${idx + 1}`} content={state.script[key]} color="border-orange-600" onChange={(v) => setState({...state, script: {...state.script, [key]: v}})} />
                <ImageCard
                   label={`Cảnh ${idx + 1}`} 
                   imageData={state.images[key] || {url: '', loading: false}}
                   videoPrompt={state.videoPrompts[key] || {text: '', loading: false, visible: false}}
                   onGeneratePrompt={() => handleGeneratePromptForKey(key)}
                   onRegenerate={() => handleGenImageForKey(key)}
                   onTranslate={() => {}}
                   customPrompt={state.images[key]?.customPrompt || ""}
                   onCustomPromptChange={(v) => setState({...state, images: {...state.images, [key]: {...state.images[key], customPrompt: v}}})}
                   onPoseChange={(v) => setState({...state, images: {...state.images, [key]: {...state.images[key], pose: v}}})}
                   pose={state.images[key]?.pose || ""}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default KocReviewModule;
