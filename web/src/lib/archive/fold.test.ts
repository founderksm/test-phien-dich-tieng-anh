import { describe, expect, it } from "vitest";
import { buildSearchText, escapeLike, foldText } from "./fold";

describe("foldText", () => {
  it("bỏ dấu tiếng Việt và xử lý chữ đ", () => {
    expect(foldText("Độ bền màu")).toBe("do ben mau");
    expect(foldText("Đối soát")).toBe("doi soat");
    expect(foldText("Ủy thác xuất khẩu")).toBe("uy thac xuat khau");
  });

  it("giữ nguyên chữ Hán", () => {
    expect(foldText("色牢度")).toBe("色牢度");
  });

  it("chuẩn hóa chữ hoa và khoảng trắng", () => {
    expect(foldText("  MOQ   Minimum  ")).toBe("moq minimum");
  });

  it("giữ nguyên mã vải có ký tự #", () => {
    expect(foldText("Mã 9236# Trắng")).toBe("ma 9236# trang");
  });
});

describe("buildSearchText", () => {
  it("gộp nhiều ngôn ngữ và bỏ giá trị rỗng", () => {
    expect(buildSearchText("Độ bền màu", null, "Color fastness", "色牢度")).toBe(
      "do ben mau color fastness 色牢度",
    );
  });
});

describe("escapeLike", () => {
  it("thoát ký tự đặc biệt của LIKE", () => {
    expect(escapeLike("100%_a\\b")).toBe("100\\%\\_a\\\\b");
  });
});
