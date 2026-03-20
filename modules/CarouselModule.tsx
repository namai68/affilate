
import React, { useState, useRef, useEffect } from 'react';
import * as service from '../services/carouselService';
import CarouselCard from '../components/CarouselCard';

declare var JSZip: any;

const CAROUSEL_CATEGORIES: Record<string, string[]> = {
  "Kể chuyện cá nhân": [
    "Thành công nhiều người ngưỡng mộ",
    "Thất bại để tạo sự đồng cảm/ngưỡng mộ/nể phục cho đám đông",
    "Khoảnh khắc đời thường với góc nhìn độc đáo",
    "Bài học từ trải nghiệm nào đó",
    "Kể chuyện trải nghiệm"
  ],
  "Tổng hợp": [
    "Lần đầu làm 1 việc gì đấy",
    "Những điều hay nhất/tệ nhất",
    "Cảnh báo về 1 vấn đề nào đấy",
    "Xu hướng",
    "Hướng dẫn",
    "Tài liệu để giải quyết 1 vấn đề gì đấy",
    "Công cụ hữu ích"
  ],
  "So sánh": [
    "Sản phẩm cùng loại",
    "Thế hệ",
    "Vùng miền",
    "Các thương hiệu/các hãng/các công ty",
    "Hiệu quả/Công dụng/Lợi ích/Tính năng"
  ],
  "Check var (Kiểm chứng)": [
    "Phát biểu của người nổi tiếng/người bất kỳ",
    "Một hiện tượng lạ",
    "Các vấn đề, chủ đề có nhiều luồng ý kiến"
  ],
  "Hướng dẫn chi tiết": [
    "Những thứ cần thiết để phát triển trong 1 lĩnh vực/ngành nghề/công việc",
    "Những thứ giúp người khác tăng thu nhập",
    "Bảo vệ mọi người, giúp người khác an toàn",
    "Rút ngắn thời gian hoàn thành 1 thứ gì đó",
    "Công cụ, công nghệ hiện đại"
  ],
  "Kể chuyện sản phẩm/dịch vụ": [
    "Quá trình ra đời của 1 sản phẩm",
    "Một sản phẩm thất bại và bài học từ đó",
    "Câu chuyện về những khách hàng đầu tiên/ấn tượng nhất/đặc biệt nhất",
    "1 sản phẩm độc đáo và các tình huống khác nhau xoay quanh nó",
    "Tình huống oái oăm, dở khóc, dở cười khi bán sản phẩm",
    "Chuyện về nhà sáng lập/hội đồng sáng lập"
  ]
};

const FONTS = [
  // Sans-serif / Modern
  { id: 'Montserrat', label: 'Montserrat (Đậm chất GenZ)' },
  { id: 'Roboto', label: 'Roboto (Hiện đại / Phổ biến)' },
  { id: 'Open Sans', label: 'Open Sans (Sạch sẽ / Dễ đọc)' },
  { id: 'Oswald', label: 'Oswald (Mạnh mẽ / Narrow)' },
  { id: 'Noto Sans', label: 'Noto Sans (Cơ bản / Chuẩn)' },
  { id: 'Josefin Sans', label: 'Josefin Sans (Hình học / Sang)' },
  { id: 'Archivo Black', label: 'Archivo Black (Siêu dày / Nổi)' },
  
  // Serif / Classic
  { id: 'Playfair Display', label: 'Playfair Display (Cổ điển / Qúy phái)' },
  { id: 'Lora', label: 'Lora (Văn chương / Thanh lịch)' },
  { id: 'Merriweather', label: 'Merriweather (Tin cậy / Serif)' },
  { id: 'Raleway', label: 'Raleway (Tinh tế / Fashion)' },

  // Script / Handwriting
  { id: 'Pacifico', label: 'Pacifico (Viết tay / Phóng khoáng)' },
  { id: 'Dancing Script', label: 'Dancing Script (Bay bổng)' },
  { id: 'Lobster', label: 'Lobster (Cổ điển / Retro)' },
  { id: 'Charm', label: 'Charm (Thư pháp nhẹ nhàng)' },
  { id: 'Mali', label: 'Mali (Vui tươi / Cute)' },
  { id: 'Patrick Hand', label: 'Patrick Hand (Viết bút bi)' },

  // Rounded / Others
  { id: 'Baloo 2', label: 'Baloo 2 (Tròn trịa / Thân thiện)' },
  { id: 'Comfortaa', label: 'Comfortaa (Bo tròn / Công nghệ)' },
  { id: 'Quicksand', label: 'Quicksand (Nhẹ nhàng / Trẻ)' },
  { id: 'Saira Stencil One', label: 'Saira Stencil (Phá cách / Bụi)' }
];

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

const CarouselModule: React.FC = () => {
  const storageKey = "carousel_project_v14_sync_koc";
  const [state, setState] = useState<any>({
    category: 'Kể chuyện cá nhân',
    subCategory: 'Thành công nhiều người ngưỡng mộ',
    topic: '',
    storyIdea: '',
    imageCount: 4,
    fontFamily: 'Montserrat',
    gender: 'Nữ',
    voice: VOICE_OPTIONS[0],
    addressing: '',
    imageStyle: 'Realistic',
    items: [],
    productFiles: [],
    productPreviews: [],
    faceFile: null,
    facePreview: null,
    extraNote: '',
    characterNote: '',
    isGeneratingScript: false
  });

  const productInputRef = useRef<HTMLInputElement>(null);
  const faceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState((p: any) => ({ 
          ...p, 
          ...parsed, 
          productFiles: [], 
          productPreviews: [], 
          faceFile: null, 
          facePreview: null,
          items: (parsed.items || []).map((i: any) => ({ 
            ...i, 
            loading: false,
            textPosition: i.textPosition || 'Bottom',
            textColor: i.textColor || '#FFFFFF',
            fontSize: i.fontSize || 60,
            videoPrompt: i.videoPrompt || { text: '', loading: false, visible: false }
          }))
        }));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    const toSave = { 
      category: state.category,
      subCategory: state.subCategory,
      topic: state.topic,
      storyIdea: state.storyIdea,
      imageCount: state.imageCount,
      fontFamily: state.fontFamily,
      gender: state.gender,
      voice: state.voice,
      addressing: state.addressing,
      imageStyle: state.imageStyle,
      extraNote: state.extraNote,
      characterNote: state.characterNote,
      items: state.items.map((i: any) => ({
        id: i.id,
        content: i.content,
        regenerateNote: i.regenerateNote,
        textPosition: i.textPosition,
        textColor: i.textColor,
        fontSize: i.fontSize,
        imageUrl: '',
        videoPrompt: i.videoPrompt
      }))
    };
    try { localStorage.setItem(storageKey, JSON.stringify(toSave)); } catch (e) {}
  }, [state]);

  useEffect(() => {
    const handleExport = () => {
      const exportData = state.items.map((item: any, index: number) => ({
        stt: index + 1,
        inputs: {
          category: state.category,
          subCategory: state.subCategory,
          topic: state.topic,
          storyIdea: state.storyIdea,
          characterNote: state.characterNote,
          extraNote: state.extraNote,
          settings: {
            fontFamily: state.fontFamily,
            gender: state.gender,
            voice: state.voice,
            addressing: state.addressing,
            imageStyle: state.imageStyle,
            textPosition: item.textPosition,
            textColor: item.textColor,
            fontSize: item.fontSize
          }
        },
        script: item.content,
        outputImage: item.imageUrl || '',
        videoPrompt: item.videoPrompt?.text || ''
      }));

      window.dispatchEvent(new CustomEvent('EXPORT_DATA_READY', { 
        detail: { data: exportData, moduleName: 'Anh_Cuon_Carousel' } 
      }));
    };

    const smartFind = (obj: any, keys: string[]) => {
      const lowerKeys = keys.map(k => k.toLowerCase());
      const foundKey = Object.keys(obj || {}).find(k => lowerKeys.includes(k.toLowerCase()));
      return foundKey ? obj[foundKey] : undefined;
    };

    const handleImport = async (e: any) => {
      const importedData = e.detail;
      if (!Array.isArray(importedData)) return;

      const firstItem = importedData[0];
      const inputs = smartFind(firstItem, ['inputs', 'input', 'data']) || {};
      const settings = smartFind(inputs, ['settings', 'config']) || {};

      const newState = {
        ...state,
        category: smartFind(inputs, ['category', 'danh mục']) || state.category,
        subCategory: smartFind(inputs, ['subCategory', 'chi tiết']) || state.subCategory,
        topic: smartFind(inputs, ['topic', 'chủ đề']) || state.topic,
        storyIdea: smartFind(inputs, ['storyIdea', 'ý tưởng']) || state.storyIdea,
        characterNote: smartFind(inputs, ['characterNote', 'character', 'nhân vật']) || state.characterNote,
        extraNote: smartFind(inputs, ['extraNote', 'extra', 'bối cảnh']) || state.extraNote,
        fontFamily: smartFind(settings, ['fontFamily', 'font']) || state.fontFamily,
        gender: smartFind(settings, ['gender', 'giới tính']) || state.gender,
        voice: smartFind(settings, ['voice', 'giọng']) || state.voice,
        addressing: smartFind(settings, ['addressing', 'xưng hô']) || state.addressing,
        imageStyle: smartFind(settings, ['imageStyle']) || state.imageStyle,
        imageCount: importedData.length,
        items: []
      };

      const total = importedData.length;
      for (let i = 0; i < total; i++) {
        const item = importedData[i];
        const itemSettings = smartFind(item, ['settings', 'config']) || {};
        
        newState.items.push({
          id: i + 1,
          content: smartFind(item, ['script', 'content', 'text']) || '',
          imageUrl: smartFind(item, ['outputImage', 'image', 'base64']) || '',
          loading: false,
          regenerateNote: '',
          textPosition: smartFind(itemSettings, ['textPosition', 'vị trí']) || 'Bottom',
          textColor: smartFind(itemSettings, ['textColor', 'màu']) || '#FFFFFF',
          fontSize: smartFind(itemSettings, ['fontSize', 'kích cỡ']) || 60,
          videoPrompt: { 
            text: smartFind(item, ['videoPrompt', 'prompt']) || '', 
            loading: false, 
            visible: true 
          }
        });

        const percent = Math.round(((i + 1) / total) * 100);
        window.dispatchEvent(new CustomEvent('IMPORT_DATA_PROGRESS', { detail: { percent, complete: i === total - 1 } }));
        await new Promise(r => setTimeout(r, 100));
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

  const handleProductFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = (Array.from(e.target.files) as File[]).slice(0, 5);
      const urls = files.map(f => URL.createObjectURL(f));
      setState((p: any) => ({ ...p, productFiles: files, productPreviews: urls }));
    }
  };

  const handleFaceFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setState((p: any) => ({ ...p, faceFile: file, facePreview: URL.createObjectURL(file) }));
    }
  };

  const handleGenerateScript = async () => {
    if (!state.storyIdea && !state.topic) return;
    setState((p: any) => ({ ...p, isGeneratingScript: true }));
    try {
      const res = await service.generateCarouselScript(
        state.topic || state.storyIdea, 
        state.imageCount, 
        state.extraNote, 
        state.topic, 
        state.category, 
        state.subCategory,
        state.storyIdea,
        state.gender,
        state.voice,
        state.addressing
      );
      setState((p: any) => ({ 
        ...p, 
        items: res.map((t, i) => ({ 
          id: i + 1, 
          content: t, 
          imageUrl: '', 
          loading: false, 
          regenerateNote: '',
          textPosition: 'Bottom',
          textColor: '#FFFFFF',
          fontSize: 60,
          videoPrompt: { text: '', loading: false, visible: false }
        })) 
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setState((p: any) => ({ ...p, isGeneratingScript: false }));
    }
  };

  const handleGenerateImage = async (id: number, isRegen: boolean = false) => {
    const item = state.items.find((i: any) => i.id === id);
    if (!item) return;

    setState((p: any) => ({
      ...p,
      items: p.items.map((i: any) => i.id === id ? { ...i, loading: true, error: undefined } : i)
    }));

    try {
      const productParts = await Promise.all(state.productFiles.map((f: File) => service.fileToGenerativePart(f)));
      const facePart = state.faceFile ? await service.fileToGenerativePart(state.faceFile) : null;
      
      const url = await service.generateCarouselImage(
        productParts,
        facePart,
        item.content,
        state.characterNote,
        state.extraNote,
        isRegen ? item.regenerateNote : '',
        state.fontFamily,
        item.textPosition,
        state.gender,
        item.textColor,
        item.fontSize,
        state.imageStyle
      );

      setState((p: any) => ({
        ...p,
        items: p.items.map((i: any) => i.id === id ? { ...i, loading: false, imageUrl: url } : i)
      }));
    } catch (e) {
      setState((p: any) => ({
        ...p,
        items: p.items.map((i: any) => i.id === id ? { ...i, loading: false, error: 'Lỗi' } : i)
      }));
    }
  };

  const handleGeneratePrompt = async (id: number) => {
    const item = state.items.find((i: any) => i.id === id);
    if (!item) return;

    setState((p: any) => ({
      ...p,
      items: p.items.map((i: any) => i.id === id ? { ...i, videoPrompt: { ...i.videoPrompt, loading: true, visible: true } } : i)
    }));

    try {
      const prompt = await service.generateCarouselVeoPrompt(
        item.content,
        state.gender,
        state.voice,
        state.characterNote,
        state.extraNote,
        state.imageStyle
      );

      setState((p: any) => ({
        ...p,
        items: p.items.map((i: any) => i.id === id ? { ...i, videoPrompt: { text: prompt, loading: false, visible: true } } : i)
      }));
    } catch (e) {
      setState((p: any) => ({
        ...p,
        items: p.items.map((i: any) => i.id === id ? { ...i, videoPrompt: { ...i.videoPrompt, loading: false } } : i)
      }));
    }
  };

  const handleBulkPrompt = async () => {
    for (const item of state.items) {
      if (item.imageUrl) {
        await handleGeneratePrompt(item.id);
      }
    }
  };

  const handleDownloadAllImages = async () => {
    if (typeof JSZip === 'undefined') {
      alert("Đang tải thư viện nén, vui lòng thử lại sau giây lát.");
      return;
    }

    const zip = new JSZip();
    let count = 0;

    for (let i = 0; i < state.items.length; i++) {
      const item = state.items[i];
      if (item.imageUrl) {
        const base64Data = item.imageUrl.split(',')[1];
        if (base64Data) {
          const fileName = `${String(i + 1).padStart(2, '0')}.png`;
          zip.file(fileName, base64Data, { base64: true });
          count++;
        }
      }
    }

    if (count === 0) {
      alert("Không có ảnh nào để tải xuống.");
      return;
    }

    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `carousel_images_${Date.now()}.zip`;
    link.click();
  };

  const handleDownloadAllPrompts = () => {
    const text = (state.items || [])
      .map((i: any) => i.videoPrompt?.text || "")
      .filter((t: string) => t.trim().length > 0)
      .map((t: string) => t.replace(/\n/g, ' '))
      .join('\n');
    
    if (!text) {
      alert("Vui lòng tạo Video Prompt trước khi tải xuống.");
      return;
    }
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `prompts_carousel_${Date.now()}.txt`;
    link.click();
  };

  const updateItem = (id: number, updates: any) => {
    setState((p:any) => ({
      ...p,
      items: p.items.map((i:any) => i.id === id ? { ...i, ...updates } : i)
    }));
  };

  const hasAnyImages = state.items.some((item: any) => item.imageUrl);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white rounded-[10px] border border-orange-100 p-8 shadow-sm mb-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6">
          
          {/* CỘT TRÁI: DANH MỤC, Ý TƯỞNG, NHÂN VẬT */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-orange-900 uppercase tracking-widest px-1">1. Danh mục (Category):</label>
                <select 
                  value={state.category} 
                  onChange={e => setState((p:any)=>({...p, category: e.target.value, subCategory: CAROUSEL_CATEGORIES[e.target.value][0]}))}
                  className="w-full p-3.5 bg-white border border-orange-100 rounded-[10px] text-sm font-medium outline-none focus:border-orange-500 transition-all shadow-sm"
                >
                  {Object.keys(CAROUSEL_CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-orange-900 uppercase tracking-widest px-1">2. Nội dung (Details):</label>
                <select 
                  value={state.subCategory} 
                  onChange={e => setState((p:any)=>({...p, subCategory: e.target.value}))}
                  className="w-full p-3.5 bg-white border border-orange-100 rounded-[10px] text-sm font-medium outline-none focus:border-orange-500 transition-all shadow-sm"
                >
                  {CAROUSEL_CATEGORIES[state.category].map(sc => <option key={sc} value={sc}>{sc}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-orange-900 uppercase tracking-widest px-1">3. Ý tưởng câu chuyện / Chủ đề:</label>
              <textarea 
                value={state.storyIdea} 
                onChange={e => setState((p:any)=>({...p, storyIdea: e.target.value}))}
                placeholder="Ví dụ: 100 lần thử thách bán hàng nhưng thất bại..."
                className="w-full h-32 p-4 border border-orange-100 rounded-[10px] text-sm font-medium focus:border-orange-500 outline-none transition-all resize-none bg-orange-50/30 focus:bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-orange-900 uppercase tracking-widest px-1">4. Ảnh khuôn mặt (Face Ref):</label>
              <div 
                onClick={() => faceInputRef.current?.click()}
                className="w-full h-32 border-2 border-dashed border-orange-100 rounded-[10px] flex items-center justify-center cursor-pointer hover:bg-orange-50 transition-all bg-orange-50/30 group"
              >
                {state.facePreview ? (
                  <img src={state.facePreview} className="h-full object-contain p-2" />
                ) : (
                  <span className="text-[11px] font-bold text-orange-300 uppercase tracking-widest group-hover:text-orange-400">Tải Ảnh Khuôn Mặt</span>
                )}
                <input type="file" ref={faceInputRef} onChange={handleFaceFile} className="hidden" accept="image/*" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-orange-900 uppercase tracking-widest px-1 text-orange-600">5. Mô tả nhân vật:</label>
              <textarea 
                value={state.characterNote} 
                onChange={e => setState((p:any)=>({...p, characterNote: e.target.value}))}
                placeholder="Ví dụ: Nữ, 25 tuổi, phong cách năng động, mặc áo phông trắng..."
                className="w-full h-24 p-3.5 border border-orange-100 rounded-[10px] text-sm font-medium focus:border-orange-500 outline-none transition-all bg-orange-50/30 focus:bg-white resize-none"
              />
            </div>
          </div>

          {/* CỘT PHẢI: SẢN PHẨM, CẤU HÌNH, VỊ TRÍ CHỮ */}
          <div className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-orange-900 uppercase tracking-widest px-1">6. Ảnh sản phẩm:</label>
              <div 
                onClick={() => productInputRef.current?.click()}
                className="w-full h-32 border-2 border-dashed border-orange-100 rounded-[10px] flex items-center justify-center cursor-pointer hover:bg-orange-50 transition-all bg-orange-50/30 group"
              >
                {state.productPreviews.length > 0 ? (
                  <div className="grid grid-cols-5 gap-2 p-3 w-full h-full">
                    {state.productPreviews.map((url: string, i: number) => (
                      <img key={i} src={url} className="w-full h-full object-cover rounded-[5px]" />
                    ))}
                  </div>
                ) : (
                  <span className="text-[11px] font-bold text-orange-300 uppercase tracking-widest group-hover:text-orange-400">Tải Ảnh Sản Phẩm</span>
                )}
                <input type="file" ref={productInputRef} multiple onChange={handleProductFiles} className="hidden" accept="image/*" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-orange-900 uppercase tracking-widest px-1">7. Giới tính:</label>
                  <select 
                    value={state.gender} 
                    onChange={e => setState((p:any)=>({...p, gender: e.target.value}))}
                    className="w-full p-3.5 bg-white border border-orange-100 rounded-[10px] text-sm font-bold outline-none focus:border-orange-500 shadow-sm"
                  >
                    <option value="Nữ">Nữ</option>
                    <option value="Nam">Nam</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-orange-900 uppercase tracking-widest px-1">8. Vùng miền:</label>
                  <select 
                    value={state.voice} 
                    onChange={e => setState((p:any)=>({...p, voice: e.target.value}))}
                    className="w-full p-3.5 bg-white border border-orange-100 rounded-[10px] text-sm font-bold outline-none focus:border-orange-500 shadow-sm"
                  >
                    {VOICE_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-orange-900 uppercase tracking-widest px-1">9. Cách xưng hô:</label>
                <div className="relative group">
                  <input 
                    list="carousel-addressing-list"
                    value={state.addressing} 
                    onChange={e => setState((p:any)=>({...p, addressing: e.target.value}))}
                    placeholder="Chọn hoặc tự nhập"
                    className="w-full p-3.5 bg-white border border-orange-100 rounded-[10px] text-sm font-bold outline-none focus:border-orange-500 shadow-sm"
                  />
                  <datalist id="carousel-addressing-list">
                    {ADDRESSING_OPTIONS.map(opt => <option key={opt} value={opt} />)}
                  </datalist>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-orange-900 uppercase tracking-widest px-1">10. Số Slide:</label>
                <select 
                  value={state.imageCount} 
                  onChange={e => setState((p:any)=>({...p, imageCount: parseInt(e.target.value)}))}
                  className="w-full p-3.5 bg-white border border-orange-100 rounded-[10px] text-sm font-medium outline-none focus:border-orange-500 transition-all shadow-sm"
                >
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => <option key={n} value={n}>{n} Slides</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-orange-900 uppercase tracking-widest px-1">11. Phong cách ảnh:</label>
                <div className="flex bg-orange-50/30 p-1 rounded-xl border border-orange-100">
                  <button 
                    onClick={() => setState((p:any)=>({...p, imageStyle: 'Realistic'}))}
                    className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${state.imageStyle === 'Realistic' ? 'bg-orange-600 text-white shadow-md' : 'text-orange-400 hover:text-orange-600'}`}
                  >
                    Chân thực
                  </button>
                  <button 
                    onClick={() => setState((p:any)=>({...p, imageStyle: '3D'}))}
                    className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${state.imageStyle === '3D' ? 'bg-orange-600 text-white shadow-md' : 'text-orange-400 hover:text-orange-600'}`}
                  >
                    3D Animation
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-orange-900 uppercase tracking-widest px-1">12. Ghi chú bối cảnh:</label>
                <input 
                  type="text" 
                  value={state.extraNote} 
                  onChange={e => setState((p:any)=>({...p, extraNote: e.target.value}))}
                  placeholder="Quán cafe, ngoài trời..."
                  className="w-full p-3.5 border border-orange-100 rounded-[10px] text-sm font-medium focus:border-orange-500 outline-none transition-all bg-orange-50/30 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
               <div className="space-y-2">
                <label className="text-[11px] font-bold text-orange-900 uppercase tracking-widest px-1">13. Font chữ nghệ thuật (Dự án):</label>
                <select 
                  value={state.fontFamily} 
                  onChange={e => setState((p:any)=>({...p, fontFamily: e.target.value}))}
                  className="w-full p-3.5 bg-white border border-orange-100 rounded-[10px] text-sm font-bold outline-none focus:border-orange-500 transition-all shadow-sm focus:ring-1 focus:ring-orange-200"
                  style={{ fontFamily: state.fontFamily }}
                >
                  {FONTS.map(f => (
                    <option key={f.id} value={f.id} style={{ fontFamily: f.id }}>
                      {f.label}
                    </option>
                  ))}
                </select>
                
                <div className="mt-2 p-4 bg-orange-50/30 border border-orange-50 rounded-[12px] flex items-center justify-center min-h-[60px] overflow-hidden">
                  <span className="text-lg font-black text-center text-orange-900 transition-all duration-300" style={{ fontFamily: state.fontFamily }}>
                    AaBbCc — Cộng đồng Affiliate AI: Kịch bản & Hình ảnh đỉnh cao
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 pt-4">
            <button 
              onClick={handleGenerateScript} 
              disabled={state.isGeneratingScript || (!state.topic && !state.storyIdea)}
              className="w-full py-5 bg-gradient-to-r from-orange-600 to-red-600 text-white font-black rounded-[10px] text-base shadow-xl hover:shadow-orange-500/20 transition-all disabled:opacity-50 uppercase tracking-widest active:scale-[0.98]"
            >
              {state.isGeneratingScript ? "Đang xử lý kịch bản..." : "Tạo Kịch Bản Nội Dung"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {state.items.map((item: any) => (
          <CarouselCard 
            key={item.id} 
            item={item} 
            onTextChange={(id, text) => updateItem(id, { content: text })}
            onGenerate={(id) => handleGenerateImage(id)}
            onRegenerate={(id) => handleGenerateImage(id, true)}
            onGeneratePrompt={(id) => handleGeneratePrompt(id)}
            onNoteChange={(id, text) => updateItem(id, { regenerateNote: text })}
            onPositionChange={(id, pos) => updateItem(id, { textPosition: pos })}
            onColorChange={(id, color) => updateItem(id, { textColor: color })}
            onFontSizeChange={(id, size) => updateItem(id, { fontSize: size })}
          />
        ))}
      </div>

      {hasAnyImages && (
        <div className="flex flex-col items-center gap-12 py-12 border-t border-orange-100">
           <button 
                onClick={handleBulkPrompt} 
                className="px-12 py-5 bg-gradient-to-r from-orange-600 to-red-600 text-white font-black rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all text-lg flex items-center gap-4 uppercase tracking-widest"
            >
                TỰ ĐỘNG VIẾT TẤT CẢ PROMPTS
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14H11V21L20 10H13Z" /></svg>
            </button>

            <div className="flex flex-col md:flex-row items-center justify-center gap-4 w-full">
              <button 
                onClick={handleDownloadAllImages}
                className="w-full md:w-auto px-12 py-5 bg-orange-500 text-white font-black rounded-2xl shadow-xl hover:bg-orange-600 transition-all active:scale-[0.98] flex items-center justify-center gap-3 uppercase tracking-widest text-base"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                TẢI TOÀN BỘ ẢNH (ZIP)
              </button>
              <button 
                onClick={handleDownloadAllPrompts}
                className="w-full md:w-auto px-12 py-5 bg-gradient-to-r from-orange-600 to-red-600 text-white font-black rounded-2xl shadow-xl hover:shadow-orange-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 uppercase tracking-widest text-base"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1.01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                TẢI FILE PROMPT (.TXT)
              </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default CarouselModule;
