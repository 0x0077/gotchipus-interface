"use client";

import { useTranslation } from "react-i18next";
import { MarkdownRenderer } from "../../markdown/MarkdownRenderer";
import type { Message } from "./types";

interface Props {
  user: Message;
  isStreaming: boolean;
  canEdit: boolean;
  onStartEdit: (m: Message) => void;
  // Inline edit mode — when editingMessageId === user.id, these drive the textarea:
  editing: boolean;
  editingDraft: string;
  onEditingDraftChange: (v: string) => void;
  onSubmitEdit: () => void;
  onCancelEdit: () => void;
}

/** User message row. Renders as either a tagged text line ("YOU · ...") with
 *  hover-revealed ✎ Edit, or — when `editing` is true — as an inline textarea
 *  with Cancel / Save buttons. Save is disabled when draft is empty or
 *  unchanged from the original. */
export function UserRow({
  user,
  isStreaming,
  canEdit,
  onStartEdit,
  editing,
  editingDraft,
  onEditingDraftChange,
  onSubmitEdit,
  onCancelEdit,
}: Props) {
  const { t } = useTranslation();

  if (editing) {
    return (
      <div className="rx-user msg-in">
        <div className="rx-user-label">{t("terminal.chat.youLabel")}</div>
        <div className="rx-edit-wrap">
          <textarea
            autoFocus
            value={editingDraft}
            rows={2}
            onChange={e => onEditingDraftChange(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Escape") {
                e.preventDefault();
                onCancelEdit();
              } else if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmitEdit();
              }
            }}
            aria-label={t("terminal.chat.editTooltip")}
          />
          <div className="rx-edit-row">
            <span className="rx-edit-hint">{t("terminal.chat.editHintBody")}</span>
            <button onClick={onCancelEdit}>{t("terminal.chat.editCancel")}</button>
            <button
              className="pri"
              onClick={onSubmitEdit}
              disabled={
                !editingDraft.trim() || editingDraft.trim() === user.content.trim()
              }
            >
              {t("terminal.chat.editSave")} ↵
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rx-user msg-in">
      <div className="rx-user-label">{t("terminal.chat.youLabel")}</div>
      <div className={`rx-user-body ${user.content.startsWith("/") ? "slash" : ""}`}>
        <span className={user.isStreaming ? "sc-l" : ""}>
          <MarkdownRenderer content={user.content} isStreaming={user.isStreaming || false} />
        </span>
      </div>
      {!user.isStreaming && canEdit && (
        <button
          className="rx-user-edit"
          onClick={() => onStartEdit(user)}
          disabled={isStreaming}
          title={t("terminal.chat.editTooltip")}
        >
          ✎ {t("terminal.chat.editHint")}
        </button>
      )}
    </div>
  );
}
