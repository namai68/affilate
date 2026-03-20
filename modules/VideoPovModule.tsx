
import React, { useState, useRef, useEffect } from 'react';
import * as service from '../services/videoPovService';
import { PovScriptSegment } from '../types';

declare var JSZip: any;

const STYLES = [
    { id: 'tâm sự trải lòng', label: 'Tâm sự trải lòng (Deep/Emotional)' },
    { id: 'vui vẻ hài hước', label: 'Vui vẻ hài hước (Funny/Humorous)' },
    { id: 'kịch tính & cảm xúc', label: 'Kịch tính & cảm xúc (Dramatic)' },
    { id: 'chuyên gia phân tích', label: 'Chuyên gia phân tích (Analytical)' },
    { id: 'kể chuyện drama', label: 'Kể chuyện Drama (Storytelling)' },
    { id: 'vlog đời thường', label: 'Vlog đời thường (Daily Vlog)' },
    { id: 'hào hứng bắt trend', label: 'Hào hứng - Bắt trend (Excited/Trendy)' },
    { id: 'thư giãn healing', label: 'Thư giãn - Healing (Chill)' },
    { id: 'châm biếm sarki', label: 'Châm biếm - Sarky (Sarcastic)' },
    { id: 'thực chiến hậu trường', label: 'Thực chiến - Hậu trường (Real/BTS)' },
    { id: 'phản biện góc nhìn ngược', label: 'Phản biện - Góc nhìn ngược (Contrarian)' },
    { id: 'thẳng thắn gắt', label: 'Thẳng thắn - Gắt (Brutal Honesty)' },
    { id: 'truyền cảm hứng', label: 'Truyền cảm hứng (Motivational)' },
    { id: 'điện ảnh nghệ thuật', label: 'Điện ảnh - Nghệ thuật (Cinematic)' },
    { id: 'so sánh đối chiếu', label: 'So sánh & Đối chiếu (Comparison/Versus)' },
    { id: 'giải mã bóc trần', label: 'Giải mã & Bóc trần (Myth-Busting)' },
    { id: 'tổng hợp top list', label: 'Tổng hợp & Top List (Curator/Listicle)' },
    { id: 'thử thách trải nghiệm', label: 'Thử thách & Trải nghiệm (Challenge)' }
];

const SCENE_COUNT_OPTIONS = Array.from({ length: 20 }, (_, i) => {
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

const POV_POSES = [
  { "value": "", "label": "-- Chọn tư thế POV --" },
  { "value": "pov_eye_contact_subtle", "label": "POV – Ngồi yên, ánh mắt di chuyển nhẹ" },
  { "value": "pov_look_down_hands", "label": "POV – Nhìn xuống tay khi tự sự" },
  { "value": "pov_cover_mouth_chin", "label": "POV – Tay che cằm/miệng, nói chậm" },
  { "value": "pov_edge_frame_space", "label": "POV – Ngồi lệch khung, nhiều khoảng trống" },
  { "value": "pov_lean_back_look_up", "label": "POV – Tựa ghế, nhìn trần nhà hồi tưởng" },
  { "value": "pov_nod_acceptance", "label": "POV – Cúi đầu, gật nhẹ xác nhận" },
  { "value": "pov_45_angle_away", "label": "POV – Nghiêng 45°, không nhìn camera" },
  { "value": "pov_hands_clasped_table", "label": "POV – Hai tay đan trên bàn, căng thẳng" },
  { "value": "pov_still_standing", "label": "POV – Đứng yên, tay buông, ánh mắt nói" },
  { "value": "pov_look_then_turn_away", "label": "POV – Nhìn camera rồi quay đi" },
  { "value": "pov_exhale_before_speak", "label": "POV – Thở ra nhẹ trước khi nói" },
  { "value": "pov_rub_face_fatigue", "label": "POV – Xoa mặt, mệt mỏi" },
  { "value": "pov_pause_silence", "label": "POV – Im lặng vài giây nhìn xuống" },
  { "value": "pov_hold_object_idle", "label": "POV – Cầm đồ vật, xoay nhẹ khi nói" },
  { "value": "pov_half_smile_realization", "label": "POV – Cười nhạt khi tỉnh ngộ" }
];

const VideoPovModule: React.FC = () => {
  const storageKey = "videopov_project_v18_poses";
  const [state, setState] = useState<any>({
    videoFile: null,
    videoPreviewUrl: null,
    originalScriptInput: '',
    analysis: '',
    isAnalyzing: false,
    style: 'châm biếm sarki',
    gender: 'Nữ',
    voice: 'Giọng Bắc 20-40 tuổi',
    addressing: '',
    imageStyle: 'Realistic',
    characterDescription: '',
    outfitFile: null,
    outfitPreviewUrl: null,
    isExtractingOutfit: false,
    contextNote: '',
    segmentCount: 5,
    faceFile: null,
    facePreviewUrl: null,
    isGeneratingScript: false,
    isRegeneratingPart: {},
    segments: []
  });

  const videoInputRef = useRef<HTMLInputElement>(null);
  const faceInputRef = useRef<HTMLInputElement>(null);
  const outfitInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            setState((p:any)=>({
                ...p, 
                ...parsed, 
                videoFile: null, 
                videoPreviewUrl: null, 
                faceFile: null, 
                facePreviewUrl: null,
                outfitFile: null,
                isRegeneratingPart: {},
                segments: (parsed.segments || []).map((seg: any) => ({
                    ...seg,
                    pose: seg.pose || '',
                    image: seg.image || { url: '', loading: false, regenNote: '' },
                    videoPrompt: seg.videoPrompt || { text: '', loading: false, visible: false }
                }))
            }));
          }
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    try {
      const { videoFile, videoPreviewUrl, faceFile, facePreviewUrl, outfitFile, segments, isAnalyzing, isGeneratingScript, isExtractingOutfit, isRegeneratingPart, ...persistent } = state;
      const safeSegments = (segments || []).map((seg: any) => ({
        ...seg,
        image: { ...(seg.image || {}), url: '' }
      }));
      localStorage.setItem(storageKey, JSON.stringify({ ...persistent, segments: safeSegments }));
    } catch (e) {}
  }, [state]);

  useEffect(() => {
    const handleExport = () => {
      const exportData = state.segments.map((seg: any, index: number) => ({
        stt: index + 1,
        inputs: {
          originalAnalysis: state.analysis,
          characterDescription: state.characterDescription,
          contextNote: state.contextNote,
          outfitImage: state.outfitPreviewUrl || '',
          settings: {
            style: state.style,
            gender: state.gender,
            voice: state.voice,
            addressing: state.addressing,
            imageStyle: state.imageStyle,
            pose: seg.pose || ''
          }
        },
        script: seg.content,
        outputImage: seg.image?.url || '',
        videoPrompt: seg.videoPrompt?.text || ''
      }));
      window.dispatchEvent(new CustomEvent('EXPORT_DATA_READY', { detail: { data: exportData, moduleName: 'Video_POV' } }));
    };

    const handleImport = async (e: any) => {
      const importedData = e.detail;
      if (!Array.isArray(importedData)) return;
      
      const firstItem = importedData[0];
      const inputs = firstItem.inputs || {};
      const settings = inputs.settings || {};

      const newState = { 
        ...state, 
        analysis: inputs.originalAnalysis || state.analysis,
        characterDescription: inputs.characterDescription || state.characterDescription,
        contextNote: inputs.contextNote || state.contextNote,
        style: settings.style || state.style,
        gender: settings.gender || state.gender,
        voice: settings.voice || state.voice,
        addressing: settings.addressing || state.addressing,
        imageStyle: settings.imageStyle || state.imageStyle,
        segments: [] 
      };

      const total = importedData.length;
      for (let i = 0; i < total; i++) {
        const item = importedData[i];
        const itemInputs = item.inputs || {};
        const itemSettings = itemInputs.settings || {};

        newState.segments.push({
          id: i + 1,
          content: item.script || '',
          pose: itemSettings.pose || '',
          image: { url: item.outputImage || '', loading: false, regenNote: '' },
          videoPrompt: { text: item.videoPrompt || '', loading: false, visible: true }
        });
        const percent = Math.round(((i + 1) / total) * 100);
        window.dispatchEvent(new CustomEvent('IMPORT_DATA_PROGRESS', { detail: { percent, complete: i === total - 1 } }));
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

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setState((p:any)=>({...p, videoFile: file, videoPreviewUrl: URL.createObjectURL(file), originalScriptInput: ''}));
    }
  };

  const handleFaceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setState((p:any)=>({...p, faceFile: file, facePreviewUrl: URL.createObjectURL(file)}));
    }
  };

  const handleOutfitUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setState((p:any)=>({...p, outfitFile: file, outfitPreviewUrl: URL.createObjectURL(file)}));
    }
  };

  const handleRemoveOutfit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setState((p:any)=>({...p, outfitFile: null, outfitPreviewUrl: null}));
  };

  const handleExtractOutfit = async () => {
    let part = null;
    if (state.outfitFile) part = await service.fileToGenerativePart(state.outfitFile);
    else if (state.outfitPreviewUrl?.startsWith('data:')) part = { mimeType: 'image/png', data: state.outfitPreviewUrl.split(',')[1] };
    if (!part) return;
    setState((p:any) => ({ ...p, isExtractingOutfit: true }));
    try {
      const desc = await service.describePovOutfit(part);
      setState((p:any) => ({ ...p, characterDescription: desc, isExtractingOutfit: false }));
    } catch (e) { setState((p:any) => ({ ...p, isExtractingOutfit: false })); }
  };

  const handleAnalyze = async () => {
    if (!state.videoFile && !state.originalScriptInput.trim()) return;
    setState((p:any)=>({...p, isAnalyzing: true}));
    try {
        let res = state.videoFile ? await service.analyzeVideoContent(state.videoFile) : await service.analyzeTextContent(state.originalScriptInput);
        setState((p:any)=>({...p, analysis: res, isAnalyzing: false}));
    } catch(e) { setState((p:any)=>({...p, isAnalyzing: false})); }
  };

  const handleGenScript = async () => {
      if (!state.analysis) return;
      setState((p:any)=>({...p, isGeneratingScript: true}));
      try {
          const scripts = await service.generatePovSegments(state.analysis, state.style, state.segmentCount, state.gender, state.voice, state.addressing, state.characterDescription, state.contextNote);
          const newSegments: any[] = scripts.map((content: string, i: number) => ({
              id: i + 1,
              content: content,
              pose: '',
              image: { url: '', loading: false, regenNote: '' },
              videoPrompt: { text: '', loading: false, visible: false }
          }));
          setState((p:any)=>({...p, segments: newSegments, isGeneratingScript: false}));
      } catch(e) { setState((p:any)=>({...p, isGeneratingScript: false})); }
  };

  const handleRegenSegmentScript = async (id: number) => {
    const seg = state.segments.find((s:any)=>s.id === id);
    if (!seg || !state.analysis) return;
    setState((p:any)=>({...p, isRegeneratingPart: { ...p.isRegeneratingPart, [id]: true }}));
    try {
      const allText = state.segments.map((s:any)=>s.content);
      const newText = await service.regeneratePovSegment(state.analysis, state.style, state.gender, state.voice, state.addressing, state.characterDescription, state.contextNote, seg.content, allText);
      setState((p:any)=>({
        ...p,
        isRegeneratingPart: { ...p.isRegeneratingPart, [id]: false },
        segments: p.segments.map((s:any)=>s.id === id ? { ...s, content: newText } : s)
      }));
    } catch(e) { setState((p:any)=>({...p, isRegeneratingPart: { ...p.isRegeneratingPart, [id]: false }})); }
  };

  const handleGenImage = async (id: number) => {
      const seg = state.segments.find((s:any)=>s.id === id);
      if (!seg) return;
      setState((p:any)=>({...p, segments: p.segments.map((s:any)=>s.id===id?{...s, image:{...s.image, loading:true}}:s)}));
      try {
          const facePart = state.faceFile ? await service.fileToGenerativePart(state.faceFile) : null;
          const outfitPart = state.outfitFile ? await service.fileToGenerativePart(state.outfitFile) : null;
          
          const poseLabel = POV_POSES.find(opt => opt.value === seg.pose)?.label || "";

          const url = await service.generatePovImage(seg.content, facePart, state.gender, state.characterDescription, seg.image.regenNote, state.imageStyle, state.contextNote, outfitPart, poseLabel);
          setState((p:any)=>({...p, segments: p.segments.map((s:any)=>s.id===id?{...s, image:{...s.image, url, loading:false}}:s)}));
      } catch(e) { setState((p:any)=>({...p, segments: p.segments.map((s:any)=>s.id===id?{...s, image:{...s.image, loading:false}}:s)})); }
  };

  const handleGenPrompt = async (id: number) => {
      const seg = state.segments.find((s:any)=>s.id === id);
      if (!seg) return;
      setState((p:any)=>({...p, segments: p.segments.map((s:any)=>s.id===id?{...s, videoPrompt:{...s.videoPrompt, loading:true, visible:true}}:s)}));
      try {
          const poseLabel = POV_POSES.find(opt => opt.value === seg.pose)?.label || "";
          const prompt = await service.formatVideoPrompt(seg.content, state.gender, state.voice, state.characterDescription, state.contextNote, state.imageStyle, seg.image?.url, poseLabel);
          setState((p:any)=>({...p, segments: p.segments.map((s:any)=>s.id===id?{...s, videoPrompt:{text: prompt, loading:false, visible:true}}:s)}));
      } catch(e) { setState((p:any)=>({...p, segments: p.segments.map((s:any)=>s.id===id?{...s, videoPrompt:{...s.videoPrompt, loading:false}}:s)})); }
  };

  const handleBulkImage = async () => {
    for (const seg of state.segments) { await handleGenImage(seg.id); }
  };

  const handleBulkPrompt = async () => {
      for (const seg of state.segments) { await handleGenPrompt(seg.id); }
  };

  const downloadAllImagesZip = async () => {
    if (typeof JSZip === 'undefined') return alert("Đang tải...");
    const zip = new JSZip();
    let count = 0;
    state.segments.forEach((seg: any, i: number) => {
      if (seg.image?.url) { zip.file(`${String(i + 1).padStart(2, '0')}.png`, seg.image.url.split(',')[1], { base64: true }); count++; }
    });
    if (count === 0) return alert("Không có ảnh.");
    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement('a'); link.href = URL.createObjectURL(content); link.download = `pov_images_${Date.now()}.zip`; link.click();
  };

  const downloadAllPromptsTxt = () => {
    const text = state.segments.map((s: any) => s.videoPrompt?.text || "").filter((t: string) => t).join('\n');
    if (!text) return alert("Vui lòng tạo Video Prompt.");
    const blob = new Blob([text], { type: 'text/plain' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `prompts_pov_${Date.now()}.txt`; link.click();
  };

  const hasAnyMedia = state.segments.some((seg: any) => seg.image?.url || seg.videoPrompt?.text);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-[24px] p-8 border border-slate-200 shadow-sm mb-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-6">
                <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">1a. Video gốc (Nguồn phân tích):</label>
                    <div onClick={() => videoInputRef.current?.click()} className="aspect-video border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center bg-slate-50 cursor-pointer overflow-hidden hover:border-orange-400 transition-all">
                        {state.videoPreviewUrl ? <video src={state.videoPreviewUrl} className="h-full w-full object-cover" autoPlay muted loop /> : <div className="text-center opacity-30"><svg className="w-10 h-10 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg><span>Tải Video</span></div>}
                    </div>
                    <input type="file" ref={videoInputRef} onChange={handleVideoUpload} className="hidden" accept="video/*" />
                </div>
                <div className="relative flex items-center py-2"><div className="flex-grow border-t border-slate-100"></div><span className="flex-shrink mx-4 text-[10px] font-bold text-slate-300 uppercase tracking-widest">- HOẶC -</span><div className="flex-grow border-t border-slate-100"></div></div>
                <div><label className="block text-[10px] font-black text-slate-500 uppercase mb-2">1b. Nhập kịch bản gốc:</label><textarea value={state.originalScriptInput} onChange={e => setState((p:any)=>({...p, originalScriptInput: e.target.value, videoFile: null, videoPreviewUrl: null}))} placeholder="Paste kịch bản..." className="w-full h-32 p-4 border border-slate-200 rounded-xl text-xs bg-slate-50 outline-none transition-all resize-none font-medium focus:bg-white focus:border-orange-500" /></div>
                <div><label className="block text-[10px] font-black text-slate-500 uppercase mb-2">2. Ảnh khuôn mặt mẫu (Tùy chọn):</label>
                    <div onClick={() => faceInputRef.current?.click()} className="h-28 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center bg-slate-50 cursor-pointer hover:border-orange-400 transition-all overflow-hidden">{state.facePreviewUrl ? <img src={state.facePreviewUrl} className="h-full object-contain" /> : <div className="text-center opacity-30"><svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg><span>Mặt mẫu</span></div>}</div>
                    <input type="file" ref={faceInputRef} onChange={handleFaceUpload} className="hidden" accept="image/*" />
                </div>
            </div>

            <div className="lg:col-span-8 space-y-6">
                <div className="flex justify-between items-end"><label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">3. Phân tích nội dung:</label><button onClick={handleAnalyze} disabled={state.isAnalyzing || (!state.videoFile && !state.originalScriptInput.trim())} className="text-[10px] font-black px-4 py-2 bg-orange-50 text-orange-600 rounded-lg border border-orange-100 hover:bg-orange-100 disabled:opacity-50 transition-all uppercase"> {state.isAnalyzing ? "Đang phân tích..." : "Phân tích"} </button></div>
                <textarea value={state.analysis} onChange={e => setState((p:any)=>({...p, analysis: e.target.value}))} className="w-full h-24 border border-slate-200 rounded-xl p-4 bg-slate-50 text-xs font-medium focus:bg-white outline-none transition-all resize-none" placeholder="Kết quả phân tích..." />

                <div className="grid grid-cols-2 md:grid-cols-12 gap-4">
                    <div className="md:col-span-3 space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase">Phong cách</label><select value={state.style} onChange={e => setState((p:any)=>({...p, style: e.target.value}))} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-xs font-bold outline-none">{STYLES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select></div>
                    <div className="md:col-span-2 space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase">Giới tính</label><select value={state.gender} onChange={e => setState((p:any)=>({...p, gender: e.target.value}))} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-xs font-bold outline-none"><option value="Nữ">Nữ</option><option value="Nam">Nam</option></select></div>
                    <div className="md:col-span-4 space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase">Vùng miền</label><select value={state.voice} onChange={e => setState((p:any)=>({...p, voice: e.target.value}))} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-xs font-bold outline-none">{VOICE_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}</select></div>
                    <div className="md:col-span-3 space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase">Cảnh (Scenes)</label><select value={state.segmentCount} onChange={e => setState((p:any)=>({...p, segmentCount: parseInt(e.target.value)}))} className="w-full p-3 border border-slate-200 rounded-xl bg-white font-bold text-orange-600">{SCENE_COUNT_OPTIONS.map(opt => <option key={opt.count} value={opt.count}>{opt.label}</option>)}</select></div>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-500 uppercase px-1">Cách xưng hô (Người nói - Người nghe)</label>
                          <div className="relative">
                            <input 
                              list="pov-addressing-list"
                              value={state.addressing} 
                              onChange={e => setState((p:any)=>({...p, addressing: e.target.value}))}
                              placeholder="Chọn hoặc tự nhập (VD: em - các bác)"
                              className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-xs font-bold outline-none focus:bg-white"
                            />
                            <datalist id="pov-addressing-list">
                              {ADDRESSING_OPTIONS.map(opt => <option key={opt} value={opt} />)}
                            </datalist>
                          </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase px-1">Phong cách ảnh</label>
                            <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200 h-[46px]">
                              <button onClick={() => setState((p:any)=>({...p, imageStyle: 'Realistic'}))} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${state.imageStyle === 'Realistic' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Chân thực</button>
                              <button onClick={() => setState((p:any)=>({...p, imageStyle: '3D'}))} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${state.imageStyle === '3D' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>3D</button>
                            </div>
                        </div>
                    </div>

                    <label className="block text-[10px] font-black text-slate-500 uppercase">4. Nhân vật & Trang phục:</label>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        <div className="md:col-span-3 space-y-2">
                            <div onClick={() => outfitInputRef.current?.click()} className="aspect-[3/4] border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center bg-slate-50 cursor-pointer hover:border-orange-400 transition-all overflow-hidden relative group">
                                {state.outfitPreviewUrl ? <><img src={state.outfitPreviewUrl} className="w-full h-full object-cover" /><button onClick={handleRemoveOutfit} className="absolute top-2 right-2 bg-black/60 text-white w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors z-10"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg></button></> : <div className="text-center opacity-30"><svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" /></svg><span className="text-[8px] font-black">Trang phục</span></div>}
                                <input type="file" ref={outfitInputRef} onChange={handleOutfitUpload} className="hidden" accept="image/*" />
                            </div>
                            {(state.outfitFile || state.outfitPreviewUrl?.startsWith('data:')) && <button onClick={handleExtractOutfit} disabled={state.isExtractingOutfit} className="w-full py-2 bg-red-600 text-white text-[9px] font-black rounded-lg hover:bg-red-700 uppercase disabled:opacity-50 tracking-tighter">{state.isExtractingOutfit ? "Đang tách..." : "Tách trang phục"}</button>}
                        </div>
                        <div className="md:col-span-9 space-y-4">
                            <textarea value={state.characterDescription} onChange={e => setState((p:any)=>({...p, characterDescription: e.target.value}))} placeholder="Tuổi tác, ngoại hình..." className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-orange-500 outline-none transition-all resize-none" />
                            <textarea value={state.contextNote} onChange={e => setState((p:any)=>({...p, contextNote: e.target.value}))} placeholder="Bối cảnh, không gian..." className="w-full h-20 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-orange-500 outline-none transition-all resize-none" />
                        </div>
                    </div>
                </div>

                <button onClick={handleGenScript} disabled={state.isGeneratingScript || !state.analysis} className="w-full py-5 bg-orange-600 text-white font-black rounded-xl shadow-lg hover:bg-orange-700 transition-all flex items-center justify-center gap-3 uppercase text-sm tracking-widest disabled:opacity-50"> {state.isGeneratingScript ? "Đang xử lý..." : "Tạo phiên bản POV"} </button>
            </div>
        </div>

        {(state.segments && state.segments.length > 0) && (
            <div className="space-y-10 pb-32">
                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm flex justify-between items-center"><h3 className="text-sm font-black text-white uppercase tracking-tight">KẾT QUẢ POV ({state.segments.length} cảnh)</h3><span className="text-[10px] font-bold text-orange-500 uppercase">Style: {state.imageStyle} • Giọng: {state.voice}</span></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                    {state.segments.map((seg: any) => {
                        const charCount = seg.content?.length || 0;
                        const isRegenScript = state.isRegeneratingPart[seg.id];
                        return (
                            <div key={seg.id} className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full hover:shadow-xl transition-all group">
                                <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center"><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cảnh {seg.id}</span>{seg.image?.loading && <div className="w-3 h-3 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>}</div>
                                <div className="relative aspect-[9/16] bg-slate-100 group-hover:brightness-105 transition-all">
                                    {seg.image?.url ? <img src={seg.image.url} className="w-full h-full object-cover" /> : <div className="absolute inset-0 flex items-center justify-center opacity-30 font-black uppercase text-[10px] tracking-widest">Sẵn sàng</div>}
                                </div>
                                <div className="p-5 flex flex-col flex-1 gap-4">
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center mb-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Kịch bản POV:</label><span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${charCount > 190 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'}`}>{charCount} / 190</span></div>
                                        <textarea value={seg.content} onChange={e => setState((p:any)=>({...p, segments: p.segments.map((s:any)=>s.id===seg.id?{...s, content: e.target.value}:s)}))} className="w-full h-40 p-3 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-100 rounded-xl outline-none resize-none leading-relaxed focus:bg-white focus:border-orange-500 transition-all" />
                                        <button onClick={() => handleRegenSegmentScript(seg.id)} disabled={isRegenScript} className="w-full py-1.5 bg-orange-50 text-orange-600 text-[8px] font-black rounded-lg border border-orange-100 hover:bg-orange-100 transition-all uppercase tracking-tighter disabled:opacity-50">{isRegenScript ? "Đang viết..." : "Tạo lại lời thoại"}</button>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase block px-1">Tư thế nhân vật:</label>
                                        <select 
                                          value={seg.pose || ""} 
                                          onChange={e => setState((p:any)=>({...p, segments: p.segments.map((s:any)=>s.id===seg.id?{...s, pose: e.target.value}:s)}))}
                                          className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[9px] font-bold outline-none focus:border-orange-500 transition-all"
                                        >
                                          {POV_POSES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase">Ghi chú sửa ảnh:</label><textarea value={seg.image?.regenNote || ''} onChange={e => setState((p:any)=>({...p, segments: p.segments.map((s:any)=>s.id===seg.id?{...s, image:{...s.image, regenNote: e.target.value}}:s)}))} placeholder="Góc quay, ánh sáng..." className="w-full h-12 p-3 text-[9px] border border-dashed border-slate-200 rounded-xl outline-none resize-none focus:bg-white" /></div>
                                    <div className="mt-auto flex gap-2">
                                        <button onClick={() => handleGenImage(seg.id)} disabled={seg.image?.loading} className="flex-1 py-3 bg-slate-900 text-white text-[9px] font-black rounded-xl hover:bg-black transition-all uppercase tracking-tighter">{(seg.image && seg.image.url) ? "Tạo lại" : "Tạo Ảnh"}</button>
                                        <button onClick={() => handleGenPrompt(seg.id)} disabled={seg.videoPrompt?.loading} className="flex-1 py-3 bg-red-50 text-red-700 text-[9px] font-black rounded-xl border border-red-100 hover:bg-red-100 transition-all uppercase tracking-tighter">Prompt</button>
                                    </div>
                                </div>
                                {(seg.videoPrompt && seg.videoPrompt.visible) && (
                                    <div className="p-4 bg-slate-900 border-t border-slate-800 animate-slideUp">
                                        <div className="flex justify-between items-center mb-2"><span className="text-[8px] text-orange-500 font-bold uppercase tracking-widest">VEO-3 Prompt</span><button onClick={() => navigator.clipboard.writeText(seg.videoPrompt.text)} className="text-[8px] text-white font-black underline uppercase">Copy</button></div>
                                        <div className="text-[9px] text-slate-300 line-clamp-3 italic opacity-80 leading-snug">"{seg.videoPrompt.text}"</div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                <div className="flex flex-col items-center gap-12 py-12">
                    <div className="flex flex-col md:flex-row gap-4 w-full justify-center px-4">
                        <button onClick={handleBulkImage} className="w-full md:w-auto px-12 py-5 bg-orange-600 text-white font-black rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all text-lg flex items-center justify-center gap-4 uppercase tracking-widest">
                            TỰ ĐỘNG TẠO TẤT CẢ ẢNH
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>
                        </button>
                        <button onClick={handleBulkPrompt} className="w-full md:w-auto px-12 py-5 bg-slate-900 text-white font-black rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all text-lg flex items-center justify-center gap-4 uppercase tracking-widest">
                            TỰ ĐỘNG VIẾT TẤT CẢ PROMPTS
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14H11V21L20 10H13Z" /></svg>
                        </button>
                    </div>
                    {hasAnyMedia && (
                        <div className="flex flex-col md:flex-row items-center justify-center gap-4 border-t border-slate-200 w-full pt-12">
                            <button onClick={downloadAllImagesZip} className="w-full md:w-auto px-12 py-5 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-base"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>Tải ZIP ảnh</button>
                            <button onClick={downloadAllPromptsTxt} className="w-full md:w-auto px-12 py-5 bg-orange-600 text-white font-black rounded-2xl shadow-xl hover:bg-orange-700 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-base"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1.01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>Tải TXT Prompt</button>
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};

export default VideoPovModule;
