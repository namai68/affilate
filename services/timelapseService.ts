
import { GoogleGenAI, Type } from "@google/genai";
import { getAiClient } from "./keyService";

/**
 * Làm sạch phản hồi JSON từ mô hình AI
 */
const cleanJsonResponse = (text: string) => {
  return text.replace(/```json|```/g, "").trim();
};

/**
 * Chuyển đổi File sang định dạng mà API Generative AI có thể hiểu được
 */
export const fileToGenerativePart = async (file: File) => {
  return new Promise<{ mimeType: string, data: string }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve({ mimeType: file.type, data: (reader.result as string).split(',')[1] });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Nhiệm vụ 1: Tự động phân tích sự khác biệt giữa 2 ảnh để chia giai đoạn thi công theo lộ trình % cụ thể.
 */
export const generateTimelapseScript = async (
  baseImagePart: any, 
  finalGoalPart: any, 
  sceneCount: number,
  progressSteps: number[]
): Promise<string[]> => {
  const ai = getAiClient();
  const prompt = `
    Bạn là chuyên gia phân tích quá trình chuyên nghiệp. 
    NHIỆM VỤ: Phân tích lộ trình biến đổi từ HIỆN TRẠNG sang KẾT QUẢ.
    
    YÊU CẦU KỊCH BẢN:
    1. Chia quá trình thành đúng ${sceneCount} giai đoạn với tiến độ: ${progressSteps.join('%, ')}%.
    2. CÁC GIAI ĐOẠN TRUNG GIAN (Dưới 100%): 
       - Phải nhắc đến việc đồ nội thất đang được lắp đặt dở dang.
       - Nhấn mạnh việc đưa các đồ đạc vào nhưng vẫn đang để lộn xộn, chưa ngăn nắp.
       - Đồ điện tử và đèn phải ghi rõ là "chưa lắp đặt" hoặc "chưa cắm điện", "màn hình tối đen".
    3. QUY TẮC ĐỒ DECOR: Các đồ decor trang trí nhỏ (bình hoa, gối, decor kệ, mô hình, giỏ hoa, cây cối...) TUYỆT ĐỐI chỉ xuất hiện hoặc mở hộp ở 85-100%. Các giai đoạn trước đó chúng phải được cất trong thùng carton trên sàn.
    
    Đầu ra: Trả về mảng JSON các chuỗi Tiếng Việt (mô tả chi tiết trạng thái thi công, dưới 200 ký tự mỗi đoạn).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { 
        parts: [
          { text: prompt },
          { inlineData: baseImagePart },
          { inlineData: finalGoalPart }
        ] 
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    });
    return JSON.parse(cleanJsonResponse(response.text || '[]'));
  } catch (error) {
    console.error("Lỗi tạo kịch bản timelapse:", error);
    return Array(sceneCount).fill("Giai đoạn thi công nội thất...");
  }
};

/**
 * Nhiệm vụ 2: Tạo hình ảnh trung gian - ÉP BUỘC THEO TIẾN ĐỘ % VÀ TRẠNG THÁI THI CÔNG THỰC TẾ.
 */
export const generateTimelapseImage = async (
  sceneDescription: string,
  baseImagePart: any,
  finalGoalPart: any,
  progress: number
): Promise<string> => {
  const ai = getAiClient();
  const modelId = "gemini-2.5-flash-image";

  const prompt = `
    NHIỆM VỤ: Tạo một hình ảnh "ĐANG THI CÔNG" cho video timelapse kiến trúc.
    TRẠNG THÁI: Hoàn thành ${progress}% so với ẢNH KẾT QUẢ (GOAL_STATE).
    
    CÁC QUY TẮC THỊ GIÁC NGHIÊM NGẶT CHO TIẾN ĐỘ (${progress}%):
    1. ĐỒNG BỘ CẤU TRÚC: Sử dụng ẢNH KẾT QUẢ làm bản thiết kế chuẩn xác tuyệt đối về vị trí đồ đạc.
    
    2. QUY TẮC "MẤT ĐIỆN" (BẮT BUỘC KHI TIẾN ĐỘ < 100%):
       - ĐÈN: Tất cả các thiết bị chiếu sáng (đèn trần, đèn LED, đèn bàn) PHẢI ĐƯỢC LẮP ĐẶT NHƯNG TUYỆT ĐỐI KHÔNG BẬT. Không có hiệu ứng phát sáng, không tỏa sáng.
       - MÀN HÌNH: Tất cả màn hình điện tử (máy tính, TV, Laptop) PHẢI TỐI ĐEN HOÀN TOÀN. Không hình nền, không màn hình đăng nhập.
       - Ánh sáng trong phòng CHỈ được lấy từ ánh sáng tự nhiên qua cửa sổ hoặc đèn công trường tạm thời.
    
    3. QUY TẮC "SẮP XẾP LỘN XỘN" (10% đồ nội thất lớn từ ẢNH KẾT QUẢ phải được BỌC trong tấm nilon bảo vệ, bạt xanh hoặc màng co trắng.
       - Việc che phủ phải trông giống như một công trường thực tế để tránh bụi.
    
    4. SẮP XẾP & ĐỒ DECOR: 
       - Đồ nội thất (sofa, bàn) có thể phải hơi lệch hoặc chưa ngay ngắn.
       - TUYỆT ĐỐI KHÔNG có đồ trang trí nhỏ (bình hoa, gối) cho đến khi đạt 90%.
       - Đặt 3-5 thùng carton nâu đóng kín trên sàn nhà.
    
    5. KHÓA CAMERA: Duy trì CHÍNH XÁC góc máy và phối cảnh của hình ảnh KẾT QUẢ.
    6. CHI TIẾT CỤ THỂ: "${sceneDescription}".
    
    PHONG CÁCH: Ảnh chụp kiến trúc cực kỳ chân thực, phong cách công trường thực tế, photorealistic, 4k.
    KHÔNG CÓ NGƯỜI, KHÔNG CÓ CHỮ, KHÔNG LỚP PHỦ, KHÔNG CÓ EFFECT.
  `;

  const contents: any[] = [
    { text: prompt },
    { inlineData: finalGoalPart },
    { inlineData: baseImagePart }
  ];

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts: contents },
      config: { imageConfig: { aspectRatio: "9:16" } }
    });
    
    const imgPart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (!imgPart) throw new Error("Tạo ảnh thất bại");
    return `data:image/png;base64,${imgPart.inlineData.data}`;
  } catch (error) {
    console.error("Lỗi tạo ảnh trung gian:", error);
    throw error;
  }
};

/**
 * Nhiệm vụ 3: Tạo kịch bản cho mô hình video VEO-3.
 */
export const generateTimelapseVideoPrompt = async (
  description: string,
  imageUrl: string,
  progress: number
): Promise<string> => {
  const ai = getAiClient();
  
  let specificInstruction = "";
  if (progress === 0) {
    // Logic cho cảnh hiện trạng (0%)
    specificInstruction = `
      HÀNH ĐỘNG BẮT BUỘC: Cảnh tập trung vào việc DỌN DẸP CẢI TẠO MẶT BẰNG.
      - Hiển thị 1 công nhân đang tích cực dọn dẹp xà bần, quét sàn nhà đầy bụi và di chuyển các vật liệu cũ.
      - Có bụi mịn trong không khí được chiếu sáng bởi ánh nắng mặt trời.
      - Môi trường trông thô sơ và trống trải.
      - CAMERA: Cố định 100% trên chân máy (static tripod shot).
    `;
  } else if (progress === 100) {
    // Logic cho cảnh kết quả (100%)
    specificInstruction = `
      HÀNH ĐỘNG BẮT BUỘC: Quay phim nghệ thuật (CINEMATIC REVEAL) không gian đã hoàn thiện.
      - Không có công nhân xuất hiện.
      - CHUYỂN ĐỘNG CAMERA: Camera di chuyển LIỀN MẠCH và CHẬM RÃI trong một chuyển động liên tục kéo dài 8 giây.
      - Sử dụng kết hợp xoay máy chậm (slow pan) và đẩy máy nhẹ (subtle push-in) để khoe các góc nhìn, vật liệu và ánh sáng hoàn hảo của thiết kế nội thất.
      - Hiển thị các đèn phát sáng và màn hình hoạt động như trong thiết kế cuối cùng.
    `;
  } else {
    // Logic cho các giai đoạn thi công trung gian
    specificInstruction = `
      HÀNH ĐỘNG BẮT BUỘC: Bao gồm 1 người mặc đồ thường ngày.
      - Họ đang bận rộn làm việc, dọn dẹp, sớn nửa, di chuyển từng một món đồ nội thất vào vị trí hoặc đang gỡ tấm nilon bảo vệ.
      - Căn phòng lộn xộn với các dụng cụ và tấm bạt bảo vệ.
      - CAMERA: Cố định 100% và KHÓA CHẶT (Tripod shot). KHÔNG pan, KHÔNG zoom.
    `;
  }

  const prompt = `
    Hãy tạo một lời nhắc (prompt) video VEO-3 chi tiết cho một cảnh timelapse chân thực dài 8 giây.
    MÔ TẢ CẢNH: ${description}.
    TIẾN ĐỘ: Đã hoàn thành ${progress}%.
    
    ${specificInstruction}
    
    KHÔNG DÙNG HIỆU ỨNG ĐẶC BIỆT: Tuyệt đối không có hoạt ảnh ma thuật hay tia neon.
    KHÔNG KHÍ: Chân thực cao cấp như tạp chí kiến trúc. Ánh sáng chuyên nghiệp.
    
    THÔNG SỐ KỸ THUẬT: 9:16, 4K, 60fps, photorealistic.
    YÊU CẦU ĐẦU RA: Trả về duy nhất 1 dòng bằng Tiếng Anh (English) để mô hình video hiểu rõ nhất. Không kèm nhãn hay tiêu đề.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { 
        parts: [
          { text: prompt },
          { inlineData: { mimeType: 'image/png', data: imageUrl.split(',')[1] } }
        ] 
      }
    });
    return response.text?.trim().replace(/\n/g, ' ') || "";
  } catch (error) {
    console.error("Lỗi tạo video prompt:", error);
    return "Construction workers in a realistic room, static camera, 4K.";
  }
};
