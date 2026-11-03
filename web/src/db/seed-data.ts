export const NEGOTIATION_VI_SUPPLEMENT: Record<string, string> = {
  "Giá tốt cho đơn lớn": "Đây là đơn sản xuất số lượng lớn nên tôi cần giá cạnh tranh.",
  "Xin giá xưởng": "Vui lòng báo giá xuất xưởng tốt nhất cho tôi theo số lượng này.",
  "Hợp tác lâu dài":
    "Nếu chất lượng và giá phù hợp, tôi sẽ tiếp tục đặt hàng thường xuyên với bạn.",
  "Gửi mẫu trước khi đặt số lượng lớn":
    "Tôi muốn kiểm tra mẫu trước. Nếu mọi thứ phù hợp, tôi sẽ đặt đơn số lượng lớn.",
  "Yêu cầu kiểm tra kỹ trước khi gửi":
    "Vui lòng kiểm tra kỹ chất lượng trước khi giao hàng để tránh lặp lại cùng một vấn đề.",
};

export interface SupplementTerm {
  vi: string;
  en: string;
  zh: string;
  abbreviation: string;
  scope: "spec";
}

export const FIBER_TERMS: SupplementTerm[] = [
  { vi: "Nylon", en: "Nylon", zh: "锦纶 / 尼龙", abbreviation: "N", scope: "spec" },
  { vi: "Polyester", en: "Polyester", zh: "涤纶", abbreviation: "P", scope: "spec" },
  { vi: "Spandex", en: "Spandex", zh: "氨纶", abbreviation: "SP", scope: "spec" },
];
