
import React from 'react';
import { CarouselItem } from '../types';

interface CarouselCardProps {
  item: CarouselItem;
  onTextChange: (id: number, text: string) => void;
  onGenerate: (id: number) => void;
  onRegenerate: (id: number) => void;
  onGeneratePrompt: (id: number) => void;
  onNoteChange: (id: number, text: string) => void;
  onPositionChange: (id: number, pos: 'Top' | 'Bottom' | 'Split') => void;
  onColorChange: (id: number, color: string) => void;
  onFontSizeChange: (id: number, size: number) => void;
}

const CarouselCard: React.FC<CarouselCardProps> = ({ 
  item, 
  onTextChange, 
  onGenerate, 
  onRegenerate,
  onGeneratePrompt,
  onNoteChange,
  onPositionChange,
  onColorChange,
  onFontSizeChange
}) => {
  const positions: ('Top' | 'Bottom' | 'Split')[] = ['Top', 'Bottom', 'Split'];

  return (
    <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full group transition-all hover:shadow-md">
      {/* Header */}
      <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
         <span className="font-black text-[11px] text-slate-500 uppercase tracking-tighter">Slide #{item.id}</span>
         {(item.loading || item.videoPrompt?.loading) && (
           <div className="flex items-center gap-1.5">
             <div className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce"></div>
             <span className="text-[10px] text-pink-600 font-black animate-pulse uppercase">Đang xử lý...</span>
           </div>
         )}
      </div>

      <div className="p-5 flex flex-col gap-5 flex-1">
         {/* Text Content Input */}
         <div className="space-y-1.5">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nội dung chữ trên ảnh</label>
              <span className="text-[10px] text-slate-300 font-bold">100% Chính tả VN</span>
            </div>
            <textarea
               className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:ring-4 focus:ring-orange-50 focus:border-orange-400 outline-none resize-none transition-all leading-relaxed"
               rows={4}
               value={item.content}
               onChange={(e) => onTextChange(item.id, e.target.value)}
               placeholder="Nhập nội dung slide..."
            />
         </div>

         {/* Image Area */}
         <div className="relative aspect-[3/4] bg-slate-100 rounded-[24px] overflow-hidden border border-slate-100 group">
            {item.imageUrl ? (
               <img src={item.imageUrl} alt={`Slide ${item.id}`} className="w-full h-full object-cover" />
            ) : (
               <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-slate-300">
                  {item.loading ? (
                     <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                     <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm">
                           <svg className="w-7 h-7 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Ready to Gen</span>
                     </div>
                  )}
               </div>
            )}
            
            <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm text-white text-[9px] font-black px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-tighter">
              1200x1600 (3:4)
            </div>
         </div>

         {/* Per-Slide Config: Position, Color, and Font Size */}
         <div className="space-y-4">
            <div className="space-y-2 px-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Vị trí chữ (Position)</label>
              <div className="grid grid-cols-3 gap-2">
                {positions.map((pos) => (
                  <button
                    key={pos}
                    onClick={() => onPositionChange(item.id, pos)}
                    className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all border-2 ${
                      item.textPosition === pos 
                        ? 'border-orange-500 bg-orange-50 text-orange-600' 
                        : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 px-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Màu sắc</label>
                  <div className="w-3 h-3 rounded-full border border-slate-200" style={{ backgroundColor: item.textColor }}></div>
                </div>
                <div className="relative h-10 w-full rounded-xl overflow-hidden border-2 border-slate-100 hover:border-slate-200 transition-all">
                  <input 
                    type="color" 
                    value={item.textColor}
                    onChange={(e) => onColorChange(item.id, e.target.value)}
                    className="absolute inset-0 w-full h-full p-0 border-none cursor-pointer scale-[2]"
                  />
                </div>
              </div>

              <div className="space-y-2 px-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Kích cỡ chữ</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    value={item.fontSize}
                    min={20}
                    max={200}
                    onChange={(e) => onFontSizeChange(item.id, parseInt(e.target.value) || 60)}
                    className="w-full h-10 px-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-xs font-bold text-slate-700 focus:border-orange-400 outline-none transition-all"
                  />
                  <span className="text-[10px] font-bold text-slate-300">px</span>
                </div>
              </div>
            </div>
         </div>

         {/* Actions */}
         <div className="mt-auto pt-2 flex flex-col gap-2">
            {!item.imageUrl ? (
               <button
                  onClick={() => onGenerate(item.id)}
                  disabled={item.loading || !item.content.trim()}
                  className={`w-full py-4 rounded-2xl text-xs font-black transition-all uppercase tracking-widest shadow-xl ${
                     item.loading || !item.content.trim()
                     ? 'bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-100 shadow-none'
                     : 'bg-slate-100 text-slate-400 hover:bg-slate-900 hover:text-white border border-slate-200'
                  }`}
               >
                  TẠO ẢNH SLIDE
               </button>
            ) : (
               <div className="space-y-3">
                  <div className="space-y-1.5 px-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ghi chú sửa lại ảnh</label>
                    <textarea
                       value={item.regenerateNote}
                       onChange={(e) => onNoteChange(item.id, e.target.value)}
                       placeholder="Sửa lỗi, đổi góc..."
                       className="w-full px-4 py-3 text-[11px] border border-slate-200 rounded-xl focus:ring-4 focus:ring-orange-50 outline-none resize-none font-bold"
                       rows={2}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                       onClick={() => onRegenerate(item.id)}
                       disabled={item.loading}
                       className="flex-1 py-3 bg-slate-900 text-white hover:bg-black font-black rounded-xl text-[10px] transition-all uppercase tracking-widest shadow-lg active:scale-95"
                    >
                       Tạo lại
                    </button>
                    <button
                       onClick={() => onGeneratePrompt(item.id)}
                       disabled={item.videoPrompt?.loading}
                       className="flex-1 py-3 bg-orange-600 text-white hover:bg-orange-700 font-black rounded-xl text-[10px] transition-all uppercase tracking-widest shadow-lg active:scale-95"
                    >
                       VEO Prompt
                    </button>
                  </div>
               </div>
            )}
         </div>

         {item.videoPrompt?.visible && (
            <div className="bg-slate-900 p-4 rounded-2xl animate-slideUp">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[8px] font-black text-orange-500 uppercase tracking-widest">Video Prompt</span>
                    <button 
                        onClick={() => navigator.clipboard.writeText(item.videoPrompt?.text || "")}
                        className="text-[8px] font-black text-white underline uppercase"
                    >
                        Copy
                    </button>
                </div>
                <p className="text-[9px] text-slate-300 italic line-clamp-3 leading-snug">
                    "{item.videoPrompt?.text}"
                </p>
            </div>
         )}
         
         {item.error && <p className="text-[10px] text-red-500 font-black text-center bg-red-50 py-2 rounded-xl border border-red-100 px-3">{item.error}</p>}
      </div>
    </div>
  );
};

export default CarouselCard;
