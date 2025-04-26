import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { VTuber, vtubers } from "@vtuber-guessr/shared";
import {
  XMarkIcon,
  ChevronUpDownIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { createPullRequest } from "@/services/github";
import { ConfettiEffect } from "./ConfettiEffect";
import {
  Combobox,
  ComboboxInput,
  ComboboxButton,
  ComboboxOptions,
  ComboboxOption,
} from "@headlessui/react";

interface GameOverModalProps {
  isOpen: boolean;
  onClose: () => void;
  answer: VTuber | null;
  onRestart: () => void;
  onUpdate: (vtuber: VTuber) => void;
  isCorrect: boolean;
}

export function GameOverModal({
  isOpen,
  onClose,
  answer,
  onRestart,
  onUpdate,
  isCorrect,
}: GameOverModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedVtuber, setEditedVtuber] = useState<VTuber | null>(null);
  const [newTag, setNewTag] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get all unique tags from vtubers data
  const allTags = Array.from(new Set(vtubers.flatMap((v) => v.tags))).sort();

  // Get unique values from vtubers data
  const agencies = Array.from(new Set(vtubers.map((v) => v.agency))).sort();
  const hairColors = Array.from(
    new Set(vtubers.map((v) => v.hairColor))
  ).sort();
  const eyeColors = Array.from(new Set(vtubers.map((v) => v.eyeColor))).sort();

  const validateBirthDate = (date: string): boolean => {
    const regex = /^\d{1,2}月\d{1,2}日$/;
    return regex.test(date);
  };

  const validateDebutDate = (date: string): boolean => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(date)) return false;

    const [year, month, day] = date.split("-").map(Number);
    const dateObj = new Date(year, month - 1, day);
    return (
      dateObj.getFullYear() === year &&
      dateObj.getMonth() === month - 1 &&
      dateObj.getDate() === day
    );
  };

  if (!answer) return null;

  const handleStartEditing = () => {
    setEditedVtuber({ ...answer });
    setIsEditing(true);
    setError(null);
  };

  const handleSave = async () => {
    if (!editedVtuber || !answer) return;

    if (!validateBirthDate(editedVtuber.birthDate)) {
      setError("生日格式不正确，请使用 X月Y日 格式");
      return;
    }

    if (!validateDebutDate(editedVtuber.debutDate)) {
      setError("出道时间格式不正确，请使用 YYYY-MM-DD 格式");
      return;
    }

    // Check if there are any changes
    const hasChanges = Object.keys(editedVtuber).some(
      (key) =>
        JSON.stringify(editedVtuber[key as keyof VTuber]) !==
        JSON.stringify(answer[key as keyof VTuber])
    );

    if (!hasChanges) {
      setIsEditing(false);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      onUpdate(editedVtuber);

      await createPullRequest(editedVtuber);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create PR");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEditedVtuber(null);
    setIsEditing(false);
    setError(null);
  };

  const handleClose = () => {
    handleCancel(); // Reset editing state and clear data
    onClose(); // Call the original onClose handler
  };

  const handleAddTag = (tag?: string) => {
    const tagToAdd = tag || newTag.trim();
    if (tagToAdd && editedVtuber) {
      setEditedVtuber({
        ...editedVtuber,
        tags: [...(editedVtuber.tags || []), tagToAdd],
      });
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (editedVtuber) {
      setEditedVtuber({
        ...editedVtuber,
        tags: editedVtuber.tags.filter((tag) => tag !== tagToRemove),
      });
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={handleClose}>
        {isOpen && isCorrect && <ConfettiEffect />}
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
              <Dialog.Panel
                className={`w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all ${
                  isCorrect
                    ? "ring-2 ring-green-400 ring-offset-2"
                    : "ring-2 ring-red-400 ring-offset-2"
                }`}
              >
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 flex justify-between items-center"
                >
                  <span>游戏结束！</span>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={handleClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </Dialog.Title>
                <div className="mt-1 text-sm text-gray-500">正确答案</div>
                <div className="mt-4 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-0.5">
                        中文名
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedVtuber?.name}
                          onChange={(e) =>
                            setEditedVtuber({
                              ...editedVtuber!,
                              name: e.target.value,
                            })
                          }
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <span className="text-sm text-gray-900 font-normal">
                          {answer.name || "-"}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-0.5">
                        英文名
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedVtuber?.nameEN}
                          onChange={(e) =>
                            setEditedVtuber({
                              ...editedVtuber!,
                              nameEN: e.target.value,
                            })
                          }
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <span className="text-sm text-gray-900 font-normal">
                          {answer.nameEN || "-"}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-0.5">
                      所属公司/团体
                    </label>
                    {isEditing ? (
                      <Combobox
                        value={editedVtuber?.agency}
                        onChange={(value) =>
                          setEditedVtuber({
                            ...editedVtuber!,
                            agency: value || "",
                          })
                        }
                      >
                        <div className="relative">
                          <ComboboxInput
                            className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            required
                            onChange={(event) => {
                              const value = event.target.value;
                              setEditedVtuber({
                                ...editedVtuber!,
                                agency: value,
                              });
                            }}
                          />
                          <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronUpDownIcon
                              className="h-5 w-5 text-gray-400"
                              aria-hidden="true"
                            />
                          </ComboboxButton>
                          <ComboboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                            {agencies
                              .filter((agency) =>
                                agency
                                  .toLowerCase()
                                  .includes(
                                    editedVtuber?.agency.toLowerCase() || ""
                                  )
                              )
                              .map((agency) => (
                                <ComboboxOption
                                  key={agency}
                                  value={agency}
                                  className={({ focus }) =>
                                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                      focus
                                        ? "bg-blue-600 text-white"
                                        : "text-gray-900"
                                    }`
                                  }
                                >
                                  {({ selected, focus }) => (
                                    <>
                                      <span
                                        className={`block truncate ${
                                          selected
                                            ? "font-medium"
                                            : "font-normal"
                                        }`}
                                      >
                                        {agency}
                                      </span>
                                      {selected ? (
                                        <span
                                          className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                            focus
                                              ? "text-white"
                                              : "text-blue-600"
                                          }`}
                                        >
                                          <CheckIcon
                                            className="h-5 w-5"
                                            aria-hidden="true"
                                          />
                                        </span>
                                      ) : null}
                                    </>
                                  )}
                                </ComboboxOption>
                              ))}
                          </ComboboxOptions>
                        </div>
                      </Combobox>
                    ) : (
                      <span className="text-sm text-gray-900 font-normal">
                        {answer.agency || "-"}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-0.5">
                        性别
                      </label>
                      {isEditing ? (
                        <select
                          value={editedVtuber?.gender}
                          onChange={(e) =>
                            setEditedVtuber({
                              ...editedVtuber!,
                              gender: e.target.value as "男" | "女" | "不明",
                            })
                          }
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="不明">不明</option>
                          <option value="女">女</option>
                          <option value="男">男</option>
                        </select>
                      ) : (
                        <span className="text-sm text-gray-900 font-normal">
                          {answer.gender || "-"}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-0.5">
                        状态
                      </label>
                      {isEditing ? (
                        <select
                          value={editedVtuber?.status}
                          onChange={(e) =>
                            setEditedVtuber({
                              ...editedVtuber!,
                              status: e.target.value as
                                | "active"
                                | "inactive"
                                | "retired",
                            })
                          }
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="active">活动中</option>
                          <option value="inactive">休息中</option>
                          <option value="retired">已毕业</option>
                        </select>
                      ) : (
                        <span className="text-sm text-gray-900 font-normal">
                          {answer.status === "active"
                            ? "活动中"
                            : answer.status === "inactive"
                            ? "休息中"
                            : answer.status === "retired"
                            ? "已毕业"
                            : "-"}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-0.5">
                        年龄
                      </label>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editedVtuber?.age}
                          onChange={(e) =>
                            setEditedVtuber({
                              ...editedVtuber!,
                              age: parseInt(e.target.value),
                            })
                          }
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <span className="text-sm text-gray-900 font-normal">
                          {answer.age || "-"}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-0.5">
                        生日
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedVtuber?.birthDate}
                          onChange={(e) =>
                            setEditedVtuber({
                              ...editedVtuber!,
                              birthDate: e.target.value,
                            })
                          }
                          placeholder="格式：x月y日"
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <span className="text-sm text-gray-900 font-normal">
                          {answer.birthDate || "-"}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-0.5">
                        出道时间
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedVtuber?.debutDate}
                          onChange={(e) =>
                            setEditedVtuber({
                              ...editedVtuber!,
                              debutDate: e.target.value,
                            })
                          }
                          placeholder="格式：YYYY-MM-DD"
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <span className="text-sm text-gray-900 font-normal">
                          {answer.debutDate || "-"}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-0.5">
                        身高
                      </label>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editedVtuber?.height}
                          onChange={(e) =>
                            setEditedVtuber({
                              ...editedVtuber!,
                              height: parseInt(e.target.value),
                            })
                          }
                          placeholder="单位：cm"
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <span className="text-sm text-gray-900 font-normal">
                          {answer.height || "-"}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-0.5">
                        星座
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedVtuber?.seiza}
                          onChange={(e) =>
                            setEditedVtuber({
                              ...editedVtuber!,
                              seiza: e.target.value,
                            })
                          }
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <span className="text-sm text-gray-900 font-normal">
                          {answer.seiza || "-"}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-0.5">
                        发色
                      </label>
                      {isEditing ? (
                        <Combobox
                          value={editedVtuber?.hairColor}
                          onChange={(value) =>
                            setEditedVtuber({
                              ...editedVtuber!,
                              hairColor: value || "",
                            })
                          }
                        >
                          <div className="relative">
                            <ComboboxInput
                              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              required
                              onChange={(event) => {
                                const value = event.target.value;
                                setEditedVtuber({
                                  ...editedVtuber!,
                                  hairColor: value,
                                });
                              }}
                            />
                            <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
                              <ChevronUpDownIcon
                                className="h-5 w-5 text-gray-400"
                                aria-hidden="true"
                              />
                            </ComboboxButton>
                            <ComboboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                              {hairColors
                                .filter((color) =>
                                  color
                                    .toLowerCase()
                                    .includes(
                                      editedVtuber?.hairColor.toLowerCase() ||
                                        ""
                                    )
                                )
                                .map((color) => (
                                  <ComboboxOption
                                    key={color}
                                    value={color}
                                    className={({ focus }) =>
                                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                        focus
                                          ? "bg-blue-600 text-white"
                                          : "text-gray-900"
                                      }`
                                    }
                                  >
                                    {({ selected, focus }) => (
                                      <>
                                        <span
                                          className={`block truncate ${
                                            selected
                                              ? "font-medium"
                                              : "font-normal"
                                          }`}
                                        >
                                          {color}
                                        </span>
                                        {selected ? (
                                          <span
                                            className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                              focus
                                                ? "text-white"
                                                : "text-blue-600"
                                            }`}
                                          >
                                            <CheckIcon
                                              className="h-5 w-5"
                                              aria-hidden="true"
                                            />
                                          </span>
                                        ) : null}
                                      </>
                                    )}
                                  </ComboboxOption>
                                ))}
                            </ComboboxOptions>
                          </div>
                        </Combobox>
                      ) : (
                        <span className="text-sm text-gray-900 font-normal">
                          {answer.hairColor || "-"}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-0.5">
                        瞳色
                      </label>
                      {isEditing ? (
                        <Combobox
                          value={editedVtuber?.eyeColor}
                          onChange={(value) =>
                            setEditedVtuber({
                              ...editedVtuber!,
                              eyeColor: value || "",
                            })
                          }
                        >
                          <div className="relative">
                            <ComboboxInput
                              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              required
                              onChange={(event) => {
                                const value = event.target.value;
                                setEditedVtuber({
                                  ...editedVtuber!,
                                  eyeColor: value,
                                });
                              }}
                            />
                            <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
                              <ChevronUpDownIcon
                                className="h-5 w-5 text-gray-400"
                                aria-hidden="true"
                              />
                            </ComboboxButton>
                            <ComboboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                              {eyeColors
                                .filter((color) =>
                                  color
                                    .toLowerCase()
                                    .includes(
                                      editedVtuber?.eyeColor.toLowerCase() || ""
                                    )
                                )
                                .map((color) => (
                                  <ComboboxOption
                                    key={color}
                                    value={color}
                                    className={({ focus }) =>
                                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                        focus
                                          ? "bg-blue-600 text-white"
                                          : "text-gray-900"
                                      }`
                                    }
                                  >
                                    {({ selected, focus }) => (
                                      <>
                                        <span
                                          className={`block truncate ${
                                            selected
                                              ? "font-medium"
                                              : "font-normal"
                                          }`}
                                        >
                                          {color}
                                        </span>
                                        {selected ? (
                                          <span
                                            className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                              focus
                                                ? "text-white"
                                                : "text-blue-600"
                                            }`}
                                          >
                                            <CheckIcon
                                              className="h-5 w-5"
                                              aria-hidden="true"
                                            />
                                          </span>
                                        ) : null}
                                      </>
                                    )}
                                  </ComboboxOption>
                                ))}
                            </ComboboxOptions>
                          </div>
                        </Combobox>
                      ) : (
                        <span className="text-sm text-gray-900 font-normal">
                          {answer.eyeColor || "-"}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-0.5">
                      描述
                    </label>
                    {isEditing ? (
                      <textarea
                        value={editedVtuber?.description}
                        onChange={(e) =>
                          setEditedVtuber({
                            ...editedVtuber!,
                            description: e.target.value,
                          })
                        }
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        rows={2}
                      />
                    ) : (
                      <span className="text-sm text-gray-900 font-normal">
                        {answer.description || "-"}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-0.5">
                      标签
                    </label>
                    {isEditing && (
                      <p className="text-sm text-gray-500 mb-2">
                        可以添加多个标签，从下拉列表中选择或输入自定义标签后按回车确认
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mb-2">
                      {(isEditing ? editedVtuber?.tags : answer.tags)?.map(
                        (tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                          >
                            {tag}
                            {isEditing && (
                              <button
                                type="button"
                                onClick={() => handleRemoveTag(tag)}
                                className="ml-1 text-blue-600 hover:text-blue-800"
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                            )}
                          </span>
                        )
                      )}
                    </div>
                    {isEditing && (
                      <Combobox
                        value={newTag}
                        onChange={(value: string) => {
                          setNewTag(value);
                        }}
                      >
                        <div className="relative">
                          <ComboboxInput
                            className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            placeholder=""
                            onChange={(event) => {
                              const value = event.target.value;
                              setNewTag(value);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && newTag.trim()) {
                                e.preventDefault();
                                handleAddTag();
                              }
                            }}
                          />
                          <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronUpDownIcon
                              className="h-5 w-5 text-gray-400"
                              aria-hidden="true"
                            />
                          </ComboboxButton>
                          <ComboboxOptions className="absolute z-10 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm bottom-full mb-1">
                            {allTags
                              .filter((tag) =>
                                tag.toLowerCase().includes(newTag.toLowerCase())
                              )
                              .slice(0, 20)
                              .map((tag) => (
                                <ComboboxOption
                                  key={tag}
                                  value={tag}
                                  className={({ focus }) =>
                                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                      focus
                                        ? "bg-blue-600 text-white"
                                        : "text-gray-900"
                                    }`
                                  }
                                  onClick={() => handleAddTag(tag)}
                                >
                                  {({ selected, focus }) => (
                                    <>
                                      <span
                                        className={`block truncate ${
                                          selected
                                            ? "font-medium"
                                            : "font-normal"
                                        }`}
                                      >
                                        {tag}
                                      </span>
                                      {selected ? (
                                        <span
                                          className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                            focus
                                              ? "text-white"
                                              : "text-blue-600"
                                          }`}
                                        >
                                          <CheckIcon
                                            className="h-5 w-5"
                                            aria-hidden="true"
                                          />
                                        </span>
                                      ) : null}
                                    </>
                                  )}
                                </ComboboxOption>
                              ))}
                          </ComboboxOptions>
                        </div>
                      </Combobox>
                    )}
                  </div>

                  {error && (
                    <div className="mt-2 text-sm text-red-600">{error}</div>
                  )}
                  {isEditing && (
                    <div className="mt-2 text-xs text-gray-500">
                      （变动将在审核后生效）
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end gap-2">
                  {!isEditing ? (
                    <>
                      <button
                        type="button"
                        className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                        onClick={handleStartEditing}
                      >
                        申请编辑
                      </button>
                      <button
                        type="button"
                        className="inline-flex justify-center rounded-md border border-transparent bg-purple-100 px-4 py-2 text-sm font-medium text-purple-900 hover:bg-purple-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
                        onClick={onRestart}
                      >
                        再来一局
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                        onClick={handleCancel}
                        disabled={isSubmitting}
                      >
                        取消
                      </button>
                      <button
                        type="button"
                        className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50"
                        onClick={handleSave}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "保存中..." : "保存"}
                      </button>
                    </>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
