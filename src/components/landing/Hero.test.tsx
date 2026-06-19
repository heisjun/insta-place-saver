import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Hero from "./Hero";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

describe("Hero", () => {
  beforeEach(() => {
    pushMock.mockClear();
  });

  it("헤드라인과 CTA 버튼이 렌더된다", () => {
    render(<Hero />);
    expect(
      screen.getByRole("heading", { name: /지도에 옮겨 담아요/ })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /가게 찾기/ })).toBeInTheDocument();
  });

  it("URL 입력 후 제출하면 /add?url=로 라우팅된다", async () => {
    const user = userEvent.setup();
    render(<Hero />);

    const input = screen.getByLabelText(/인스타그램 게시글 URL/);
    await user.type(input, "https://www.instagram.com/p/CxYz");

    const submit = screen.getByRole("button", { name: /가게 찾기/ });
    await user.click(submit);

    expect(pushMock).toHaveBeenCalledWith(
      "/add?url=https%3A%2F%2Fwww.instagram.com%2Fp%2FCxYz"
    );
  });

  it("빈 URL이면 제출 버튼이 비활성화된다", () => {
    render(<Hero />);
    expect(screen.getByRole("button", { name: /가게 찾기/ })).toBeDisabled();
  });
});
