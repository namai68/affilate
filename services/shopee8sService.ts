import { GoogleGenAI, Type } from "@google/genai";
import { ScriptParts } from "../types";
import { getAiClient } from "./keyService";

const cleanJsonResponse = (text: string) => {
  return text.replace(/```json|```/g, "").trim();
};

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

export const generateShopee8sScript = async (productName: string, usp: string, voice: string, addressing: string, gender: string): Promise<ScriptParts> => {
  const ai = getAiClient();
  const voiceDetail = getVoiceDetailedInstruction(voice);

  const prompt = `Bạn là chuyên gia content Shopee chuyên nghiệp chuyên tạo video viral. 
  Nhiệm vụ: Tạo kịch bản cho 2 video quảng cáo Shopee (mỗi video dài 16 giây).
  
  CẤU TRÚC:
  - VIDEO 1: Chia thành v1 (8s đầu) và v2 (8s sau). v1 và v2 phải kết nối thành 1 câu chuyện liền mạch.
  - VIDEO 2: Chia thành v3 (8s đầu) và v4 (8s sau). v3 và v4 phải kết nối thành 1 câu chuyện liền mạch.
  
  YÊU CẦU ĐỘ DÀI (QUAN TRỌNG):
  - Mỗi phần (v1, v2, v3, v4) PHẢI CÓ độ dài từ 160 đến 180 ký tự. Không được ngắn hơn 160.
  
  NỘI DUNG:
  - Sản phẩm: "${productName}".
  - USP (Keyword quan trọng): "${usp}".
  - Nhân vật: Giới tính ${gender}, Đặc điểm giọng nói & Văn phong: ${voiceDetail}.
  - XƯNG HÔ (BẮT BUỘC): Sử dụng cặp xưng hô "${addressing}" (Người nói - Người nghe) xuyên suốt 100%.
  - Ngôn ngữ trẻ trung, thu hút, đánh thẳng vào USP.
  - Không dùng từ cấm: Shopee, Lazada, Tiki, TikTok Shop.
  
  Trả về duy nhất JSON: { "v1": "...", "v2": "...", "v3": "...", "v4": "..." }`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { 
            v1: { type: Type.STRING }, 
            v2: { type: Type.STRING }, 
            v3: { type: Type.STRING }, 
            v4: { type: Type.STRING } 
          },
          required: ["v1", "v2", "v3", "v4"]
        }
      }
    });
    return JSON.parse(cleanJsonResponse(response.text || '{}'));
  } catch (error) {
    return { v1: '', v2: '', v3: '', v4: '' };
  }
};

export const generateShopee8sImage = async (
  imageParts: any[], 
  productName: string, 
  scriptPart: string, 
  charDesc: string,
  facePart: any | null,
  isFollowUp: boolean = false,
  imageStyle: 'Realistic' | '3D' = 'Realistic',
  gender: string = 'Nữ'
): Promise<string> => {
  const ai = getAiClient();
  const is3D = imageStyle === '3D';
  
  const faceFidelityRule = facePart 
    ? `IDENTITY MANDATE: You MUST use the EXACT facial features, hair, and look from the provided FACE_REFERENCE image. 1:1 match.
       CRITICAL: DO NOT use the face of any person found in the product images. ONLY use the FACE_REFERENCE for the character's head.`
    : `SUBJECT: Adult Vietnamese character. Gender: ${gender}. ${charDesc}`;

  const baseStyle = is3D 
    ? "High-quality 3D Animation Pixar/Disney style, vibrant colors, expressive 3D character design, polished CGI, masterpiece."
    : "Photorealistic high-end commercial RAW PHOTO, 8k resolution, cinematic lighting, authentic skin textures.";

  const visualRules = `
    CRITICAL VISUAL RULES (STRICT NO-TEXT POLICY):
    1. ABSOLUTELY NO TEXT, NO LETTERS, NO NUMBERS, NO CHARACTERS.
    2. The background must be CLEAN and FREE of signage, posters, labels, or written words.
    3. If the context implies a screen or sign, leave it BLANK or Abstract.
    4. NO UI elements, NO speech bubbles, NO watermarks, NO subtitles.
    5. The image must be purely visual storytelling.
    6. ABSOLUTELY NO ICONS, NO GRAPHICS, NO EMOJIS, NO VISUAL EFFECTS, NO OVERLAYS.
    7. Do NOT simulate TikTok UI or video editing effects. It must look like a RAW PHOTO.
    
    CRITICAL RESTRICTIONS & RULES: 
    1. NO CHILDREN, NO KIDS, NO BABIES. The subject must be an adult.
    2. ${is3D ? "Must look like high-quality 3D CGI." : "Must look like a real photo."}
    
    STRICT PRODUCT FIDELITY (MANDATORY - TUYỆT ĐỐI):
       - The product "${productName}" MUST MATCH the input reference image 1:1.
       - PRESERVE PATTERNS & TEXTURES: Any pattern (họa tiết), logo, or design on the product surface must be preserved.
       - PRESERVE DIMENSIONS: Do not resize or distort the product logic.
       - DO NOT change shape, proportions, or physical parts.
       - LOCK the product appearance exactly to the original photo provided.
       - If it's adult fashion, it must be worn, and the reference image must be 100% identical to the sample product.
       - If it's children's fashion, it must still be held in the hand.
  `;

  const consistencyRule = isFollowUp 
    ? "CRITICAL: Maintain ABSOLUTE consistency in character appearance, outfit, and background environment as the previous scene."
    : "Establish a clear character appearance and background setting.";

  const prompt = `
    STYLE: ${baseStyle} 
    RATIO: 9:16 aspect ratio.
    ${faceFidelityRule}
    ${visualRules}
    ${consistencyRule}
    SCENE: Action/Scenario: ${scriptPart}. Additional Character Note: ${charDesc}.
  `;
  
  const contents: any[] = [{ text: prompt }];
  if (facePart) contents.push({ inlineData: facePart });
  if (imageParts.length > 0) contents.push({ inlineData: imageParts[0] });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: { parts: contents },
      config: { imageConfig: { aspectRatio: "9:16" } }
    });
    
    const imgPart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    return imgPart ? `data:image/png;base64,${imgPart.inlineData.data}` : "";
  } catch (error) { throw error; }
};

export const generateShopee8sVeoPrompt = async (
  productName: string, 
  scriptText: string, 
  gender: string, 
  voice: string,
  productImageBase64?: string,
  generatedImageBase64?: string,
  isNoProductRequested: boolean = false,
  imageStyle: 'Realistic' | '3D' = 'Realistic'
): Promise<string> => {
  const ai = getAiClient();
  const is3D = imageStyle === '3D';
  const voiceDetail = getVoiceDetailedInstruction(voice);
  
  const productInteractionRule = isNoProductRequested
    ? `PHẦN 2: HÀNH ĐỘNG & TƯƠNG TÁC (QUAN TRỌNG):
      - TUYỆT ĐỐI KHÔNG xuất hiện sản phẩm "${productName}".
      - Cách nhân vật di chuyển, nói chuyện và tương tác. Kịch bản: "${scriptText}".`
    : `PHẦN 2: HÀNH ĐỘNG & TƯƠNG TÁC (QUAN TRỌNG):
      - Nhân vật đang cầm trên tay sản phẩm "${productName}".
      - Cách nhân vật di chuyển, nói chuyện và tương tác. Kịch bản: "${scriptText}".
      - [Sản phẩm là vật thể cứng, giữ nguyên tỷ lệ 1:1, không biến dạng]`;

  const instructionPrompt = `
  Nhiệm vụ: Viết một lời nhắc (Prompt) chi tiết để tạo video AI (VEO-3) dài 8 giây cho video Shopee Affiliate.
  PHONG CÁCH VIDEO: ${is3D ? "3D Animation / CGI Style" : "Photorealistic / Real Life Style"}.
  !!! CRITICAL IDENTITY RULE !!!: Maintain 100% facial and appearance consistency with the face provided in reference. EXCLUDE any faces from background products.

  CẤU TRÚC PROMPT BẮT BUỘC (6 PHẦN):
  PHẦN 1: NHÂN VẬT & DIỆN MẠO (BẮT BUỘC NHẤT QUÁN). Nhân vật người Việt Nam. ${is3D ? "Phong cách hoạt hình 3D Pixar/Disney." : "Phong cách người thật chân thực."}
  ${productInteractionRule}
  PHẦN 3: BỐI CẢNH & ÁNH SÁNG. ${is3D ? "Môi trường 3D sống động." : "Ánh sáng điện ảnh chân thực."}
  PHẦN 4: CHUYỂN ĐỘNG MÁY ẢNH (9:16). Cách nhân vật di chuyển và tương tác với Camera. Có Pan hoặc Dolly hoặc zoom hoặc tracking shot vào sản phẩm hoặc nhân vật (tuyệt đối không thay đổi bối cảnh và nhân vật).
  PHẦN 5: LỜI THOẠI (DÙNG CHO ĐỒNG BỘ): ✨ Model speaks in ${voiceDetail} accent: "${scriptText}"
  PHẦN 6: CHẤT LƯỢNG KỸ THUẬT: 4K, ${is3D ? "3D Animation, Masterpiece CGI, 60fps" : "Realistic, Cinematic Lighting, Photorealistic, 60fps"}, Không có nhạc nền.

  YÊU CẦU: Trả về 1 dòng Tiếng Anh duy nhất (trừ phần lời thoại). Không xuống dòng.`;

  const contents: any[] = [{ text: instructionPrompt }];
  if (productImageBase64) contents.push({ inlineData: { mimeType: 'image/png', data: productImageBase64.split(',')[1] || productImageBase64 } });
  if (generatedImageBase64) contents.push({ inlineData: { mimeType: 'image/png', data: generatedImageBase64.split(',')[1] || generatedImageBase64 } });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: contents }
    });
    return response.text?.trim().replace(/\n/g, ' ') || "";
  } catch (error) {
    return "Lỗi khi tạo prompt video.";
  }
};