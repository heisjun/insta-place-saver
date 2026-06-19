import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import LoginGateDialog from "./LoginGateDialog";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

describe("LoginGateDialog", () => {
  beforeEach(() => {
    pushMock.mockClear();
  });

  it("open이 true이면 안내 문구가 보인다", () => {
    render(<LoginGateDialog open onOpenChange={() => {}} />);
    expect(
      screen.getByRole("heading", { name: /저장하려면 로그인이 필요해요/ })
    ).toBeInTheDocument();
    expect(screen.getByText(/자동으로 이 화면으로 돌아옵니다/)).toBeInTheDocument();
  });

  it("로그인 CTA 클릭 시 /login?next=/add 로 이동한다", async () => {
    const user = userEvent.setup();
    render(<LoginGateDialog open onOpenChange={() => {}} />);
    await user.click(screen.getByRole("button", { name: /로그인하고 저장하기/ }));
    expect(pushMock).toHaveBeenCalledWith("/login?next=%2Fadd");
  });

  it("나중에 클릭 시 onOpenChange(false)가 호출된다", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(<LoginGateDialog open onOpenChange={onOpenChange} />);
    await user.click(screen.getByRole("button", { name: /나중에/ }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
