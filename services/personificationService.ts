
import { GoogleGenAI, Type } from "@google/genai";
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

const FORBIDDEN_TERMS = `Facebook, Shopee, Lazada, Tiki, Zalo, Sale sốc, Mua ngay, Cam kết, Top 1, Giá rẻ nhất.`;

export const generatePersonificationScript = async (
  healthKeyword: string,
  ctaProduct: string,
  frameCount: number,
  gender: string,
  voice: string,
  addressing: string,
  style: string,
  characterDescription: string
): Promise<string[]> => {
  const ai = getAiClient();
  
  let dialectInstruction = voice === 'Miền Bắc' 
    ? `KỊCH TÍNH, FOMO, NHANH. VĂN PHONG MIỀN BẮC (HÀ NỘI): dùng nhé, ạ, thế, đấy, chứ. Không dùng: nha, nè, thiệt, hông.` 
    : `KỊCH TÍNH, FOMO, NHANH. VĂN PHONG MIỀN NAM (SÀI GÒN): dùng nha, nè, nghen, hen, hông, thiệt. Không dùng: nhé, ạ, thế.`;

  const prompt = `
    Nhiệm vụ: Tạo kịch bản TikTok nhân hóa bộ phận cơ thể dựa trên NỘI DUNG NGUỒN.
    NỘI DUNG NGUỒN: "${healthKeyword}"
    SẢN PHẨM CTA: "${ctaProduct}"
    SỐ KHUNG HÌNH: ${frameCount}
    GIỚI TÍNH: ${gender}
    GIỌNG ĐIỆU: ${voice}
    MÔ TẢ NHÂN VẬT TỔNG THỂ: "${characterDescription}"
    
    HƯỚNG DẪN XỬ LÝ:
    1. Phân tích nội dung nguồn để tìm ra nhân vật nhân hóa liên quan nhất (VD: gan, tim, phổi, mắt, củ khoai tây, cây súp lơ...).
    2. Tạo kịch bản từ góc nhìn bộ phận đó đang "tâm sự" hoặc "mắng" chủ nhân.
    3. PHONG CÁCH: "${style}".
    4. XƯNG HÔ: Bắt buộc dùng cặp "${addressing}" (Người nói - Người nghe).
    
    CẤU TRÚC:
    - Khung đầu: Hook ấn tượng.
    - Khung giữa: Nỗi đau/Insight.
    - Khung kế cuối: Giới thiệu công dụng sản phẩm "${ctaProduct}".
    - Khung cuối: CTA điều hướng mua hàng.

    YÊU CẦU NGÔN NGỮ: ${dialectInstruction}. XƯNG HÔ: Bắt buộc dùng cặp "${addressing}" (Người nói - Người nghe).
    Độ dài: Bắt buộc từ 160-190 ký tự mỗi đoạn. Trả về mảng JSON.
    TUYỆT ĐỐI KHÔNG DÙNG: ${FORBIDDEN_TERMS}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: [{ text: prompt }] },
      config: { 
        responseMimeType: "application/json",
        responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    });
    return JSON.parse(cleanJsonResponse(response.text || '[]'));
  } catch (e) {
    console.error("Script generation failed", e);
    return [];
  }
};

export const generatePersonificationImage = async (
  script: string,
  productImages: any[],
  characterPart: any | null,
  healthKeyword: string,
  ctaProduct: string,
  gender: string,
  globalCharDesc: string,
  sceneIdea: string,
  regenNote: string = ""
): Promise<string> => {
  const ai = getAiClient();
  const is3D = true;
  
  const noProductKeywords = ["không có sản phẩm", "xóa sản phẩm", "no product", "remove product", "without product"];
  const isNoProductRequested = (regenNote + sceneIdea).toLowerCase().split(' ').some(word => noProductKeywords.includes(word));

  // ÁP DỤNG VISUAL RULES CHUẨN TỪ KOC REVIEW
  const visualRules = `
    CRITICAL VISUAL RULES (STRICT NO-TEXT POLICY):
    1. ABSOLUTELY NO TEXT, NO LETTERS, NO NUMBERS, NO CHARACTERS.
    2. The background must be CLEAN and FREE of signage, posters, labels, or written words.
    3. If the context implies a screen or sign, leave it BLANK or Abstract.
    4. NO UI elements, NO speech bubbles, NO watermarks, NO subtitles.
    5. The image must be purely visual storytelling.
    6. ABSOLUTELY NO ICONS, NO GRAPHICS, NO EMOJIS, NO VISUAL EFFECTS, NO OVERLAYS.
    7. Do NOT simulate TikTok UI or video editing effects. It must look like a RAW 3D RENDER.
    
    CRITICAL RESTRICTIONS & RULES: 
    1. NO CHILDREN, NO KIDS, NO BABIES. 
    2. Must look like high-quality 3D Animation Pixar/Disney style, vibrant colors, polished CGI, masterpiece.
    
    ${isNoProductRequested ? '3. ABSOLUTELY NO PRODUCT/DEVICE IN THIS IMAGE.' : `
    3. STRICT PRODUCT FIDELITY (MANDATORY - TUYỆT ĐỐI):
       - The product "${ctaProduct}" MUST MATCH the input reference images provided.
       - PRESERVE PATTERNS & TEXTURES: Any pattern (họa tiết), logo, or design on the product surface must be preserved.
       - PRESERVE DIMENSIONS: Do not resize or distort the product logic.
       - CONSISTENT SCALE (QUAN TRỌNG): Đảm bảo kích thước và tỷ lệ của sản phẩm so với khung hình phải đồng nhất 100% qua tất cả các cảnh.
       - LOCK the product appearance exactly to the original photos provided 1:1.`}
  `;

  const characterFidelity = characterPart 
    ? `CHARACTER REFERENCE: You MUST use the EXACT character design, appearance, and colors from the CHARACTER_REFERENCE image. Maintain 1:1 identity consistency.`
    : `CHARACTER IDENTITY: A personified character based on: "${healthKeyword.substring(0, 100)}". Gender traits: ${gender}. Appearance: ${globalCharDesc}`;

  const prompt = `
    Style: 3D Animation Pixar style, vibrant colors, polished CGI, masterpiece. 
    Aspect ratio 9:16.
    
    ${characterFidelity}
    
    !!! SPECIFIC SCENE IDEA (HIGHEST PRIORITY): "${sceneIdea}" !!!
    Action description: "${script}".
    
    The character must have a cute/funny/sassy expressive face, arms, legs, and a moving mouth.
    Setting: Based on scene idea: "${sceneIdea}".
    
    ${visualRules}
    ${regenNote ? `Additional Feedback to apply: ${regenNote}` : ""}
  `;

  const contents: any[] = [{ text: prompt }];
  if (characterPart) {
    contents.push({ inlineData: characterPart });
  }
  if (!isNoProductRequested) {
    productImages.forEach(img => contents.push({ inlineData: img }));
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: { parts: contents },
      config: { imageConfig: { aspectRatio: "9:16" } }
    });
    const imgPart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    return imgPart ? `data:image/png;base64,${imgPart.inlineData.data}` : "";
  } catch (e) {
    console.error("Image generation failed", e);
    throw e;
  }
};

export const generatePersonificationVeoPrompt = async (
  script: string,
  healthKeyword: string,
  gender: string,
  voice: string,
  style: string,
  globalDesc: string,
  sceneIdea: string
): Promise<string> => {
  const ai = getAiClient();
  const systemPrompt = `
    Bạn là chuyên gia viết prompt cho AI Video (VEO-3). Tạo kịch bản chi tiết dài 8 giây cho nhân vật nhân hóa 3D.
    
    CẤU TRÚC PROMPT (VIẾT LIỀM MẠCH TRÊN 1 DÒNG):
    Đoạn 1: Nhân vật & bối cảnh. (Mô tả bộ phận cơ thể/nhân vật nhân hóa 3D Disney mượt mà dựa trên: ${globalDesc} và bối cảnh: ${sceneIdea}).
    Đoạn 2: Hành động & tương tác. (Cử động môi khớp lời thoại, hành động theo phong cách ${style}).
    Đoạn 3: Góc quay & chuyển động máy. (Camera 3D Pan/Zoom/Dolly mượt mà, tỉ lệ 9:16).
    Đoạn 4: Hậu cảnh & đạo cụ. (Môi trường sống động, ánh sáng 3D chuyên nghiệp).
    Đoạn 5: Lời thoại: ✨ Model speaks in ${voice} voice (${gender}): "${script}"
    Đoạn 6: Thông số: 9:16, 4K, Masterpiece CGI, 3D Animation, 60fps.

    YÊU CẦU: Trả về 1 dòng Tiếng Anh duy nhất (trừ phần lời thoại).
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts: [{ text: systemPrompt }] }
  });
  return response.text?.trim().replace(/\n/g, ' ') || "";
};
