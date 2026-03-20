
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

/**
 * Phân tích trang phục chi tiết từ ảnh tải lên.
 */
export const describePovOutfit = async (outfitPart: any): Promise<string> => {
  const ai = getAiClient();
  const prompt = `
    Analyze the CLOTHING in this image in extreme detail for an AI image generator.
    !!! CRITICAL PRIVACY & IDENTITY RULE !!!: 
    - Focus ONLY on the garments, fabric, shoes, and accessories. 
    - COMPLETELY IGNORE the person's face, hair, and identity. 
    Return a descriptive technical fashion paragraph in English.
  `;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: [{ text: prompt }, { inlineData: outfitPart }] }
    });
    return response.text?.trim() || "A stylish outfit.";
  } catch (error) { return "Detailed outfit description."; }
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

export const analyzeVideoContent = async (videoFile: File): Promise<string> => {
  const ai = getAiClient();
  const part = await fileToGenerativePart(videoFile);
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { 
      parts: [
        { text: "Phân tích video này cực kỳ chi tiết. Bao gồm: 1. Nội dung kịch bản lời thoại (nếu có). 2. Bối cảnh không gian. 3. Các nhân vật xuất hiện và đặc điểm của họ. 4. Diễn biến hành động chính. Hãy viết bằng tiếng Việt rõ ràng." }, 
        { inlineData: part }
      ] 
    }
  });
  return response.text || "";
};

export const analyzeTextContent = async (text: string): Promise<string> => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { 
      parts: [
        { text: `Phân tích kịch bản/nội dung sau đây cực kỳ chi tiết để phục vụ việc tạo video POV. Bao gồm: 1. Nội dung kịch bản chi tiết. 2. Bối cảnh không gian mô tả. 3. Các nhân vật và đặc điểm ngoại hình/tính cách. 4. Các hành động chính diễn ra. Kịch bản gốc: "${text}"` }
      ] 
    }
  });
  return response.text || "";
};

export const generatePovSegments = async (
  analysis: string, 
  style: string, 
  count: number, 
  gender: string, 
  voice: string, 
  addressing: string,
  charDesc: string, 
  contextNote: string
): Promise<string[]> => {
  const ai = getAiClient();
  const voiceDetail = getVoiceDetailedInstruction(voice);

  const prompt = `
    Dựa trên bản phân tích nội dung sau: "${analysis}".
    Hãy tạo ra một kịch bản POV mới hoàn toàn, phong cách: "${style}".
    
    YÊU CẦU VỀ NỘI DUNG KỊCH BẢN (CỰC KỲ QUAN TRỌNG):
    1. Kịch bản CHỈ bao gồm lời thoại (dialogue) hoặc lời dẫn truyện (narration).
    2. TUYỆT ĐỐI KHÔNG mô tả nhân vật vào nội dung kịch bản (ví dụ: KHÔNG viết "Cô gái xinh đẹp nói...", "Mặc áo đỏ...").
    3. TUYỆT ĐỐI KHÔNG mô tả bối cảnh vào nội dung kịch bản (ví dụ: KHÔNG viết "Trong căn phòng...", "Dưới ánh nắng...").
    4. TUYỆT ĐỐI KHÔNG viết các ghi chú hành động hoặc cảm xúc trong ngoặc (ví dụ: KHÔNG viết "(cười)", "(khóc)", "(đi bộ)").
    5. Nội dung kịch bản phải thuần túy là câu nói tự nhiên dựa trên "${analysis}".
    6. XƯNG HÔ (BẮT BUỘC): Sử dụng cặp xưng hô "${addressing}" (Người nói - Người nghe) xuyên suốt 100%.

    THÔNG TIN THAM KHẢO (Dùng để định hướng nội dung nhưng KHÔNG viết vào kịch bản):
    - Giới tính nhân vật chính: ${gender}.
    - Đặc điểm giọng nói & Văn phong: ${voiceDetail}.
    - Mô tả nhân vật: ${charDesc}.
    - Ghi chú bối cảnh: ${contextNote}.

    YÊU CẦU CẤU TRÚC:
    - Chia kịch bản thành đúng ${count} đoạn nhỏ.
    - Mỗi đoạn từ 160 đến 190 ký tự. TUYỆT ĐỐI KHÔNG ngắn hơn 160 ký tự.
    - Trả về kết quả dưới dạng một mảng JSON các chuỗi ký tự.
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
    console.error("Parse script error", e);
    return [];
  }
};

/**
 * Viết lại một đoạn kịch bản POV cụ thể.
 */
export const regeneratePovSegment = async (
  analysis: string,
  style: string,
  gender: string,
  voice: string,
  addressing: string,
  charDesc: string,
  contextNote: string,
  currentContent: string,
  allSegments: string[]
): Promise<string> => {
  const ai = getAiClient();
  const voiceDetail = getVoiceDetailedInstruction(voice);

  const prompt = `
    Hãy viết lại ĐOẠN kịch bản POV sau đây cho hay hơn và viral hơn.
    Nội dung cũ: "${currentContent}"
    Toàn bộ kịch bản hiện tại để đảm bảo tính liên kết: "${allSegments.join(' ')}"
    
    YÊU CẦU:
    1. Chỉ trả về lời thoại mới.
    2. Độ dài: 160 - 190 ký tự.
    3. XƯNG HÔ (BẮT BUỘC): Sử dụng cặp xưng hô "${addressing}" (Người nói - Người nghe).
    4. Đặc điểm giọng nói & Văn phong: ${voiceDetail}.
    5. Trả về duy nhất lời thoại mới.
    6. Không thêm mô tả nhân vật hay bối cảnh.
  `;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: [{ text: prompt }] }
    });
    return response.text?.trim() || currentContent;
  } catch (e) { return currentContent; }
};

export const generatePovImage = async (
  script: string, 
  facePart: any | null, 
  gender: string, 
  charDesc: string,
  regenNote: string = "",
  imageStyle: 'Realistic' | '3D' = 'Realistic',
  contextNote: string = "",
  outfitPart: any | null = null,
  poseLabel: string = ""
): Promise<string> => {
  const ai = getAiClient();
  const modelId = "gemini-2.5-flash-image";
  const is3D = imageStyle === '3D';
  
  const baseStyle = is3D 
    ? "3D Animation Pixar/Disney style, vibrant colors, expressive 3D character design, polished CGI."
    : "Photorealistic RAW PHOTO, 8k resolution, authentic textures, cinematic lighting.";
    
  const faceInstruction = facePart 
    ? "Maintain the exact facial features of the person in the provided face reference image." 
    : `Appearance: Vietnamese ${gender}. ${charDesc}`;

  const outfitInstruction = outfitPart 
    ? "The character MUST wear the exact outfit shown in the OUTFIT_REFERENCE image. Match the style, fabric, and colors perfectly."
    : "The character wears an outfit matching the description: " + charDesc;
  
  const characterFidelityRule = charDesc ? `
    CRITICAL CHARACTER FIDELITY (MANDATORY):
    - You MUST follow these specific appearance details for the character: "${charDesc}".
    - DO NOT deviate from the described age, physique, or personality.
    - The character must look EXACTLY as described in every detail.
    ${is3D ? "- Translate these details into a cute and stylized 3D character design." : ""}
  ` : "";

  const backgroundRule = contextNote ? `
    CRITICAL BACKGROUND INSTRUCTION (PRIORITY):
    - You MUST place the character in the following environment: "${contextNote}".
    - Strictly adhere to all details, objects, and atmosphere described in this background note.
  ` : "ENVIRONMENT: Natural lifestyle setting appropriate for the scene.";

  const poseInstruction = poseLabel ? `CHARACTER POSE (MANDATORY): The person is ${poseLabel}. Ensure the action and facial expression match this POV pose perfectly.` : "";

  const prompt = `
    ${baseStyle} 9:16 aspect ratio.
    Subject: ${faceInstruction}.
    ${outfitInstruction}
    ${poseInstruction}
    Action/Scene: "${script}".
    
    ${characterFidelityRule}
    ${backgroundRule}


    CRITICAL VISUAL RULES (STRICT NO-TEXT & NO-UI POLICY):
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

    MANDATORY: NO TEXT, NO SUBTITLES, NO OVERLAYS, NO ICONS, NO GRAPHICS, NO EMOJIS, NO VISUAL EFFECT.
    ${regenNote ? `Additional Feedback: ${regenNote}` : ""}
  `;

  const parts: any[] = [{ text: prompt }];
  if (facePart) parts.push({ inlineData: facePart });
  if (outfitPart) parts.push({ inlineData: outfitPart });

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts },
      config: { imageConfig: { aspectRatio: "9:16" } }
    });
    const imgPart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    return imgPart ? `data:image/png;base64,${imgPart.inlineData.data}` : "";
  } catch (error) {
    console.error("Image generation failed:", error);
    throw error;
  }
};

export const formatVideoPrompt = async (
  script: string, 
  gender: string, 
  voice: string, 
  charDesc: string, 
  contextNote: string,
  imageStyle: 'Realistic' | '3D' = 'Realistic',
  generatedImageBase64?: string,
  poseLabel: string = ""
): Promise<string> => {
    const ai = getAiClient();
    const is3D = imageStyle === '3D';
    const voiceDetail = getVoiceDetailedInstruction(voice);
    const voiceGender = gender === 'Nữ' ? 'Female' : 'Male';

    const systemPrompt = `
    Bạn là chuyên gia viết prompt cho AI Video (VEO-3). Nhiệm vụ của bạn là viết một bản mô tả chi tiết để chuyển hóa hình ảnh tĩnh thành video POV sinh động.
    
    NGUYÊN TẮC QUAN TRỌNG (BẮT BUỘC):
    1. MÔ TẢ DỰA TRÊN HÌNH ẢNH THAM CHIẾU: Bạn phải nhìn kỹ ảnh được cung cấp và mô tả lại ĐÚNG nhân vật (trang phục, kiểu tóc, gương mặt) và bối cảnh (vật dụng xung quanh, ánh sáng) đang xuất hiện trong đó.
    2. KHÔNG TỰ Ý BỊA ĐẶT: Tuyệt đối không thêm thắt các chi tiết bối cảnh lạ lẫm không có trong ảnh.
    3. TƯƠNG THÍCH KỊCH BẢN & TƯ THẾ: Biểu cảm gương mặt và cử động của nhân vật phải khớp với nội dung kịch bản nói: "${script}" và tư thế POV: "${poseLabel}".
    4. DUY TRÌ TÍNH NHẤT QUÁN: Đảm bảo nhân vật trong video giống hệt nhân vật trong ảnh.

    PHONG CÁCH VIDEO: ${is3D ? "3D Animation / CGI Style" : "Photorealistic / Real Life Style"}.

    CẤU TRÚC PHẢI TUÂN THỦ 6 ĐOẠN (VIẾT LIỀM MẠCH TRÊN 1 DÒNG):
    Đoạn 1: Nhân vật & bối cảnh. (Dựa trên ảnh: Nhân vật người Việt Nam ${gender}, mặc đồ như trong ảnh. ${is3D ? "Phong cách hoạt hình 3D." : "Phong cách người thật."} Video 9:16).
    Đoạn 2: Hành động & tương tác. (Mô tả hành động nhân vật thực hiện tư thế "${poseLabel}", nói chuyện, biểu cảm phù hợp lời thoại: "${script}").
    Đoạn 3: Góc quay & chuyển động máy. (Cách nhân vật di chuyển và tương tác với Camera. Có Pan hoặc Dolly hoặc zoom hoặc tracking shot vào nhân vật (tuyệt đối không thay đổi bối cảnh và nhân vật).
    Đoạn 4: Hậu cảnh & đạo cụ. (Mô tả chi tiết các vật thể đang có trong ảnh tham chiếu. Lưu ý bối cảnh/cấm kỵ: ${contextNote}).
    Đoạn 5: Lời thoại (QUAN TRỌNG NHẤT): ✨ Model speaks in ${voiceDetail} characteristics (${voiceGender}): "${script}"
    Đoạn 6: Thông số kỹ thuật. (9:16, 4K, ${is3D ? "3D Animation, Masterpiece CGI, 60fps" : "Realistic, Cinematic Lighting, Photorealistic, 60fps"}).

    YÊU CẦU ĐẦU RA: Chỉ trả về 1 dòng Tiếng Anh duy nhất (trừ phần lời thoại).
    `;

    const parts: any[] = [{ text: systemPrompt }];
    if (generatedImageBase64) {
      parts.push({ 
        inlineData: { 
          mimeType: 'image/png', 
          data: generatedImageBase64.split(',')[1] || generatedImageBase64 
        } 
      });
    }

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts }
    });
    return response.text?.trim().replace(/\n/g, ' ') || "";
};
