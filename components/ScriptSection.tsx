
import React from 'react';

interface ScriptSectionProps {
  title: string;
  content: string;
  color: string;
  onChange: (newText: string) => void;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  minChars?: number;
  maxChars?: number;
}

const ScriptSection: React.FC<ScriptSectionProps> = ({ 
  title, 
  content, 
  color, 
  onChange, 
  onRegenerate,
  isRegenerating,
  minChars = 160,
  maxChars = 190
}) => {
  const charCount = content ? content.length : 0;
  
  const isValid = charCount >= minChars && charCount <= maxChars;
  const isTooShort = charCount > 0 && charCount < minChars;
  const isTooLong = charCount > maxChars;

  return (
    <div className={`p-5 rounded-[1.5rem] border-l-8 ${color.includes('orange') || color.includes('indigo') ? 'border-orange-600' : color.includes('purple') || color.includes('blue') ? 'border-red-600' : 'border-orange-600'} bg-white shadow-sm mb-4 group transition-all ${isValid ? 'ring-2 ring-orange-50 bg-orange-50/10' : ''}`}>
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{title}</h3>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
           <svg className="w-3.5 h-3.5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
           <span className="text-[10px] text-orange-300 font-bold italic">Bấm để sửa nội dung</span>
        </div>
      </div>
      
      <div className="relative">
        <textarea
          className={`w-full text-slate-800 text-sm leading-relaxed font-bold shadow-inner resize-y min-h-[160px] focus:outline-none focus:bg-orange-50/30 rounded-xl p-4 bg-slate-50/50 border border-slate-100 hover:border-orange-200 transition-all ${isRegenerating ? 'opacity-30 pointer-events-none' : ''}`}
          value={content || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Đang chờ kịch bản từ AI..."
        />
        {isRegenerating && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50">
            <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      <div className="mt-3 flex justify-between items-center border-t border-orange-50 pt-3">
        {onRegenerate ? (
          <button 
            onClick={onRegenerate}
            disabled={isRegenerating}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${
              isValid 
              ? 'bg-orange-50 text-orange-500 hover:bg-orange-600 hover:text-white border border-orange-100' 
              : 'bg-orange-600 text-white hover:bg-orange-700 animate-pulse'
            } disabled:opacity-50`}
          >
            <svg className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            VIẾT LẠI ĐOẠN NÀY
          </button>
        ) : (
          <div className="text-[10px] font-black text-orange-300 uppercase tracking-tighter italic">
            {isValid ? 'Mục tiêu hoàn tất ✓' : `Yêu cầu: ${minChars}-${maxChars} ký tự`}
          </div>
        )}
        
        <div className="flex items-center gap-2">
            <span className={`text-[10px] px-3 py-1 rounded-full font-black tabular-nums transition-all shadow-sm ${
                isValid 
                ? 'bg-orange-600 text-white' 
                : isTooLong || isTooShort 
                    ? 'bg-red-500 text-white animate-bounce' 
                    : 'bg-slate-100 text-slate-400'
            }`}>
            {charCount} / {maxChars}
            </span>
        </div>
      </div>
    </div>
  );
};

export default ScriptSection;
