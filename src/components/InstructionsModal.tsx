import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InstructionsModal({
  isOpen,
  onClose,
}: InstructionsModalProps) {
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={onClose}
                  >
                    <span className="sr-only">关闭</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 sm:mt-0 sm:text-left w-full">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-semibold leading-6 text-gray-900 mb-4"
                    >
                      游戏玩法说明
                    </Dialog.Title>
                    <div className="mt-2 space-y-4 text-sm text-gray-500">
                      <p>1. 系统会随机选择一个 VTuber 作为目标</p>
                      <p>2. 你有 6 次机会猜测目标 VTuber</p>
                      <p>
                        3. 每次猜测后，系统会显示你的猜测与目标 VTuber 的差异：
                      </p>
                      <ul className="list-disc pl-4 space-y-2">
                        <li>
                          <span className="bg-green-50 text-green-700 border-2 border-green-400 rounded-md animate-pulse-subtle px-1">
                            绿色
                          </span>
                          表示匹配
                        </li>
                        <li>
                          <span className="bg-red-50 text-red-700 border border-red-200 rounded-full px-1">
                            红色
                          </span>
                          表示不匹配
                        </li>
                        <li>
                          <span className="flex items-center">
                            <ArrowUpIcon className="w-3 h-3 ml-1" />
                            表示正确答案比这个大
                          </span>
                        </li>
                        <li>
                          <span className="flex items-center">
                            <ArrowDownIcon className="w-3 h-3 ml-1" />
                            表示正确答案比这个小
                          </span>
                        </li>
                      </ul>
                      <p>
                        4. 标签部分数据还不完善，不匹配并不能完全排除，仅作参考
                      </p>
                      <p>
                        5. 根据这些提示，你可以逐步缩小范围，找到正确的 VTuber
                      </p>
                      <p>6. 如果 6 次内猜中，你就赢了！否则游戏结束</p>
                      <p>
                        PVP
                        说明：双方各有五次机会，共有五轮时间进行猜测，每轮限时
                        25s；每轮机会不使用也会被自动消耗，请注意时间；玩家也可以在一轮时间内选择消耗多次机会进行多次猜测。
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                    onClick={onClose}
                  >
                    关闭
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
