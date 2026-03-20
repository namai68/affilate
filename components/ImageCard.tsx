
import React, { useRef } from 'react';
import { GeneratedImage, VideoPromptState } from '../types';

export const KOC_POSES = [
  { "value": "", "label": "-- Chọn tư thế nhân vật --" },
  { "value": "hold_two_hands_front", "label": "Cầm sản phẩm bằng hai tay trước ngực" },
  { "value": "hold_one_hand_front", "label": "Cầm sản phẩm một tay ngang ngực" },
  { "value": "hold_and_point", "label": "Cầm sản phẩm và chỉ tay vào sản phẩm" },
  { "value": "stand_next_to_product", "label": "Đứng bên cạnh sản phẩm" },
  { "value": "product_on_table", "label": "Sản phẩm đặt trên bàn, nhân vật đứng phía sau" },
  { "value": "offer_to_camera", "label": "Đưa sản phẩm về phía camera" },
  { "value": "explain_with_hand", "label": "Cầm sản phẩm và giải thích bằng tay còn lại" },
  { "value": "inspect_product", "label": "Cúi nhìn, soi kỹ sản phẩm" },
  { "value": "rotate_product", "label": "Xoay sản phẩm để review các góc" },
  { "value": "compare_two_products", "label": "So sánh hai sản phẩm trên hai tay" },
  { "value": "product_near_face", "label": "Đặt sản phẩm gần mặt để so kích thước" },
  { "value": "using_product", "label": "Đang sử dụng sản phẩm thực tế" },
  { "value": "setup_product", "label": "Đang setup / lắp đặt sản phẩm" },
  { "value": "desk_usage", "label": "Sử dụng sản phẩm trên bàn làm việc" },
  { "value": "pov_thinking", "label": "Nhìn sản phẩm với vẻ suy tư (POV)" },
  { "value": "product_aside_story", "label": "Sản phẩm đặt bên cạnh – kể chuyện đời sống" },
  { "value": "realization_face", "label": "Nhìn sản phẩm với vẻ tỉnh ngộ / bất ngờ" },
  { "value": "cta_raise_product", "label": "Giơ sản phẩm lên cao (CTA)" },
  { "value": "cta_point_camera", "label": "Chỉ vào sản phẩm và nhìn thẳng camera" },
  { "value": "cta_thumb_up", "label": "Cầm sản phẩm và giơ ngón cái" },
  { "value": "cta_close_camera", "label": "Đưa sản phẩm sát camera (cận cảnh)" }
];

export const NONFACE_POSES = [
  { "value": "", "label": "-- Cách sản phẩm xuất hiện --" },
  { "value": "using_product", "label": "Đang sử dụng sản phẩm thực tế" },
  { "value": "on_table", "label": "Sản phẩm đặt trên bàn" },
  { "value": "hanging", "label": "Sản phẩm treo trên giá/kệ" },
  { "value": "holding_2_hands", "label": "Cầm sản phẩm 2 tay" },
  { "value": "holding_1_hand_pointing", "label": "Cầm sản phẩm 1 tay 1 tay chỉ vào sản phẩm" },
  { "value": "setting_up", "label": "Đang setup lắp đặt sản phẩm" },
  { "value": "raising_high", "label": "Giơ sản phẩm lên cao" }
];

export const CAMERA_ANGLES = [
  { value: "", label: "-- GÓC CHỤP SẢN PHẨM --" },
  { value: "front view", label: "CHÍNH DIỆN (0°)" },
  { value: "front-right quarter view", label: "NGHIÊNG 45° (FRONT-RIGHT)" },
  { value: "right side view", label: "GÓC NGANG 90° (RIGHT SIDE)" },
  { value: "left side view", label: "GÓC NGANG 270° (LEFT SIDE)" },
  { value: "front-left quarter view", label: "NGHIÊNG 315° (FRONT-LEFT)" }
];

export const CAMERA_SHOTS = [
  { value: "", label: "-- GÓC QUAY (SHOT TYPE) --" },
  { value: "Wide Angle Shot", label: "1. Góc quay đại cảnh (Wide Angle)" },
  { value: "Medium Shot", label: "2. Góc quay trung cảnh (Medium Shot)" },
  { value: "Close-up Shot", label: "3. Góc quay cận cảnh (Close-up)" }
];

interface ImageCardProps {
  label: string;
  imageData: GeneratedImage;
  videoPrompt: VideoPromptState;
  onGeneratePrompt: () => void;
  onRegenerate: () => void;
  onTranslate: () => void;
  onUpload?: (file: File) => void;
  onDelete?: () => void;
  customPrompt: string;
  onCustomPromptChange: (text: string) => void;
  onPoseChange?: (pose: string) => void;
  pose?: string;
  onAngleChange?: (angle: string) => void;
  angle?: string;
  onShotChange?: (shot: string) => void;
  shot?: string;
  onSpeakerChange?: (speaker: string) => void;
  speaker?: string;
  speakerOptions?: { value: string, label: string }[];
  poseOptions?: { value: string, label: string }[];
}

const ImageCard: React.FC<ImageCardProps> = ({ 
  label, 
  imageData, 
  videoPrompt, 
  onGeneratePrompt, 
  onRegenerate, 
  onTranslate,
  onUpload,
  onDelete,
  customPrompt,
  onCustomPromptChange,
  onPoseChange,
  pose,
  onAngleChange,
  angle,
  onShotChange,
  shot,
  onSpeakerChange,
  speaker,
  speakerOptions,
  poseOptions = KOC_POSES
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onUpload) {
      onUpload(e.target.files[0]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col bg-white rounded-[2rem] shadow-sm border border-orange-100 overflow-hidden relative group/card hover:shadow-xl transition-all">
      {/* Header */}
      <div className="px-5 py-3 bg-orange-50 border-b border-orange-100 flex justify-between items-center">
        <span className="font-black text-[11px] text-orange-700 uppercase tracking-widest">{label} VISUAL</span>
        {imageData.loading && <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>}
      </div>

      {/* Image Display Area */}
      <div className="aspect-[9/16] relative bg-slate-50 w-full overflow-hidden">
        {imageData.url ? (
          <>
            <img 
              src={imageData.url} 
              alt={`${label} generated`} 
              className="w-full h-full object-cover animate-fadeIn"
            />
            {onDelete && (
              <button 
                onClick={onDelete}
                className="absolute top-4 right-4 w-9 h-9 bg-red-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-red-700 transition-all z-10 opacity-0 group-hover/card:opacity-100"
                title="Xóa hình ảnh"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            {imageData.loading ? (
              <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin shadow-lg"></div>
                  <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest animate-pulse">AI Đang Vẽ...</span>
              </div>
            ) : imageData.error ? (
              <div className="flex flex-col items-center gap-2">
                 <span className="text-red-500 text-[10px] font-black uppercase">{imageData.error}</span>
                 <button onClick={onRegenerate} className="px-6 py-2 bg-orange-600 text-white rounded-xl text-xs font-black uppercase shadow-lg">Thử lại</button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <span className="text-orange-300 text-[9px] uppercase font-black tracking-[0.2em] px-4">Ready for generation</span>
                
                <button 
                    onClick={onRegenerate} 
                    className="w-48 py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:shadow-orange-200 text-white rounded-2xl text-[10px] font-black shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" clipRule="evenodd" /></svg>
                    TẠO ẢNH AI
                </button>

                <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="w-48 py-3 bg-white border border-orange-100 hover:bg-orange-50 text-orange-500 rounded-2xl text-[10px] font-black shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    TẢI ẢNH LÊN
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Select Pose, Angle, Shot & Custom Prompt Input */}
      <div className="px-4 py-3 bg-orange-50/50 border-t border-orange-100 space-y-3 shadow-inner">
        {onPoseChange && (
          <div className="relative">
            <select 
                value={pose || ""} 
                onChange={(e) => onPoseChange(e.target.value)}
                className="w-full text-[10px] font-black p-3 rounded-xl border border-orange-200 focus:border-orange-500 outline-none bg-white text-orange-700 uppercase shadow-sm appearance-none"
            >
                {poseOptions.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
                ))}
            </select>
            <div className="absolute right-3 top-3.5 pointer-events-none text-orange-400"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="3" /></svg></div>
          </div>
        )}

        {onAngleChange && (
           <div className="relative">
            <select 
                value={angle || ""} 
                onChange={(e) => onAngleChange(e.target.value)}
                className={`w-full text-[10px] font-black p-3 rounded-xl border outline-none transition-all shadow-sm uppercase appearance-none ${
                angle 
                ? 'bg-orange-600 text-white border-orange-700' 
                : 'bg-white text-orange-400 border-orange-200'
                }`}
            >
                {CAMERA_ANGLES.map(opt => (
                <option 
                    key={opt.value} 
                    value={opt.value} 
                    className="bg-white text-slate-700 font-bold"
                >
                    {opt.label}
                </option>
                ))}
            </select>
             <div className={`absolute right-3 top-3.5 pointer-events-none ${angle ? 'text-orange-200' : 'text-orange-400'}`}><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="3" /></svg></div>
          </div>
        )}

        <textarea
          value={customPrompt || ''}
          onChange={(e) => onCustomPromptChange(e.target.value)}
          placeholder="Mô tả bối cảnh hoặc ghi chú chỉnh sửa ảnh..."
          className="w-full text-[10px] p-3 rounded-xl border border-orange-200 focus:border-orange-500 outline-none resize-none bg-white placeholder:text-orange-200 font-bold shadow-inner"
          rows={2}
        />
      </div>

      {/* Action Footer */}
      <div className="p-4 border-t border-orange-100 bg-white flex gap-2">
        <button
          onClick={onRegenerate}
          disabled={imageData.loading}
          className={`flex-1 py-3 px-2 rounded-xl text-[10px] font-black transition-all border border-orange-200 text-orange-600 hover:bg-orange-50 uppercase tracking-widest ${
            imageData.loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {imageData.url ? "VẼ LẠI AI" : "TẠO ẢNH"}
        </button>
        
        <button
          onClick={onGeneratePrompt}
          disabled={!imageData.url || videoPrompt.loading || imageData.loading}
          className={`flex-1 py-3 px-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${
            !imageData.url || imageData.loading
              ? 'bg-slate-100 text-slate-300 cursor-not-allowed border border-slate-200'
              : videoPrompt.loading
                ? 'bg-orange-100 text-orange-700 cursor-wait'
                : 'bg-gradient-to-r from-orange-600 to-red-600 hover:shadow-orange-200 text-white shadow-lg'
          }`}
        >
          {videoPrompt.loading ? 'Writing...' : 'Video Prompt'}
        </button>
      </div>

      {/* Video Prompt Result Overlay */}
      {videoPrompt.visible && (
        <div className="p-4 bg-orange-950 border-t border-orange-900 animate-slideUp">
           <div className="flex justify-between items-center mb-3">
             <h4 className="text-orange-400 text-[9px] uppercase font-black tracking-[0.2em] flex items-center gap-2">
                <div className="w-1 h-1 bg-orange-400 rounded-full animate-pulse"></div>
                VEO-3 Technical Prompt
             </h4>
             <div className="flex gap-3">
               <button 
                 onClick={onTranslate}
                 disabled={videoPrompt.translating}
                 className="text-[9px] font-black text-orange-300 hover:text-white uppercase"
               >
                 {videoPrompt.translating ? '...' : 'Dịch'}
               </button>
               <button 
                 onClick={() => {
                     navigator.clipboard.writeText(videoPrompt.text);
                     alert("Đã Copy Prompt!");
                 }}
                 className="text-[9px] font-black text-white hover:text-orange-400 uppercase underline"
               >
                 Copy
               </button>
             </div>
           </div>
           <textarea 
             readOnly 
             className="w-full h-24 bg-black/40 text-orange-200 text-[10px] p-3 rounded-xl border border-orange-900 focus:outline-none resize-none font-mono leading-relaxed shadow-inner"
             value={videoPrompt.text}
           />
        </div>
      )}
    </div>
  );
};

export default ImageCard;
