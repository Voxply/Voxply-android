import React from "react";
import type { Channel } from "../types";

interface Props {
  channel: Channel;
  description: string;
  onDescriptionChange: (v: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export function EditDescriptionModal({ channel, description, onDescriptionChange, onSave, onClose }: Props) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Edit description — #{channel.name}</h3>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="What's this channel for?"
          rows={4}
          autoFocus
        />
        <div className="modal-actions">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={onSave}>Save</button>
        </div>
      </div>
    </div>
  );
}
