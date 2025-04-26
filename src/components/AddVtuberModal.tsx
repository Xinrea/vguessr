import { useState } from "react";
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  ChevronUpDownIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { VTuber, vtubers } from "@vtuber-guessr/shared";
import { Combobox } from "@headlessui/react";

interface AddVtuberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (vtuber: Omit<VTuber, "id">) => Promise<VTuber>;
  existingVtubers: VTuber[];
}

const AddVtuberModal: React.FC<AddVtuberModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  existingVtubers,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    avatar: "",
    name: "",
    nameEN: "",
    agency: "",
    gender: "不明" as "不明" | "男" | "女",
    birthDate: "",
    debutDate: "",
    height: 0,
    hairColor: "",
    eyeColor: "",
    seiza: "",
    description: "",
    age: 0,
    tags: "",
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateBirthDate(formData.birthDate)) {
      setError("生日格式不正确，请使用 X月Y日 格式");
      return;
    }

    if (!validateDebutDate(formData.debutDate)) {
      setError("出道时间格式不正确，请使用 YYYY-MM-DD 格式");
      return;
    }

    // 检查是否有重复的 VTuber
    const isDuplicate = existingVtubers.some(
      (v) => v.name === formData.name && v.nameEN === formData.nameEN
    );

    if (isDuplicate) {
      setError("已存在相同中文名和英文名的 VTuber，请检查后重试");
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit({
        ...formData,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      });
      onClose();
    } catch {
      setError("提交失败，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold">新增 VTuber</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-0.5">
                中文名
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-0.5">
                英文名
              </label>
              <input
                type="text"
                value={formData.nameEN}
                onChange={(e) =>
                  setFormData({ ...formData, nameEN: e.target.value })
                }
                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-0.5">
              所属公司/团体
            </label>
            <Combobox
              value={formData.agency}
              onChange={(value) =>
                setFormData({ ...formData, agency: value || "" })
              }
            >
              {({ open }) => (
                <div className="relative">
                  <Combobox.Input
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    required
                    onChange={(event) => {
                      const value = event.target.value;
                      setFormData({ ...formData, agency: value });
                    }}
                  />
                  <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronUpDownIcon
                      className="h-5 w-5 text-gray-400"
                      aria-hidden="true"
                    />
                  </Combobox.Button>
                  {open && (
                    <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                      {agencies
                        .filter((agency) =>
                          agency
                            .toLowerCase()
                            .includes(formData.agency.toLowerCase())
                        )
                        .map((agency) => (
                          <Combobox.Option
                            key={agency}
                            value={agency}
                            className={({ active }) =>
                              `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                active
                                  ? "bg-blue-600 text-white"
                                  : "text-gray-900"
                              }`
                            }
                          >
                            {({ selected, active }) => (
                              <>
                                <span
                                  className={`block truncate ${
                                    selected ? "font-medium" : "font-normal"
                                  }`}
                                >
                                  {agency}
                                </span>
                                {selected ? (
                                  <span
                                    className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                      active ? "text-white" : "text-blue-600"
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
                          </Combobox.Option>
                        ))}
                    </Combobox.Options>
                  )}
                </div>
              )}
            </Combobox>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-0.5">
                性别
              </label>
              <select
                value={formData.gender}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    gender: e.target.value as "男" | "女" | "不明",
                  })
                }
                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="不明">不明</option>
                <option value="女">女</option>
                <option value="男">男</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-0.5">
                年龄
              </label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) =>
                  setFormData({ ...formData, age: parseInt(e.target.value) })
                }
                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-0.5">
                生日
              </label>
              <input
                type="text"
                value={formData.birthDate}
                onChange={(e) =>
                  setFormData({ ...formData, birthDate: e.target.value })
                }
                placeholder="格式：x月y日"
                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-0.5">
                出道时间
              </label>
              <input
                type="text"
                value={formData.debutDate}
                onChange={(e) =>
                  setFormData({ ...formData, debutDate: e.target.value })
                }
                placeholder="格式：YYYY-MM-DD"
                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-0.5">
              身高
            </label>
            <input
              type="number"
              value={formData.height}
              onChange={(e) =>
                setFormData({ ...formData, height: parseInt(e.target.value) })
              }
              placeholder="单位：cm"
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-0.5">
                发色
              </label>
              <Combobox
                value={formData.hairColor}
                onChange={(value) =>
                  setFormData({ ...formData, hairColor: value || "" })
                }
              >
                {({ open }) => (
                  <div className="relative">
                    <Combobox.Input
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      required
                      onChange={(event) => {
                        const value = event.target.value;
                        setFormData({ ...formData, hairColor: value });
                      }}
                    />
                    <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronUpDownIcon
                        className="h-5 w-5 text-gray-400"
                        aria-hidden="true"
                      />
                    </Combobox.Button>
                    {open && (
                      <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                        {hairColors
                          .filter((color) =>
                            color
                              .toLowerCase()
                              .includes(formData.hairColor.toLowerCase())
                          )
                          .map((color) => (
                            <Combobox.Option
                              key={color}
                              value={color}
                              className={({ active }) =>
                                `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                  active
                                    ? "bg-blue-600 text-white"
                                    : "text-gray-900"
                                }`
                              }
                            >
                              {({ selected, active }) => (
                                <>
                                  <span
                                    className={`block truncate ${
                                      selected ? "font-medium" : "font-normal"
                                    }`}
                                  >
                                    {color}
                                  </span>
                                  {selected ? (
                                    <span
                                      className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                        active ? "text-white" : "text-blue-600"
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
                            </Combobox.Option>
                          ))}
                      </Combobox.Options>
                    )}
                  </div>
                )}
              </Combobox>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-0.5">
                瞳色
              </label>
              <Combobox
                value={formData.eyeColor}
                onChange={(value) =>
                  setFormData({ ...formData, eyeColor: value || "" })
                }
              >
                {({ open }) => (
                  <div className="relative">
                    <Combobox.Input
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      required
                      onChange={(event) => {
                        const value = event.target.value;
                        setFormData({ ...formData, eyeColor: value });
                      }}
                    />
                    <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronUpDownIcon
                        className="h-5 w-5 text-gray-400"
                        aria-hidden="true"
                      />
                    </Combobox.Button>
                    {open && (
                      <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                        {eyeColors
                          .filter((color) =>
                            color
                              .toLowerCase()
                              .includes(formData.eyeColor.toLowerCase())
                          )
                          .map((color) => (
                            <Combobox.Option
                              key={color}
                              value={color}
                              className={({ active }) =>
                                `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                  active
                                    ? "bg-blue-600 text-white"
                                    : "text-gray-900"
                                }`
                              }
                            >
                              {({ selected, active }) => (
                                <>
                                  <span
                                    className={`block truncate ${
                                      selected ? "font-medium" : "font-normal"
                                    }`}
                                  >
                                    {color}
                                  </span>
                                  {selected ? (
                                    <span
                                      className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                        active ? "text-white" : "text-blue-600"
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
                            </Combobox.Option>
                          ))}
                      </Combobox.Options>
                    )}
                  </div>
                )}
              </Combobox>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-0.5">
              星座
            </label>
            <input
              type="text"
              value={formData.seiza}
              onChange={(e) =>
                setFormData({ ...formData, seiza: e.target.value })
              }
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-0.5">
              描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-0.5">
              标签
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) =>
                setFormData({ ...formData, tags: e.target.value })
              }
              placeholder="用英文逗号分隔多个标签"
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                isLoading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isLoading ? "提交中..." : "提交"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddVtuberModal;
