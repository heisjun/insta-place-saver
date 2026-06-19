"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LoginGateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LoginGateDialog({ open, onOpenChange }: LoginGateDialogProps) {
  const router = useRouter();

  function handleLogin() {
    router.push(`/login?next=${encodeURIComponent("/add")}`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>저장하려면 로그인이 필요해요</DialogTitle>
          <DialogDescription>
            지금 분석한 정보는 안전하게 보관되어 있어요. 로그인 후 자동으로 이 화면으로 돌아옵니다.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            나중에
          </Button>
          <Button onClick={handleLogin}>로그인하고 저장하기</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
