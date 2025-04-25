import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { vtubers } from "@vtuber-guessr/shared";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: {
    excludedAgencies: string[];
    soundEnabled: boolean;
  };
  onUpdateSettings: (settings: {
    excludedAgencies: string[];
    soundEnabled: boolean;
  }) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  settings = { excludedAgencies: [], soundEnabled: true },
  onUpdateSettings,
}: SettingsModalProps) {
  // Get unique agencies from vtubers
  const agencies = Array.from(
    new Set(vtubers.map((v) => v.agency || "").filter(Boolean))
  ).sort();

  const handleAgencyToggle = (agency: string) => {
    const newExcludedAgencies = settings.excludedAgencies.includes(agency)
      ? settings.excludedAgencies.filter((a) => a !== agency)
      : [...settings.excludedAgencies, agency];

    onUpdateSettings({
      excludedAgencies: newExcludedAgencies,
      soundEnabled: settings.soundEnabled,
    });
  };

  const handleSoundToggle = () => {
    onUpdateSettings({
      ...settings,
      soundEnabled: !settings.soundEnabled,
    });
  };

  const handleClearUserInfo = () => {
    localStorage.removeItem("vtuber-guessr-user-id");
    localStorage.removeItem("vtuber-guessr-stats");
    localStorage.removeItem("vtuber-guessr-stats-pvp");
    window.location.reload();
  };

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
          <div className="fixed inset-0 bg-gray-500/30 backdrop-blur-[2px] transition-opacity" />
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white/95 backdrop-blur-sm px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 w-[95%] sm:w-full sm:max-w-lg sm:p-6 border border-gray-100">
                <div className="absolute right-0 top-0 pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 p-1"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon
                      className="h-5 w-5 sm:h-6 sm:w-6"
                      aria-hidden="true"
                    />
                  </button>
                </div>
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-semibold leading-6 text-gray-900 mb-4 sm:mb-6"
                    >
                      设置
                    </Dialog.Title>
                    <div className="mt-2 sm:mt-4">
                      <h4 className="text-base font-medium text-gray-900 mb-2 sm:mb-3">
                        启用的团体
                      </h4>
                      <div className="space-y-2 sm:space-y-3">
                        {agencies.map((agency) => (
                          <div key={agency} className="flex items-center">
                            <input
                              id={`agency-${agency}`}
                              name={`agency-${agency}`}
                              type="checkbox"
                              checked={
                                !settings.excludedAgencies.includes(agency)
                              }
                              onChange={() => handleAgencyToggle(agency)}
                              className="h-4 w-4 sm:h-5 sm:w-5 rounded-md border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500 transition-colors duration-200 ease-in-out"
                            />
                            <label
                              htmlFor={`agency-${agency}`}
                              className="ml-2 sm:ml-3 text-sm font-medium text-gray-700 hover:text-gray-900 cursor-pointer transition-colors duration-200 ease-in-out"
                            >
                              {agency} (
                              {
                                vtubers.filter((v) => v.agency === agency)
                                  .length
                              }
                              )
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-6">
                      <h4 className="text-base font-medium text-gray-900 mb-2 sm:mb-3">
                        音效设置
                      </h4>
                      <div className="flex items-center">
                        <input
                          id="sound-toggle"
                          name="sound-toggle"
                          type="checkbox"
                          checked={settings.soundEnabled}
                          onChange={handleSoundToggle}
                          className="h-4 w-4 sm:h-5 sm:w-5 rounded-md border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500 transition-colors duration-200 ease-in-out"
                        />
                        <label
                          htmlFor="sound-toggle"
                          className="ml-2 sm:ml-3 text-sm font-medium text-gray-700 hover:text-gray-900 cursor-pointer transition-colors duration-200 ease-in-out"
                        >
                          启用音效
                        </label>
                      </div>
                    </div>
                    <div className="mt-6 border-t border-gray-200 pt-4">
                      <button
                        onClick={handleClearUserInfo}
                        className="w-full rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 shadow-sm hover:bg-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                      >
                        清除用户信息
                      </button>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
