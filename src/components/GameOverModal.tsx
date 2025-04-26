import { Fragment } from "react";
import { Transition } from "@headlessui/react";
import { VTuber } from "@vtuber-guessr/shared";
import { ConfettiEffect } from "./ConfettiEffect";
import { VTuberInfoModal } from "./VTuberInfoModal";

interface GameOverModalProps {
  isOpen: boolean;
  onClose: () => void;
  answer: VTuber | null;
  onRestart: () => void;
  isCorrect: boolean;
}

export function GameOverModal({
  isOpen,
  onClose,
  answer,
  onRestart,
  isCorrect,
}: GameOverModalProps) {
  if (!answer) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      {isOpen && isCorrect && <ConfettiEffect />}
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <VTuberInfoModal
            isOpen={isOpen}
            onClose={onClose}
            vtuber={answer}
            title="游戏结束！"
            actionButton={{
              text: "再来一局",
              onClick: onRestart,
              className:
                "bg-purple-100 text-purple-900 hover:bg-purple-200 focus-visible:ring-purple-500",
            }}
          />
        </div>
      </div>
    </Transition>
  );
}
