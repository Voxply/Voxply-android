import React, { useEffect, useState } from "react";
import type { RecoverySettings, RotationRequest } from "../types";
import { formatRelative } from "../utils/format";

interface Props {
  hubUrl: string;
  publicKey: string | null;
  isAdmin: boolean;
}

export function RecoveryContactsSection({ hubUrl, publicKey, isAdmin }: Props) {
  const [settings, setSettings] = useState<RecoverySettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [newContact, setNewContact] = useState("");
  const [threshold, setThreshold] = useState(2);

  const [requestId, setRequestId] = useState("");
  const [requestStatus, setRequestStatus] = useState<RotationRequest | null>(null);
  const [oldPubkey, setOldPubkey] = useState("");
  const [reason, setReason] = useState("");
  const [openingRequest, setOpeningRequest] = useState(false);
  const [requestError, setRequestError] = useState("");

  const [attestRequestId, setAttestRequestId] = useState("");
  const [attesting, setAttesting] = useState(false);
  const [attestError, setAttestError] = useState("");
  const [attestResult, setAttestResult] = useState("");

  const [adminRequests, setAdminRequests] = useState<RotationRequest[]>([]);
  const [decidingId, setDecidingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
    if (isAdmin) fetchAdminRequests();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hubUrl, publicKey]);

  async function fetchSettings() {
    if (!publicKey) return;
    setLoading(true);
    try {
      const res = await fetch(`${hubUrl}/recovery/contacts`);
      if (res.status === 404) { setSettings({ threshold: 2, contacts: [] }); return; }
      if (!res.ok) return;
      const data: RecoverySettings = await res.json();
      setSettings(data);
      setThreshold(data.threshold);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  async function fetchAdminRequests() {
    try {
      const res = await fetch(`${hubUrl}/admin/recovery/requests`);
      if (!res.ok) return;
      const data: { requests: RotationRequest[] } = await res.json();
      setAdminRequests(data.requests ?? []);
    } catch { /* ignore */ }
  }

  async function save() {
    if (!settings) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${hubUrl}/recovery/contacts`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threshold, contacts: settings.contacts.map((c) => c.contact_pubkey) }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }

  function addContact() {
    if (!newContact.trim() || !settings) return;
    setSettings({ ...settings, contacts: [...settings.contacts, { contact_pubkey: newContact.trim(), created_at: Date.now() / 1000 }] });
    setNewContact("");
  }

  function removeContact(pubkey: string) {
    if (!settings) return;
    setSettings({ ...settings, contacts: settings.contacts.filter((c) => c.contact_pubkey !== pubkey) });
  }

  async function openRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!oldPubkey.trim() || !publicKey) return;
    setOpeningRequest(true);
    setRequestError("");
    try {
      const res = await fetch(`${hubUrl}/recovery/rotation-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ old_pubkey: oldPubkey.trim(), new_pubkey: publicKey, reason: reason.trim() || null }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: { id: string } = await res.json();
      setRequestId(data.id);
    } catch (e) {
      setRequestError(String(e));
    } finally {
      setOpeningRequest(false);
    }
  }

  async function checkRequestStatus() {
    if (!requestId) return;
    try {
      const res = await fetch(`${hubUrl}/recovery/rotation-request/${requestId}`);
      if (!res.ok) return;
      const data: RotationRequest = await res.json();
      setRequestStatus(data);
    } catch { /* ignore */ }
  }

  async function attest(e: React.FormEvent) {
    e.preventDefault();
    if (!attestRequestId.trim()) return;
    setAttesting(true);
    setAttestError("");
    try {
      const res = await fetch(`${hubUrl}/recovery/rotation-request/${attestRequestId.trim()}/attest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setAttestResult("Attestation submitted.");
    } catch (e) {
      setAttestError(String(e));
    } finally {
      setAttesting(false);
    }
  }

  async function decide(requestId: string, decision: "approve" | "reject") {
    setDecidingId(requestId);
    try {
      await fetch(`${hubUrl}/admin/recovery/requests/${requestId}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      await fetchAdminRequests();
    } catch { /* ignore */ } finally {
      setDecidingId(null);
    }
  }

  return (
    <div className="recovery-contacts-section">
      <div className="settings-section">
        <label className="settings-label">Recovery contacts</label>
        <p className="muted">
          If you lose your key, these people can vouch to this hub's admins that a new key is you.
          They cannot take over your account — an admin still decides.
          Set this up <strong>before</strong> you lose your key.
        </p>
        {loading && <p className="muted">Loading…</p>}
        {settings && (
          <>
            <div className="settings-row" style={{ marginBottom: 8 }}>
              <label>Threshold (contacts needed):</label>
              <input
                type="number"
                min={1}
                max={settings.contacts.length || 1}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                style={{ width: 60 }}
              />
            </div>
            {settings.contacts.map((c) => (
              <div key={c.contact_pubkey} className="settings-row">
                <span className="muted">{c.contact_pubkey.slice(0, 20)}…</span>
                <button className="btn-danger btn-small" onClick={() => removeContact(c.contact_pubkey)}>Remove</button>
              </div>
            ))}
            <div style={{ marginTop: 8 }}>
              <input
                type="text"
                value={newContact}
                onChange={(e) => setNewContact(e.target.value)}
                placeholder="Contact's pubkey"
              />
              <button className="btn-secondary" onClick={addContact} style={{ marginTop: 6 }}>Add contact</button>
            </div>
            {error && <p className="error-text">{error}</p>}
            <button className="btn-primary" onClick={save} disabled={saving} style={{ marginTop: 10 }}>
              {saving ? "Saving…" : "Save contacts"}
            </button>
          </>
        )}
      </div>

      <div className="settings-section">
        <label className="settings-label">Recover my standing (lost key)</label>
        <p className="muted">Use this if you have lost your old key and need to transfer standing to your current key.</p>
        <form onSubmit={openRequest}>
          <input
            type="text"
            value={oldPubkey}
            onChange={(e) => setOldPubkey(e.target.value)}
            placeholder="Old (lost) public key"
            style={{ marginBottom: 6 }}
          />
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional)"
            style={{ marginBottom: 8 }}
          />
          {requestError && <p className="error-text">{requestError}</p>}
          {requestId && (
            <div>
              <p className="muted">Request opened. Share this ID with your contacts out-of-band:</p>
              <code className="pubkey-display">{requestId}</code>
              <button type="button" className="btn-secondary" onClick={checkRequestStatus} style={{ marginTop: 6 }}>
                Check status
              </button>
              {requestStatus && (
                <p className="muted">Status: {requestStatus.status} ({requestStatus.attestation_count} attestation{requestStatus.attestation_count !== 1 ? "s" : ""})</p>
              )}
            </div>
          )}
          {!requestId && (
            <button type="submit" className="btn-secondary" disabled={openingRequest || !oldPubkey.trim()}>
              {openingRequest ? "Opening…" : "Open recovery request"}
            </button>
          )}
        </form>
      </div>

      <div className="settings-section">
        <label className="settings-label">Vouch for a contact's recovery</label>
        <p className="muted">If someone sent you a recovery request ID, review and attest here.</p>
        <form onSubmit={attest}>
          <input
            type="text"
            value={attestRequestId}
            onChange={(e) => setAttestRequestId(e.target.value)}
            placeholder="Recovery request ID"
          />
          {attestError && <p className="error-text">{attestError}</p>}
          {attestResult && <p className="muted">{attestResult}</p>}
          <button type="submit" className="btn-secondary" disabled={attesting || !attestRequestId.trim()} style={{ marginTop: 6 }}>
            {attesting ? "Submitting…" : "Attest"}
          </button>
        </form>
      </div>

      {isAdmin && adminRequests.length > 0 && (
        <div className="settings-section">
          <label className="settings-label">Recovery requests (admin review)</label>
          {adminRequests.map((r) => (
            <div key={r.id} className="settings-row recovery-request-row">
              <div>
                <div>Old key: <code>{r.old_pubkey.slice(0, 16)}…</code></div>
                <div>New key: <code>{r.new_pubkey.slice(0, 16)}…</code></div>
                <div className="muted">{r.attestation_count} attestation(s) — {formatRelative(r.created_at)}</div>
                {r.reason && <div className="muted">Reason: {r.reason}</div>}
              </div>
              <div>
                <button
                  className="btn-primary btn-small"
                  onClick={() => decide(r.id, "approve")}
                  disabled={decidingId === r.id}
                >
                  Approve
                </button>
                <button
                  className="btn-danger btn-small"
                  onClick={() => decide(r.id, "reject")}
                  disabled={decidingId === r.id}
                  style={{ marginLeft: 6 }}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
