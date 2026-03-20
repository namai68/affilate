
import { GoogleGenAI, Type } from "@google/genai";
import { getAiClient } from "./keyService";

export const fileToGenerativePart = async (file: File) => {
  return new Promise<{ mimeType: string, data: string }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve({ mimeType: file.type, data: (reader.result as string).split(',')[1] });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const getVoiceDetailedInstruction = (voiceLabel: string) => {
  const isNorth = voiceLabel.includes("Bắc");
  
  const dialectInstruction = isNorth ? `
    VĂN PHONG MIỀN BẮC (HÀ NỘI):
    - Sử dụng từ đệm: "nhé", "ạ", "thế", "đấy", "vậy", "vâng", "chứ".
    - Cách dùng từ: "không", "vẫn", "thế này".
    - TUYỆT ĐỐI KHÔNG dùng các từ miền Nam như: nha, nè, nghen, thiệt, hông, vầy, bển, trển.
  ` : `
    VĂN PHONG MIỀN NAM (SÀI GÒN):
    - Sử dụng từ đệm: "nha", "nè", "nghen", "hen", "đó", "vầy", "nghen", "ha".
    - Cách dùng từ: "hông" (thay cho không), "thiệt" (thay cho thật), "dễ thương dữ thần", "hết sảy".
    - TUYỆT ĐỐI KHÔNG dùng các từ miền Bắc như: nhé, ạ, thế, đấy, chả, vâng.
  `;

  const mapping: Record<string, string> = {
    "Giọng Bắc 20-40 tuổi": "20-40 tuổi, giọng miền Bắc, năng động, nhịp độ nhanh, vui vẻ, tông cao, hào hứng.",
    "Giọng Nam 20-40 tuổi": "20-40 tuổi, giọng miền Nam, năng động, nhịp độ nhanh, vui vẻ, tông cao, hào hứng.",
    "Giọng Bắc 50-60 tuổi": "50-60 tuổi, giọng miền Bắc, giọng trầm, vang, ổn định, uy quyền, đáng tin cậy.",
    "Giọng Nam 50-60 tuổi": "50-60 tuổi, giọng miền Nam, giọng trầm, vang, ổn định, uy quyền, đáng tin cậy.",
    "Giọng Bắc 60-80 tuổi": "60-80 tuổi, giọng miền Bắc, khàn, hào sảng, chân chất, thực tế.",
    "Giọng Nam 60-80 tuổi": "60-80 tuổi, giọng miền Nam, khàn, hào sảng, chân chất, thực tế."
  };
  
  return (mapping[voiceLabel] || voiceLabel) + "\n" + dialectInstruction;
};

/**
 * Hàm vẽ chữ lên ảnh bằng Canvas để đảm bảo chính tả tiếng Việt 100%
 */
const applyTextOverlay = async (
    imageUrl: string, 
    text: string, 
    position: 'Top' | 'Bottom' | 'Split',
    fontId: string = 'Montserrat',
    textColor: string = '#FFFFFF',
    userFontSize: number = 60
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) { resolve(imageUrl); return; }

            ctx.drawImage(img, 0, 0);

            const scaleFactor = img.width / 1200;
            let baseFontSize = Math.floor(userFontSize * scaleFactor);
            
            let fontFamily = 'Montserrat, sans-serif';
            switch(fontId) {
              case 'Roboto': fontFamily = '"Roboto", sans-serif'; break;
              case 'Montserrat': fontFamily = '"Montserrat", sans-serif'; break;
              case 'Open Sans': fontFamily = '"Open Sans", sans-serif'; break;
              case 'Oswald': fontFamily = '"Oswald", sans-serif'; break;
              case 'Noto Sans': fontFamily = '"Noto Sans", sans-serif'; break;
              case 'Playfair Display': fontFamily = '"Playfair Display", serif'; break;
              case 'Lora': fontFamily = '"Lora", serif'; break;
              case 'Merriweather': fontFamily = '"Merriweather", serif'; break;
              case 'Pacifico': fontFamily = '"Pacifico", cursive'; break;
              case 'Dancing Script': fontFamily = '"Dancing Script", cursive'; break;
              case 'Lobster': fontFamily = '"Lobster", cursive'; break;
              case 'Charm': fontFamily = '"Charm", cursive'; break;
              case 'Mali': fontFamily = '"Mali", cursive'; break;
              case 'Patrick Hand': fontFamily = '"Patrick Hand", cursive'; break;
              case 'Baloo 2': fontFamily = '"Baloo 2", cursive'; break;
              case 'Comfortaa': fontFamily = '"Comfortaa", cursive'; break;
              case 'Quicksand': fontFamily = '"Quicksand", sans-serif'; break;
              case 'Josefin Sans': fontFamily = '"Josefin Sans", sans-serif'; break;
              case 'Archivo Black': fontFamily = '"Archivo Black", sans-serif'; break;
              case 'Saira Stencil One': fontFamily = '"Saira Stencil One", cursive'; break;
              case 'Noto Sans SC': fontFamily = '"Noto Sans SC", sans-serif'; break;
            }
            
            // Standardize weight for display fonts
            const fontWeight = ['Pacifico', 'Lobster', 'Archivo Black', 'Saira Stencil One'].includes(fontId) ? '' : '900';
            ctx.font = `${fontWeight} ${baseFontSize}px ${fontFamily}`;
            
            const spacing = Math.floor(baseFontSize * 0.05);
            if ('letterSpacing' in ctx) { (ctx as any).letterSpacing = `${spacing}px`; }

            ctx.fillStyle = textColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const maxWidth = img.width * 0.92;
            const lineHeight = baseFontSize * 1.35;

            const wrapTextToLines = (txt: string): string[] => {
                const words = txt.split(' ');
                if (words.length === 0) return [];
                let lines: string[] = [];
                let currentLine = words[0];

                for (let i = 1; i < words.length; i++) {
                    const width = ctx.measureText(currentLine + " " + words[i]).width;
                    if (width < maxWidth) {
                        currentLine += " " + words[i];
                    } else {
                        lines.push(currentLine);
                        currentLine = words[i];
                    }
                }
                lines.push(currentLine);
                return lines;
            };

            const drawLines = (linesToDraw: string[], startY: number) => {
                 ctx.lineWidth = Math.max(3, baseFontSize * 0.12);
                 ctx.strokeStyle = 'rgba(0,0,0,0.85)';
                 ctx.lineJoin = 'round';
                 ctx.shadowBlur = 4;
                 ctx.shadowColor = 'rgba(0,0,0,0.5)';
                 
                 let y = startY;
                 const x = img.width / 2;
                 
                 linesToDraw.forEach(line => {
                    ctx.strokeText(line, x, y);
                    ctx.fillText(line, x, y);
                    y += lineHeight;
                 });
            };

            const padding = img.height * 0.08;

            if (position === 'Top') {
                 const lines = wrapTextToLines(text);
                 drawLines(lines, padding + (lineHeight/2));
            } else if (position === 'Bottom') {
                 const lines = wrapTextToLines(text);
                 const textHeight = lines.length * lineHeight;
                 const startY = img.height - textHeight - padding;
                 drawLines(lines, startY + (lineHeight/2));
            } else { 
                 const sentenceEndings = /[.!?]\s+/;
                 const parts = text.split(sentenceEndings);
                 let topText = "";
                 let bottomText = "";

                 if (parts.length >= 2) {
                     const splitIndex = Math.ceil(parts.length / 2);
                     const splitPos = text.split(sentenceEndings, splitIndex).join("").length + (splitIndex * 2);
                     topText = text.substring(0, splitPos).trim();
                     bottomText = text.substring(splitPos).trim();
                 } else {
                     const words = text.split(' ');
                     const mid = Math.ceil(words.length / 2);
                     topText = words.slice(0, mid).join(' ');
                     bottomText = words.slice(mid).join(' ');
                 }

                 const topLines = wrapTextToLines(topText);
                 const bottomLines = wrapTextToLines(bottomText);

                 if (topLines.length > 0) drawLines(topLines, padding + (lineHeight/2));
                 if (bottomLines.length > 0) {
                     const h = bottomLines.length * lineHeight;
                     const startY = img.height - h - padding;
                     drawLines(bottomLines, startY + (lineHeight/2));
                 }
            }

            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => resolve(imageUrl);
        img.src = imageUrl;
    });
};

export const generateCarouselScript = async (
  topic: string, 
  imageCount: number, 
  notes: string, 
  productName: string,
  category: string, 
  subCategory: string, 
  storyIdea: string,
  gender: string = 'Nữ',
  voice: string = 'Giọng Bắc 20-40 tuổi',
  addressing: string = ''
): Promise<string[]> => {
  const ai = getAiClient();
  const voiceDetail = getVoiceDetailedInstruction(voice);

  const strategy = `CHIẾN LƯỢC: Tạo sự đồng cảm (Vulnerability), khai thác Insight, hoặc kể chuyện cá nhân. NHÂN VẬT: Giới tính ${gender}, Đặc điểm giọng nói: ${voiceDetail}.`;
  
  const prompt = `
    Tạo kịch bản ${imageCount} slide TikTok Carousel. 
    Topic: "${topic}". 
    Story: "${storyIdea}". 
    Cat: ${category}/${subCategory}. 
    Pro: ${productName}. 
    Note: ${notes}. 
    ${strategy}
    
    XƯNG HÔ (BẮT BUỘC): Sử dụng cặp xưng hô "${addressing}" (Người nói - Người nghe) xuyên suốt các slide.
    
    YÊU CẦU: Mỗi slide 1 câu từ 100 đến 250 ký tự, súc tích, gây ấn tượng mạnh. Văn phong phải cực kỳ khớp với vùng miền được chỉ định.
    Trả về mảng JSON Tiếng Việt chính xác 100% chính tả.
  `;
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts: [{ text: prompt }] },
    config: { 
      responseMimeType: "application/json", 
      responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } } 
    }
  });
  return JSON.parse(response.text || '[]');
};

export const generateCarouselImage = async (
  productImages: any[], 
  faceImage: any | null, 
  textContent: string,
  characterNote: string, 
  extraNote: string, 
  regenerateNote: string,
  fontFamily: string = "Montserrat", 
  textPosition: string = "Bottom",
  gender: string = 'Nữ',
  textColor: string = '#FFFFFF',
  fontSize: number = 60,
  imageStyle: 'Realistic' | '3D' = 'Realistic'
): Promise<string> => {
  const ai = getAiClient();
  const is3D = imageStyle === '3D';
  
  const baseStyle = is3D 
    ? "3D Animation Pixar/Disney style, vibrant colors, expressive 3D character design, high-quality CGI."
    : "Photorealistic RAW PHOTO, professional lifestyle commercial photography, cinematic lighting, 8k resolution.";

  const textLength = textContent.length;
  let compositionInstruction = "";
  
  if (textPosition === 'Top') {
      compositionInstruction = "COMPOSITION: FILL THE ENTIRE 3:4 FRAME. FULL BLEED. Subject placed in the LOWER HALF. ENSURE TOP 40% is a CLEAR BACKGROUND area.";
  } else if (textPosition === 'Bottom') {
      compositionInstruction = "COMPOSITION: FILL THE ENTIRE 3:4 FRAME. FULL BLEED. Subject placed in the UPPER HALF. ENSURE BOTTOM 40% is a CLEAR BACKGROUND area.";
  } else {
      compositionInstruction = "COMPOSITION: FILL THE ENTIRE 3:4 FRAME. FULL BLEED. Subject centered vertically. ENSURE TOP 25% AND BOTTOM 25% are CLEAR BACKGROUND areas.";
  }

  const prompt = `
    TASK: Generate a high-quality ${is3D ? '3D Animation' : 'Photorealistic'} FULL-FRAME TikTok Carousel Slide (3:4 ratio).
    
    CRITICAL: THE IMAGE MUST FILL THE ENTIRE 3:4 RATIO EDGE-TO-EDGE. 
    ${baseStyle}
    
    ${compositionInstruction}
    
    VISUAL CONSISTENCY:
    - FACE: Exact match to provided Face reference.
    - GENDER: Adult Vietnamese ${gender}.
    - OUTFIT: Exact match to: ${characterNote}.
    - CONSISTENCY: Maintain identical character design throughout.
    
    STRICT PRODUCT FIDELITY:
    - The product (if any) MUST MATCH the input reference image 1:1.

    SUBJECT: A Vietnamese person in a lifestyle setting.
    VIBE: Matching the story: "${textContent}".
    STRICT CONSTRAINT: NO TEXT IN IMAGE. System will overlay text later. 
    
    SCENE: ${extraNote}. ${regenerateNote ? `Feedback: ${regenerateNote}` : ""}
  `;

  const parts: any[] = [{ text: prompt }];
  if (faceImage) parts.push({ inlineData: faceImage });
  productImages.forEach(p => parts.push({ inlineData: p }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: { imageConfig: { aspectRatio: "3:4" } }
    });
    
    const imgPart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (!imgPart) throw new Error("No image generated");
    
    const rawBase64 = `data:image/png;base64,${imgPart.inlineData.data}`;
    return await applyTextOverlay(rawBase64, textContent, textPosition as any, fontFamily, textColor, fontSize);
  } catch (error) {
    throw error;
  }
};

export const generateCarouselVeoPrompt = async (
  textContent: string,
  gender: string,
  voice: string,
  characterNote: string,
  extraNote: string,
  imageStyle: 'Realistic' | '3D' = 'Realistic'
): Promise<string> => {
    const ai = getAiClient();
    const is3D = imageStyle === '3D';
    const voiceDetail = getVoiceDetailedInstruction(voice);
    const voiceGender = gender === 'Nữ' ? 'Female' : 'Male';

    const systemPrompt = `
    Nhiệm vụ: Viết một lời nhắc (Prompt) chi tiết để tạo video AI (VEO-3) dài 8 giây cho 1 slide carousel.
    PHONG CÁCH VIDEO: ${is3D ? "3D Animation / CGI Style" : "Photorealistic / Real Life Style"}.

    CẤU TRÚC PROMPT:
    PHẦN 1: NHÂN VẬT & DIỆN MẠO. Nhân vật người Việt Nam ${gender}, ${characterNote}. ${is3D ? "Phong cách hoạt hình 3D Pixar/Disney." : "Phong cách người thật chân thực."}
    PHẦN 2: HÀNH ĐỘNG. Nhân vật thể hiện cảm xúc phù hợp với nội dung: "${textContent}". 
    PHẦN 3: BỐI CẢNH. ${extraNote}. ${is3D ? "Môi trường 3D sống động." : "Ánh sáng điện ảnh chân thực."}
    PHẦN 4: CHUYỂN ĐỘNG MÁY ẢNH. Tỉ lệ 3:4 hoặc 9:16. Chuyển động máy mượt mà.
    PHẦN 5: LỜI THOẠI. ✨ Model speaks in ${voiceDetail} characteristics (${voiceGender}): "${textContent}"
    PHẦN 6: THÔNG SỐ: 4K, ${is3D ? "3D Animation, Masterpiece CGI, 60fps" : "Realistic, Cinematic Lighting, Photorealistic, 60fps"}.

    YÊU CẦU: Trả về prompt trên 1 dòng duy nhất bằng tiếng anh (trừ phần lời thoại).
    `;

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts: [{ text: systemPrompt }] }
    });
    return response.text?.trim().replace(/\n/g, ' ') || "";
};
