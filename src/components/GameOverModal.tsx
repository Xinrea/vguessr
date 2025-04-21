import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { VTuber } from "@/types/vtuber";

interface GameOverModalProps {
  isOpen: boolean;
  onClose: () => void;
  answer: VTuber | null;
  onRestart: () => void;
}

export function GameOverModal({
  isOpen,
  onClose,
  answer,
  onRestart,
}: GameOverModalProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  游戏结束！
                </Dialog.Title>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    正确答案是: {answer?.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    出道日期: {answer?.debutDate}
                  </p>
                  <p className="text-sm text-gray-500">
                    所属公司: {answer?.agency}
                  </p>
                  <p className="text-sm text-gray-500">
                    生日: {answer?.birthDate}
                  </p>
                  <p className="text-sm text-gray-500">
                    身高: {answer?.height}
                  </p>
                  <p className="text-sm text-gray-500">
                    发色: {answer?.hairColor}
                  </p>
                  <p className="text-sm text-gray-500">
                    瞳色: {answer?.eyeColor}
                  </p>
                  <p className="text-sm text-gray-500">星座: {answer?.seiza}</p>
                  <p className="text-sm text-gray-500">
                    标签: {answer?.tags.join(", ")}
                  </p>
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-purple-100 px-4 py-2 text-sm font-medium text-purple-900 hover:bg-purple-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
                    onClick={onRestart}
                  >
                    再来一局
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
