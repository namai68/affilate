
import React, { useState, useEffect, useRef } from 'react';
import { ScriptParts } from '../types';
import * as service from '../services/nonFaceReviewService';
import ScriptSection from '../components/ScriptSection';
import ImageCard, { NONFACE_POSES } from '../components/ImageCard';

declare var JSZip: any;

const LAYOUT_OPTIONS = [
  "Cận cảnh sản phẩm + nỗi đau trong cuộc sống + trải nghiệm thực tế + giới thiệu chức năng + trường hợp sử dụng + CTA",
  "Câu chuyện chủ đề + mở hộp sản phẩm + đánh giá chi tiết + sử dụng thực tế + CTA",
  "Review chân thực + chia sẻ trải nghiệm người dùng + giới thiệu sản phẩm + CTA",
  "Chủ đề đời sống + đánh giá so sánh + điểm nổi bật + sử dụng sản phẩm trong nhiều trường hợp",
  "Nỗi đau khách hàng + nguyên nhân + giải pháp từ sản phẩm + uy tín thương hiệu + CTA",
  "Giới thiệu sản phẩm + nỗi đau + trải nghiệm thực tế + đánh giá so sánh + bằng chứng + CTA",
  "Chia sẻ chân thực + kiến thức ngành + giới thiệu chức năng + đặc điểm nổi bật + ưu đãi + CTA",
  "Thu hút đối tượng mục tiêu + câu hỏi từ góc độ người dùng + giải đáp + giới thiệu sản phẩm + ưu đãi + CTA",
  "Kết quả và đánh giá trước + nỗi đau trong cuộc sống + giới thiệu sản phẩm + ưu đãi + CTA",
  "Câu hỏi + giải pháp cho nỗi đau + đặc điểm nổi bật sản phẩm + đảm bảo từ nhiều góc độ + CTA",
  "Nỗi đau theo mùa/khu vực + giới thiệu sản phẩm + hoàn cảnh sử dụng + cảm nhận khi trải nghiệm + CTA",
  "Sở thích + giới thiệu sản phẩm + so sánh + giải thích về giá trị và hình thức + đảm bảo + CTA",
  "Xác định đối tượng mục tiêu + giới thiệu sản phẩm + hướng dẫn sử dụng + thử nghiệm và đánh giá + CTA",
  "Phản hồi của người dùng + kiến thức chuyên môn + nỗi đau + giới thiệu sản phẩm + ưu đãi + CTA",
  "Nỗi đau của khách hàng + giải pháp của sản phẩm + kết quả thực tế + CTA",
  "Câu chuyện thất bại + bài học rút ra + sản phẩm là giải pháp + CTA",
  "Đặt câu hỏi + kể chuyện + dẫn dắt + thuyết phục + đưa ra sản phẩm + khẳng định + CTA",
  "Câu chuyện hàng ngày + biến cố bất ngờ + loay hoay tìm cách giải quyết + gặp sản phẩm như cơ duyên + CTA",
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
  "Nữ Bắc - Sale Sôi Động (20-30t)",
  "Nữ Bắc - Kể Chuyện Nhẹ Nhàng (20-30t)",
  "Nữ Bắc - MC Tin Tức Chuyên Nghiệp (25-35t)",
  "Nam Bắc - Reviewer Chân Thực (25-35t)",
  "Nam Bắc - Chuyên Gia Uy Tín (40-50t)",
  "Nam Bắc - Hào Sảng/Mạnh Mẽ (30-45t)",
  "Nữ Nam - Sale Ngọt Ngào (18-25t)",
  "Nữ Nam - Tâm Sự Cảm Xúc (25-35t)",
  "Nữ Nam - Reviewer Thân Thiện (20-30t)",
  "Nam Nam - Reviewer Hài Hước (20-30t)",
  "Nam Nam - Kể Chuyện Trầm Ấm (40-60t)",
  "Nam Nam - Năng Động/Bắt Trend (18-25t)"
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

const NonFaceReviewModule: React.FC = () => {
  const storageKey = "nonface_review_v5_poses_added";
  const [state, setState] = useState<any>({
    backgroundFile: null,
    backgroundPreviewUrl: null,
    handFile: null,
    handPreviewUrl: null,
    gender: 'Nữ',
    voice: VOICE_OPTIONS[0],
    addressing: '',
    targetAudience: '',
    imageStyle: 'Realistic',
    handVisibility: 'with_hand',
    sceneCount: 5,
    productFiles: [], 
    productPreviewUrls: [],
    productName: '',
    keyword: '',
    scriptNote: '', 
    visualNote: '',
    scriptLayout: '',
    isGeneratingScript: false,
    isRegeneratingPart: {},
    script: null,
    images: {},
    imagePrompts: {},
    videoPrompts: {}
  });

  const productInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const handInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          setState((prev: any) => ({
            ...prev,
            ...parsed,
            productFiles: [],
            backgroundFile: null,
            handFile: null,
            isGeneratingScript: false,
            isRegeneratingPart: {}
          }));
        }
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    try {
      const { isGeneratingScript, isRegeneratingPart, productFiles, backgroundFile, handFile, images, ...persistentData } = state;
      const safeImages = Object.keys(images || {}).reduce((acc: any, key) => {
        acc[key] = { ...images[key], url: images[key]?.url?.startsWith('data:') ? images[key].url : '' };
        return acc;
      }, {});
      localStorage.setItem(storageKey, JSON.stringify({ ...persistentData, images: safeImages }));
    } catch (e) {}
  }, [state]);

  // Handle Global Import / Export
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
          : state.productPreviewUrls.map((url: string) => url.startsWith('data:') ? Promise.resolve(url) : Promise.resolve(""))
      );

      const backgroundBase64 = await getBase64(state.backgroundFile, state.backgroundPreviewUrl);
      const handBase64 = await getBase64(state.handFile, state.handPreviewUrl);

      const activeKeys = Array.from({ length: state.sceneCount }, (_, i) => `v${i + 1}`);
      const exportData = activeKeys.map((key, index) => ({
        stt: index + 1,
        inputs: {
          productName: state.productName,
          keyword: state.keyword,
          targetAudience: state.targetAudience, 
          visualNote: state.visualNote,
          scriptNote: state.scriptNote, 
          inputMedia: {
            productImages: productImagesBase64.filter(i => i),
            backgroundImage: backgroundBase64,
            handImage: handBase64
          },
          settings: {
            gender: state.gender,
            voice: state.voice,
            addressing: state.addressing,
            imageStyle: state.imageStyle,
            handVisibility: state.handVisibility,
            scriptLayout: state.scriptLayout,
            angle: state.images[key]?.angle || '',
            pose: state.images[key]?.pose || ''
          }
        },
        script: state.script ? state.script[key] : '',
        outputImage: state.images[key]?.url || '',
        videoPrompt: state.videoPrompts[key]?.text || ''
      }));

      window.dispatchEvent(new CustomEvent('EXPORT_DATA_READY', { 
        detail: { data: exportData, moduleName: 'Review_Non_Face' } 
      }));
    };

    const handleImport = async (e: any) => {
      const importedData = e.detail;
      if (!Array.isArray(importedData) || importedData.length === 0) return;
      const firstItem = importedData[0];
      const inputs = firstItem.inputs || {};
      const settings = inputs.settings || {};
      const media = inputs.inputMedia || {};

      const newState = {
        ...state,
        productName: inputs.productName || state.productName,
        keyword: inputs.keyword || state.keyword,
        targetAudience: inputs.targetAudience || state.targetAudience,
        visualNote: inputs.visualNote || state.visualNote,
        scriptNote: inputs.scriptNote || state.scriptNote,
        gender: settings.gender || state.gender,
        voice: settings.voice || state.voice,
        addressing: settings.addressing || state.addressing,
        imageStyle: settings.imageStyle || state.imageStyle,
        handVisibility: settings.handVisibility || 'with_hand',
        scriptLayout: settings.scriptLayout || state.scriptLayout,
        productPreviewUrls: media.productImages || [],
        backgroundPreviewUrl: media.backgroundImage || "",
        handPreviewUrl: media.handImage || "",
        sceneCount: importedData.length,
        script: {}, images: {}, videoPrompts: {}
      };

      for (let i = 0; i < importedData.length; i++) {
        const item = importedData[i];
        const key = `v${i + 1}`;
        newState.script[key] = item.script || '';
        newState.images[key] = { 
          url: item.outputImage || '', 
          loading: false, 
          angle: item.inputs?.settings?.angle || '', 
          pose: item.inputs?.settings?.pose || '',
          customPrompt: '' 
        };
        newState.videoPrompts[key] = { text: item.videoPrompt || '', loading: false, visible: !!item.videoPrompt };
      }
      setState(newState);
      window.dispatchEvent(new CustomEvent('IMPORT_DATA_PROGRESS', { detail: { percent: 100, complete: true } }));
    };

    window.addEventListener('REQUEST_EXPORT_DATA', handleExport);
    window.addEventListener('REQUEST_IMPORT_DATA', handleImport);
    return () => {
      window.removeEventListener('REQUEST_EXPORT_DATA', handleExport);
      window.removeEventListener('REQUEST_IMPORT_DATA', handleImport);
    };
  }, [state]);

  const handleProductFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const updatedFiles = [...state.productFiles, ...selectedFiles].slice(0, 3);
      const updatedUrls = updatedFiles.map(f => URL.createObjectURL(f));
      setState((prev: any) => ({ ...prev, productFiles: updatedFiles, productPreviewUrls: updatedUrls }));
    }
  };

  const removeProductFile = (idx: number) => {
    const updatedFiles = state.productFiles.filter((_: any, i: number) => i !== idx);
    const updatedPreviewUrls = state.productPreviewUrls.filter((_: any, i: number) => i !== idx);
    setState((prev: any) => ({ ...prev, productFiles: updatedFiles, productPreviewUrls: updatedPreviewUrls }));
  };

  const handleGenerate = async () => {
    if (state.productFiles.length === 0 && state.productPreviewUrls.length === 0) return alert("Vui lòng tải ảnh sản phẩm.");
    if (!state.productName) return alert("Vui lòng nhập tên sản phẩm.");

    setState((prev: any) => ({ ...prev, isGeneratingScript: true }));
    try {
      let imageParts = [];
      if (state.productFiles.length > 0) {
        imageParts = await Promise.all(state.productFiles.map((file: File) => service.fileToGenerativePart(file)));
      } else {
        imageParts = state.productPreviewUrls.map((url: string) => ({ mimeType: 'image/png', data: url.split(',')[1] }));
      }

      let layoutToUse = state.scriptLayout;
      if (!layoutToUse) layoutToUse = LAYOUT_OPTIONS[Math.floor(Math.random() * LAYOUT_OPTIONS.length)];

      const script = await service.generateNonFaceScript(
        imageParts, state.productName, state.keyword, layoutToUse, 
        state.gender, state.voice, state.addressing, state.sceneCount, state.targetAudience
      );
      setState((prev: any) => ({ ...prev, script, scriptLayout: layoutToUse, isGeneratingScript: false }));
    } catch (e) {
      setState((prev: any) => ({ ...prev, isGeneratingScript: false }));
    }
  };

  const handleRegenerateScriptPart = async (key: string) => {
    if (state.isGeneratingScript || state.isRegeneratingPart[key] || !state.script) return;
    
    setState((p: any) => ({ 
      ...p, 
      isRegeneratingPart: { ...p.isRegeneratingPart, [key]: true } 
    }));
    
    try {
      let imageParts = [];
      if (state.productFiles.length > 0) {
        imageParts = await Promise.all(state.productFiles.map((file: File) => service.fileToGenerativePart(file)));
      } else {
        imageParts = state.productPreviewUrls.map((url: string) => ({ mimeType: 'image/png', data: url.split(',')[1] }));
      }

      const newPartContent = await service.regenerateNonFaceScriptPart(
        imageParts,
        state.productName,
        state.keyword,
        key,
        state.script[key],
        state.script,
        state.gender,
        state.voice,
        state.address,
        state.targetAudience
      );
      
      setState((p: any) => ({
        ...p,
        script: { ...p.script, [key]: newPartContent },
        isRegeneratingPart: { ...p.isRegeneratingPart, [key]: false }
      }));
    } catch (error) {
      setState((p: any) => ({ 
        ...p, 
        isRegeneratingPart: { ...p.isRegeneratingPart, [key]: false } 
      }));
    }
  };

  const handleGenImageForKey = async (key: string) => {
    setState((prev: any) => ({ ...prev, images: { ...prev.images, [key]: { ...prev.images[key], loading: true } } }));
    try {
      let productParts = state.productFiles.length > 0 
        ? await Promise.all(state.productFiles.map((file: File) => service.fileToGenerativePart(file)))
        : state.productPreviewUrls.map((url: string) => ({ mimeType: 'image/png', data: url.split(',')[1] }));

      const bgRefPart = state.backgroundFile ? await service.fileToGenerativePart(state.backgroundFile) : 
                       (state.backgroundPreviewUrl?.startsWith('data:') ? { mimeType: 'image/png', data: state.backgroundPreviewUrl.split(',')[1] } : null);

      const handRefPart = state.handFile ? await service.fileToGenerativePart(state.handFile) : 
                       (state.handPreviewUrl?.startsWith('data:') ? { mimeType: 'image/png', data: state.handPreviewUrl.split(',')[1] } : null);

      const currentPoseKey = state.images[key]?.pose || "";
      const poseLabel = NONFACE_POSES.find(p => p.value === currentPoseKey)?.label || "";

      const url = await service.generateNonFaceImage(
        productParts, handRefPart, state.productName, state.script[key], state.images[key]?.customPrompt,
        state.imageStyle, state.handVisibility, state.scriptNote, state.visualNote, bgRefPart, state.images[key]?.angle, poseLabel
      );
      setState((prev: any) => ({ ...prev, images: { ...prev.images, [key]: { ...prev.images[key], url, loading: false } } }));
    } catch (e) {
      setState((prev: any) => ({ ...prev, images: { ...prev.images, [key]: { ...prev.images[key], loading: false, error: 'Failed' } } }));
    }
  };

  const handleGeneratePromptForKey = async (key: string) => {
    setState((prev: any) => ({ ...prev, videoPrompts: { ...prev.videoPrompts, [key]: { ...prev.videoPrompts[key], loading: true, visible: true } } }));
    try {
      let productImageData = state.productFiles[0] ? (await service.fileToGenerativePart(state.productFiles[0])).data : (state.productPreviewUrls[0]?.split(',')[1] || "");
      const prompt = await service.generateNonFaceVeoPrompt(
        state.productName, state.script[key], state.gender, state.voice, state.handVisibility, productImageData, state.images[key]?.url, state.imageStyle
      );
      setState((p:any) => ({ ...p, videoPrompts: { ...p.videoPrompts, [key]: { text: prompt, loading: false, visible: true } } }));
    } catch (e) {
      setState((p:any) => ({ ...p, videoPrompts: { ...p.videoPrompts, [key]: { ...p.videoPrompts[key], loading: false } } }));
    }
  };

  const handleUploadImageForKey = (key: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const b64 = e.target?.result as string;
      setState((prev: any) => ({
        ...prev,
        images: {
          ...prev.images,
          [key]: { ...prev.images[key], url: b64, loading: false }
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleBulkAction = async (type: 'image' | 'prompt') => {
    const keys = Array.from({ length: state.sceneCount }, (_, i) => `v${i + 1}`);
    for (const key of keys) {
      if (type === 'image') await handleGenImageForKey(key);
      else await handleGeneratePromptForKey(key);
    }
  };

  const downloadAllImages = async () => {
    if (typeof JSZip === 'undefined') return alert("Thư viện ZIP chưa sẵn sàng.");
    const zip = new JSZip();
    let count = 0;
    const activeKeys = Array.from({ length: state.sceneCount }, (_, i) => `v${i + 1}`);
    activeKeys.forEach((key, i) => {
      if (state.images[key]?.url) {
        const base64Data = state.images[key].url.split(',')[1];
        if (base64Data) {
          zip.file(`${String(i + 1).padStart(2, '0')}.png`, base64Data, { base64: true });
          count++;
        }
      }
    });
    if (count === 0) return alert("Không có ảnh để tải.");
    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `nonface_images_${state.productName || 'project'}.zip`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const downloadAllPrompts = () => {
    const activeKeys = Array.from({ length: state.sceneCount }, (_, i) => `v${i + 1}`);
    const text = activeKeys
      .map(key => state.videoPrompts[key]?.text || "")
      .filter(t => t.trim().length > 0)
      .map(t => t.replace(/\n/g, ' ')) // Đảm bảo mỗi prompt nằm trên 1 dòng duy nhất
      .join('\n');

    if (!text) {
      alert("Vui lòng tạo Video Prompt trước khi tải xuống.");
      return;
    }

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `prompts_nonface_${state.productName || 'project'}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const hasGeneratedMedia = state.script && (Object.values(state.images).some((img: any) => img.url) || Object.values(state.videoPrompts).some((pr: any) => pr.text));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white rounded-[2rem] shadow-sm border border-orange-100 p-8 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-5 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {/* Cột 1: Tải ảnh sản phẩm */}
              <div className="space-y-2">
                <label className="block text-[11px] font-black text-orange-900 uppercase tracking-widest px-1">1. Ảnh sản phẩm (Max 3)</label>
                <div onClick={() => productInputRef.current?.click()} className="w-full aspect-[3/4] border-2 border-dashed border-orange-100 rounded-2xl flex flex-col items-center justify-center cursor-pointer bg-orange-50/30 overflow-hidden relative group hover:border-orange-400 transition-all">
                  {state.productPreviewUrls.length === 0 ? (
                    <div className="text-center opacity-40 group-hover:opacity-60">
                      <svg className="w-10 h-10 mx-auto text-orange-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <span className="text-[9px] font-black uppercase tracking-tighter text-orange-900">Tải ảnh SP</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-1 w-full h-full relative">
                        <img src={state.productPreviewUrls[0]} className="w-full h-full object-cover" />
                        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[8px] font-bold px-2 py-1 rounded">+{state.productPreviewUrls.length} ảnh</div>
                        <button onClick={(e) => { e.stopPropagation(); setState((p:any)=>({...p, productFiles: [], productPreviewUrls: []})); }} className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full shadow-lg z-10"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </div>
                  )}
                  <input type="file" multiple ref={productInputRef} onChange={handleProductFilesChange} className="hidden" accept="image/*" />
                </div>
              </div>

              {/* Cột 2: Tải bàn tay mẫu */}
              <div className="space-y-2">
                <label className={`block text-[11px] font-black text-orange-900 uppercase tracking-widest px-1 ${state.handVisibility === 'with_hand' ? 'text-orange-600' : 'opacity-30'}`}>2. Bàn tay mẫu</label>
                <div 
                  onClick={() => state.handVisibility === 'with_hand' && handInputRef.current?.click()} 
                  className={`w-full aspect-[3/4] border-2 border-dashed rounded-2xl flex items-center justify-center cursor-pointer bg-orange-50/30 overflow-hidden relative group transition-all ${state.handVisibility === 'with_hand' ? 'border-orange-100 hover:border-orange-400' : 'border-orange-50 bg-orange-50/10 cursor-not-allowed opacity-50'}`}
                >
                  {state.handPreviewUrl ? (
                    <>
                      <img src={state.handPreviewUrl} className="h-full w-full object-cover" />
                      <button onClick={(e) => { e.stopPropagation(); setState((p:any) => ({ ...p, handFile: null, handPreviewUrl: null })); }} className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </>
                  ) : (
                    <div className="text-center opacity-40 group-hover:opacity-60">
                      <svg className="w-10 h-10 mx-auto text-orange-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0V12m3.5-3.5a1.5 1.5 0 013 0v4.5a3.5 3.5 0 01-7 0m0-2.5V5a1.5 1.5 0 013 0v4.5" /></svg>
                      <span className="text-[9px] font-black uppercase tracking-tighter text-orange-900">Mẫu tay AI</span>
                    </div>
                  )}
                  <input type="file" ref={handInputRef} onChange={(e) => { if (e.target.files?.[0]) { const f = e.target.files[0]; setState((p:any) => ({ ...p, handFile: f, handPreviewUrl: URL.createObjectURL(f) })); } }} className="hidden" accept="image/*" />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-black text-orange-900 uppercase px-1 tracking-widest">Background bối cảnh cố định</label>
              <div className="grid grid-cols-2 gap-4">
                <div onClick={() => backgroundInputRef.current?.click()} className="aspect-square border-2 border-dashed border-orange-100 rounded-[2rem] flex items-center justify-center cursor-pointer bg-orange-50/30 overflow-hidden relative group hover:border-orange-400 transition-all">
                  {state.backgroundPreviewUrl ? (
                    <>
                      <img src={state.backgroundPreviewUrl} className="h-full w-full object-cover" />
                      <button onClick={(e) => { e.stopPropagation(); setState((p:any) => ({ ...p, backgroundFile: null, backgroundPreviewUrl: null })); }} className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </>
                  ) : <span className="text-[10px] font-black text-orange-400 uppercase tracking-tighter">Tải bối cảnh</span>}
                  <input type="file" ref={backgroundInputRef} onChange={(e) => { if (e.target.files?.[0]) { const f = e.target.files[0]; setState((p:any) => ({ ...p, backgroundFile: f, backgroundPreviewUrl: URL.createObjectURL(f) })); } }} className="hidden" accept="image/*" />
                </div>
                <textarea value={state.scriptNote} onChange={e => setState((p:any) => ({ ...p, scriptNote: e.target.value }))} placeholder="Mô tả bối cảnh sản phẩm..." className="w-full p-4 border border-orange-100 rounded-[2rem] text-xs h-full resize-none font-bold bg-orange-50/30 focus:bg-white transition-all outline-none" />
              </div>
            </div>
          </div>

          <div className="md:col-span-7 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-orange-900 uppercase px-1 tracking-widest">Tên sản phẩm</label>
                <input type="text" value={state.productName} onChange={e => setState((p:any) => ({ ...p, productName: e.target.value }))} className="w-full p-4 bg-orange-50/30 border border-orange-100 rounded-2xl font-bold focus:ring-2 focus:ring-orange-200 outline-none" placeholder="VD: Máy lọc không khí..." />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-orange-600 uppercase px-1 tracking-widest">Tệp khách hàng mục tiêu</label>
                <input type="text" value={state.targetAudience} onChange={e => setState((p:any) => ({ ...p, targetAudience: e.target.value }))} className="w-full p-4 bg-orange-50/30 border border-orange-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-orange-200 outline-none" placeholder="VD: Mẹ bỉm sữa, Gen Z..." />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-orange-900 uppercase px-1 tracking-widest">USP nổi bật (Keyword)</label>
              <textarea value={state.keyword} onChange={e => setState((p:any) => ({ ...p, keyword: e.target.value }))} className="w-full p-4 bg-orange-50/30 border border-orange-100 rounded-2xl h-20 text-sm font-bold focus:ring-2 focus:ring-orange-200 outline-none" placeholder="VD: Công nghệ lọc HEPA, khử mùi 99%..." />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-orange-900 uppercase px-1">Giới tính Voice-over</label>
                <select value={state.gender} onChange={e => setState((p:any) => ({ ...p, gender: e.target.value }))} className="w-full p-4 bg-white border border-orange-100 rounded-2xl font-bold outline-none">
                  <option value="Nữ">Nữ</option>
                  <option value="Nam">Nam</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-orange-900 uppercase px-1">Giọng đọc & Phong cách (VO)</label>
                <select value={state.voice} onChange={e => setState((p:any) => ({ ...p, voice: e.target.value }))} className="w-full p-4 bg-white border border-orange-100 rounded-2xl font-bold outline-none">
                  {VOICE_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                <label className="block text-[10px] font-black text-orange-900 uppercase px-1">Phong cách ảnh</label>
                <div className="flex bg-orange-50/30 p-1.5 rounded-2xl border border-orange-100 shadow-inner">
                  <button onClick={() => setState((p: any) => ({ ...p, imageStyle: 'Realistic' }))} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${state.imageStyle === 'Realistic' ? 'bg-orange-600 text-white shadow-md' : 'text-orange-400 hover:text-orange-600'}`}>Chân thực</button>
                  <button onClick={() => setState((p: any) => ({ ...p, imageStyle: '3D' }))} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${state.imageStyle === '3D' ? 'bg-orange-600 text-white shadow-md' : 'text-orange-400 hover:text-orange-600'}`}>3D</button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-orange-900 uppercase px-1">Hiển thị tay người</label>
                <select 
                  value={state.handVisibility} 
                  onChange={e => {
                    const val = e.target.value;
                    setState((p:any) => ({ ...p, handVisibility: val, handFile: val === 'no_hand' ? null : p.handFile, handPreviewUrl: val === 'no_hand' ? null : p.handPreviewUrl }));
                  }} 
                  className="w-full p-4 bg-white border border-orange-100 rounded-2xl font-bold text-orange-600 outline-none"
                >
                  <option value="with_hand">Có xuất hiện tay cầm sản phẩm</option>
                  <option value="no_hand">Không xuất hiện tay</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-black text-orange-900 uppercase px-1 tracking-widest">Bố cục kịch bản (Layout)</label>
              <select value={state.scriptLayout} onChange={e => setState((p:any) => ({ ...p, scriptLayout: e.target.value }))} className="w-full p-4 bg-white border border-orange-100 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-orange-200 transition-all">
                <option value="">-- Random Layout --</option>
                {LAYOUT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-orange-900 uppercase px-1">Xưng hô kịch bản</label>
                <input list="nf-addr" value={state.addressing} onChange={e => setState((p:any) => ({ ...p, addressing: e.target.value }))} className="w-full p-4 bg-white border border-orange-100 rounded-2xl font-bold text-sm outline-none" placeholder="VD: em - anh chị" />
                <datalist id="nf-addr">{ADDRESSING_OPTIONS.map(o => <option key={o} value={o} />)}</datalist>
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-orange-900 uppercase px-1">Thời lượng (Scenes)</label>
                <select value={state.sceneCount} onChange={e => setState((p:any) => ({ ...p, sceneCount: parseInt(e.target.value) }))} className="w-full p-4 bg-white border border-orange-100 rounded-2xl font-bold text-orange-600 outline-none">
                  {SCENE_COUNT_OPTIONS.map(o => <option key={o.count} value={o.count}>{o.label}</option>)}
                </select>
              </div>
            </div>
            <button onClick={handleGenerate} disabled={state.isGeneratingScript} className="w-full py-5 bg-gradient-to-r from-orange-600 to-red-600 text-white font-black rounded-3xl uppercase shadow-xl hover:shadow-orange-200 transition-all tracking-[0.2em] flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50">
              {state.isGeneratingScript ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "🚀 TẠO CHIẾN DỊCH NON-FACE"}
            </button>
          </div>
        </div>
      </div>

      {state.script && (
        <div className="space-y-10 pb-32 animate-fadeIn">
          <div className="bg-white p-8 rounded-[3rem] border border-orange-100 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h3 className="text-xl font-black text-orange-900 uppercase tracking-tight">KẾT QUẢ CHIẾN DỊCH (NON-FACE)</h3>
              <p className="text-[10px] font-bold text-orange-500 uppercase tracking-[0.3em] mt-1">Đã tạo {state.sceneCount} phân cảnh • Layout: {state.scriptLayout.substring(0, 30)}...</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <button onClick={() => handleBulkAction('image')} className="px-6 py-4 bg-orange-600 text-white text-[11px] font-black rounded-2xl shadow-lg hover:bg-orange-700 transition-all uppercase tracking-widest">Vẽ tất cả ảnh</button>
              <button onClick={() => handleBulkAction('prompt')} className="px-6 py-4 bg-orange-500 text-white text-[11px] font-black rounded-2xl shadow-lg hover:bg-orange-600 transition-all uppercase tracking-widest">Tạo tất cả prompt</button>
              <button onClick={downloadAllImages} className="px-6 py-4 bg-white text-orange-900 border border-orange-100 text-[11px] font-black rounded-2xl shadow-lg hover:bg-orange-50 transition-all uppercase">Tải ZIP Ảnh</button>
              <button onClick={downloadAllPrompts} className="px-6 py-4 bg-red-600 text-white text-[11px] font-black rounded-2xl shadow-lg hover:bg-red-700 transition-all uppercase">Tải Prompt (.TXT)</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
            {Array.from({ length: state.sceneCount }, (_, i) => `v${i + 1}`).map((key, idx) => (
              <div key={key} className="space-y-4">
                <ScriptSection 
                  title={`Phần ${idx + 1}`} 
                  content={state.script[key]} 
                  color="border-orange-500" 
                  onChange={(v) => setState((p:any) => ({ ...p, script: { ...p.script, [key]: v } }))} 
                  onRegenerate={() => handleRegenerateScriptPart(key)}
                  isRegenerating={state.isRegeneratingPart[key]}
                />
                <ImageCard
                  label={`Cảnh ${idx + 1}`} 
                  imageData={state.images[key] || { url: '', loading: false }} 
                  videoPrompt={state.videoPrompts[key] || { text: '', loading: false, visible: false }}
                  onGeneratePrompt={() => handleGeneratePromptForKey(key)} 
                  onRegenerate={() => handleGenImageForKey(key)} 
                  onTranslate={() => {}}
                  onUpload={(file) => handleUploadImageForKey(key, file)}
                  poseOptions={NONFACE_POSES}
                  pose={state.images[key]?.pose || ''}
                  onPoseChange={(val) => setState((p:any) => ({ ...p, images: { ...p.images, [key]: { ...p.images[key], pose: val } } }))}
                  customPrompt={state.images[key]?.customPrompt || ''} 
                  onCustomPromptChange={(v) => setState((p:any) => ({ ...p, images: { ...p.images, [key]: { ...p.images[key], customPrompt: v } } }))}
                  onDelete={() => setState((p:any) => ({ ...p, images: { ...p.images, [key]: { ...p.images[key], url: '', loading: false } } }))}
                />
              </div>
            ))}
          </div>

          {/* Action Footer for Non-Face Result */}
          <div className="flex flex-col items-center gap-12 py-12">
            {hasGeneratedMedia && (
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 border-t border-orange-100 w-full pt-12">
                <button
                  onClick={downloadAllImages}
                  className="w-full md:w-auto px-12 py-5 bg-orange-500 text-white font-black rounded-2xl shadow-xl hover:bg-orange-600 transition-all active:scale-[0.98] flex items-center justify-center gap-3 uppercase tracking-widest text-base"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Tải toàn bộ ảnh (ZIP)
                </button>
                <button
                  onClick={downloadAllPrompts}
                  className="w-full md:w-auto px-12 py-5 bg-gradient-to-r from-orange-600 to-red-600 text-white font-black rounded-2xl shadow-xl hover:shadow-orange-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 uppercase tracking-widest text-base"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1.01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Tải bộ Prompt (.TXT)
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NonFaceReviewModule;
