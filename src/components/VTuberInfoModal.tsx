import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { VTuber } from "@vtuber-guessr/shared";
import {
  XMarkIcon,
  ChevronUpDownIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import {
  Combobox,
  ComboboxInput,
  ComboboxButton,
  ComboboxOptions,
  ComboboxOption,
} from "@headlessui/react";
import { vtubers } from "@vtuber-guessr/shared";
import { createPullRequest } from "@/services/github";
import { useGame } from "@/hooks/useGame";

interface VTuberInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  vtuber: VTuber;
  title?: string;
  actionButton?: {
    text: string;
    onClick: () => void;
    className?: string;
  };
}

export function VTuberInfoModal({
  isOpen,
  onClose,
  vtuber,
  title = "VTuber 信息",
  actionButton,
}: VTuberInfoModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedVtuber, setEditedVtuber] = useState<VTuber>(vtuber);
  const [newTag, setNewTag] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateVtuber } = useGame();
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

  const handleAddTag = (tag?: string) => {
    const tagToAdd = tag || newTag.trim();
    if (tagToAdd && editedVtuber) {
      // Check if tag already exists
      if (!editedVtuber.tags?.includes(tagToAdd)) {
        setEditedVtuber({
          ...editedVtuber,
          tags: [...(editedVtuber.tags || []), tagToAdd],
        });
      }
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

  const handleSave = async () => {
    if (!validateBirthDate(editedVtuber.birthDate)) {
      setError("生日格式错误，请输入格式为 x月y日 的日期");
      return;
    }
    if (!validateDebutDate(editedVtuber.debutDate)) {
      setError("出道时间格式错误，请输入格式为 YYYY-MM-DD 的日期");
      return;
    }

    // check any changes
    if (JSON.stringify(vtuber) === JSON.stringify(editedVtuber)) {
      setIsEditing(false);
      return;
    }

    updateVtuber(editedVtuber);

    try {
      setIsSubmitting(true);
      await createPullRequest(editedVtuber);
      setIsEditing(false);
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : "创建 PR 失败");
    } finally {
      setIsSubmitting(false);
    }
  };

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
                  className="text-lg font-medium leading-6 text-gray-900 flex justify-between items-center"
                >
                  <span>{title}</span>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </Dialog.Title>

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
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        />
                      ) : (
                        <span className="text-sm text-gray-900 font-normal">
                          {vtuber.name || "-"}
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
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        />
                      ) : (
                        <span className="text-sm text-gray-900 font-normal">
                          {vtuber.nameEN || "-"}
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
                            className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
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
                        {vtuber.agency || "-"}
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
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        >
                          <option value="不明">不明</option>
                          <option value="女">女</option>
                          <option value="男">男</option>
                        </select>
                      ) : (
                        <span className="text-sm text-gray-900 font-normal">
                          {vtuber.gender || "-"}
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
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        >
                          <option value="active">活动中</option>
                          <option value="inactive">休息中</option>
                          <option value="retired">已毕业</option>
                        </select>
                      ) : (
                        <span className="text-sm text-gray-900 font-normal">
                          {vtuber.status === "active"
                            ? "活动中"
                            : vtuber.status === "inactive"
                            ? "休息中"
                            : vtuber.status === "retired"
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
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        />
                      ) : (
                        <span className="text-sm text-gray-900 font-normal">
                          {vtuber.age || "-"}
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
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        />
                      ) : (
                        <span className="text-sm text-gray-900 font-normal">
                          {vtuber.birthDate || "-"}
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
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        />
                      ) : (
                        <span className="text-sm text-gray-900 font-normal">
                          {vtuber.debutDate || "-"}
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
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        />
                      ) : (
                        <span className="text-sm text-gray-900 font-normal">
                          {vtuber.height || "-"}
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
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        />
                      ) : (
                        <span className="text-sm text-gray-900 font-normal">
                          {vtuber.seiza || "-"}
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
                              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
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
                                      (
                                        editedVtuber?.hairColor || ""
                                      ).toLowerCase()
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
                          {vtuber.hairColor || "-"}
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
                              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
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
                                      (
                                        editedVtuber?.eyeColor || ""
                                      ).toLowerCase()
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
                          {vtuber.eyeColor || "-"}
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
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        rows={2}
                      />
                    ) : (
                      <span className="text-sm text-gray-900 font-normal">
                        {vtuber.description || "-"}
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
                      {(isEditing ? editedVtuber?.tags : vtuber.tags)?.map(
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
                            className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
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
                                tag
                                  .toLowerCase()
                                  .includes((newTag || "").toLowerCase())
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
                      {actionButton && (
                        <button
                          type="button"
                          className={`inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                            actionButton.className ||
                            "bg-purple-100 text-purple-900 hover:bg-purple-200 focus-visible:ring-purple-500"
                          }`}
                          onClick={actionButton.onClick}
                        >
                          {actionButton.text}
                        </button>
                      )}
                      <button
                        type="button"
                        className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                        onClick={() => {
                          setIsEditing(true);
                        }}
                      >
                        编辑信息
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                        onClick={() => {
                          setIsEditing(false);
                        }}
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
