import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { VTuber } from "@/types/vtuber";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { createPullRequest } from "@/services/github";
import { ConfettiEffect } from "./ConfettiEffect";

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

  if (!answer) return null;

  const handleStartEditing = () => {
    setEditedVtuber({ ...answer });
    setIsEditing(true);
    setError(null);
  };

  const handleSave = async () => {
    if (!editedVtuber || !answer) return;

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
      // 1. 更新本地数据
      onUpdate(editedVtuber);

      // 2. 创建 GitHub PR
      const token = process.env.PR_TOKEN;
      if (!token) {
        throw new Error("GitHub token not found. Please login first.");
      }

      await createPullRequest(editedVtuber, token);
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

  const handleAddTag = () => {
    if (newTag.trim() && editedVtuber) {
      setEditedVtuber({
        ...editedVtuber,
        tags: [...(editedVtuber.tags || []), newTag.trim()],
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

  const renderEditableField = (
    label: string,
    value: string | number | undefined,
    field: keyof VTuber
  ) => (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500">{label}:</span>
      {isEditing ? (
        <input
          type="text"
          value={editedVtuber?.[field] as string}
          onChange={(e) =>
            setEditedVtuber({
              ...editedVtuber!,
              [field]: e.target.value,
            })
          }
          className="flex-1 px-2 py-1 text-sm border rounded text-gray-900 bg-white"
        />
      ) : (
        <span className="text-sm text-gray-900">{value || "-"}</span>
      )}
    </div>
  );

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
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
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  游戏结束！
                </Dialog.Title>
                <div className="mt-1 text-sm text-gray-500">正确答案</div>
                <div className="mt-4 space-y-2">
                  {renderEditableField("名字", answer.name, "name")}
                  {renderEditableField(
                    "出道日期",
                    answer.debutDate,
                    "debutDate"
                  )}
                  {renderEditableField("所属公司", answer.agency, "agency")}
                  {renderEditableField("生日", answer.birthDate, "birthDate")}
                  {renderEditableField("身高", answer.height, "height")}
                  {renderEditableField("发色", answer.hairColor, "hairColor")}
                  {renderEditableField("瞳色", answer.eyeColor, "eyeColor")}
                  {renderEditableField("星座", answer.seiza, "seiza")}

                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">标签:</span>
                      {isEditing && (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder="添加新标签"
                            className="flex-1 px-2 py-1 text-sm border rounded text-gray-900 bg-white"
                          />
                          <button
                            onClick={handleAddTag}
                            className="p-1 text-blue-500 hover:text-blue-600"
                          >
                            <PlusIcon className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(isEditing ? editedVtuber?.tags : answer.tags)?.map(
                        (tag) => (
                          <div
                            key={tag}
                            className="flex items-center gap-1 px-2 py-1 text-sm bg-gray-100 rounded-full text-gray-900"
                          >
                            <span>{tag}</span>
                            {isEditing && (
                              <button
                                onClick={() => handleRemoveTag(tag)}
                                className="text-gray-500 hover:text-gray-700"
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )
                      )}
                    </div>
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
