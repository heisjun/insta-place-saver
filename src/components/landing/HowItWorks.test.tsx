import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import HowItWorks from "./HowItWorks";

describe("HowItWorks", () => {
  it("3단계 모두 화면에 보인다 (URL 입력 / AI 추출 / 지도 저장)", () => {
    render(<HowItWorks />);
    expect(
      screen.getByRole("heading", { name: "어떻게 동작해요" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "URL 붙여넣기" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "AI가 정보 추출" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "지도에 저장" })
    ).toBeInTheDocument();
  });
});
