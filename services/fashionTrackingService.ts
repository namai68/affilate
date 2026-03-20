
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

/**
 * Tạo hình ảnh thời trang Fashion Tracking bằng Gemini 2.5 Flash Image
 */
export const generateFashionTrackingImage = async (
  outfitPart: any,
  index: number
): Promise<string> => {
  const ai = getAiClient();

  // Danh sách các góc máy đa dạng phong cách "chụp lén" (Candid/Paparazzi)
  const spyAngles = [
    "Side profile view from a distance (Góc nghiêng hoàn toàn từ xa)",
    "Three-quarter view from behind (Góc 3/4 nhìn từ phía sau lưng)",
    "High angle looking down from an industrial catwalk (Góc từ trên cao nhìn xuống như camera giám sát)",
    "Hidden camera style, shot through some industrial machinery or pipes (Góc chụp lén xuyên qua khe hở máy móc hoặc đường ống)",
    "Low angle side view as if taken from a sitting position (Góc thấp nhìn từ dưới lên phía bên cạnh)",
    "Over-the-shoulder view from another worker's perspective (Góc nhìn qua vai của một người khác)"
  ];
  
  const selectedAngle = spyAngles[index % spyAngles.length];
  
  const prompt = `
    NHIỆM VỤ: Chụp ảnh thời trang phong cách "Candid Paparazzi" (Chụp lén, không dàn dựng).
    PHONG CÁCH: Street style tự nhiên, chân thực, cảm giác như thợ săn ảnh đang bắt trọn khoảnh khắc của nhân vật.
    
    !!! QUY TẮC MÁY ẢNH (BẮT BUỘC) !!!:
    - GÓC MÁY: ${selectedAngle}.
    - TUYỆT ĐỐI KHÔNG CHỤP CHÍNH DIỆN (NO FRONT VIEW).
    - Cảm giác máy ảnh đặt ở một vị trí khuất hoặc không gây chú ý.
    - Nhân vật hoàn toàn không biết mình đang bị chụp ảnh.
    
    ĐỐI TƯỢNG: Một phụ nữ Việt Nam trẻ (20-30 tuổi), đang đi bộ tự nhiên trong khu công nghiệp.
    QUY TẮC BIẾN THỂ: Đây là đối tượng #${index + 1}. Tạo một nhân vật DUY NHẤT: hình dáng khuôn mặt độc đáo, kiểu tóc độc đáo (ví dụ: tóc đuôi ngựa, sóng lơi, búi cao, tết 1 bên...) và phong cách trang điểm độc đáo. Cô ấy phải trông khác biệt rõ rệt với các đối tượng khác.
    
    !!! ĐỒNG NHẤT TRANG PHỤC (BẮT BUỘC 100%) !!!:
    1. Đối tượng PHẢI MẶC CHÍNH XÁC BỘ TRANG PHỤC như trong ẢNH THAM CHIẾU.
    2. Duy trì sự đồng nhất 100% về màu sắc, hoa văn, kết cấu vải và thiết kế của bộ đồ cụ thể này.
    
    TẠO PHONG CÁCH BỔ SUNG:
    - Thêm các phụ kiện thời trang hiện đại: một chiếc túi xách sành điệu, vòng tay tinh tế và giày đi bộ thoải mái, hợp thời trang.
    - TƯ THẾ: Đi bộ tự nhiên, đầu hơi cúi hoặc nhìn sang hướng khác. TUYỆT ĐỐI KHÔNG NHÌN VÀO CAMERA.
    
    MÔI TRƯỜNG:
    - BỐI CẢNH: Một khu công nghiệp Việt Nam thực tế.
    - KHÔNG KHÍ: Giờ giao ca sáng hoặc đầu giờ chiều.
    - HẬU CẢNH: Một vài công nhân khác đang đi bộ ngẫu nhiên một mình ở phía xa, tạo không khí bận rộn.
    
    CHẤT LƯỢNG & ĐỘ CHÂN THỰC:
    - Ảnh chân thực (photorealistic), ánh sáng tự nhiên, độ phân giải 8k, phong cách đời thường (lifestyle).
    
    !!! QUY TẮC KẾT CẤU DA (QUAN TRỌNG) !!!:
    - Giữ nguyên kết cấu da người chi tiết: lỗ chân lông, nếp nhăn vi mô và khuyết điểm thực tế.
    - KHÔNG làm mịn, KHÔNG làm mờ nhân tạo, KHÔNG tạo làn da nhựa.
    
    TỶ LỆ: 9:16 dọc.
    BẮT BUỘC: KHÔNG CÓ CHỮ, KHÔNG CÓ LOGO, KHÔNG CÓ DẤU MỜ.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: { parts: [{ text: prompt }, { inlineData: outfitPart }] },
      config: { imageConfig: { aspectRatio: "9:16" } }
    });

    const imgPart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (!imgPart) throw new Error("Tạo ảnh thất bại");
    return `data:image/png;base64,${imgPart.inlineData.data}`;
  } catch (error) {
    console.error("Lỗi tạo ảnh Fashion Tracking:", error);
    throw error;
  }
};

/**
 * Viết kịch bản Video Prompt dựa trên ảnh đã tạo
 */
export const generateFashionTrackingVideoPrompt = async (
  imageBase64: string
): Promise<string> => {
  const ai = getAiClient();
  
  const instruction = `
    Phân tích hình ảnh thời trang đính kèm (phong cách chụp lén paparazzi) và viết một Prompt Video AI chi tiết cho VEO-3 (8 giây).
    Prompt PHẢI tuân theo cấu trúc chính xác này nhưng trả về dưới dạng MỘT ĐOẠN VĂN LIỀM MẠCH DUY NHẤT (không xuống dòng):
    
    Creat video 8s. 
    Nhân vật: [Mô tả người phụ nữ Việt Nam trong ảnh cực kỳ chi tiết: tóc, khuôn mặt, bộ trang phục chính xác, túi xách]. 
    Bối cảnh: [Mô tả bối cảnh khu công nghiệp, góc máy từ phía xa hoặc góc nghiêng, ánh sáng tự nhiên]. 
    Hành động: nhân vật bước đi nhanh, tự nhiên về phía trước, không nhìn camera. 
    Camera: tracking theo nhân vật từ góc độ paparazzi (đi bên cạnh hoặc phía sau). 
    Chất lượng: video 4k, 60 fps, không nhạc nền, không cắt cảnh, không thay đổi bối cảnh trong suốt 8s. nhân vật đi từ A đến B một cách liền mạch.
    
    YÊU CẦU: Trả về kết quả trên 1 dòng duy nhất, không xuống dòng.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { 
        parts: [
          { text: instruction },
          { inlineData: { mimeType: 'image/png', data: imageBase64.split(',')[1] } }
        ] 
      }
    });
    return response.text?.trim().replace(/\n/g, ' ') || "";
  } catch (error) {
    return "Lỗi khi tạo prompt video.";
  }
};
