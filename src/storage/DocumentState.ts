import { dialogConfirm } from "../utils/DialogHelpers";

export interface DocumentStateSnapshot {
  dirty: boolean;
  autosaveAvailable: boolean;
}

const CHANGE_EVENT = "document-dirty-state-change";
let state: DocumentStateSnapshot = {
  dirty: false,
  autosaveAvailable: false,
};

function emit(): void {
  window.dispatchEvent(
    new CustomEvent<DocumentStateSnapshot>(CHANGE_EVENT, {
      detail: { ...state },
    })
  );
}

export function getDocumentState(): DocumentStateSnapshot {
  return { ...state };
}

export function markDocumentDirty(): void {
  if (state.dirty) return;
  state = { ...state, dirty: true };
  emit();
}

export function markDocumentSaved(): void {
  state = { dirty: false, autosaveAvailable: false };
  emit();
}

export function markDocumentAutosaved(): void {
  if (!state.dirty) return;
  state = { dirty: true, autosaveAvailable: true };
  emit();
}

export function resetDocumentState(dirty = false): void {
  state = { dirty, autosaveAvailable: false };
  emit();
}

export function onDocumentStateChange(
  listener: (snapshot: DocumentStateSnapshot) => void
): () => void {
  const handler = (event: Event) => {
    listener(
      (event as CustomEvent<DocumentStateSnapshot>).detail
    );
  };
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}

export async function confirmDocumentReplacement(
  action: string
): Promise<boolean> {
  if (!state.dirty) return true;
  const recoveryMessage = state.autosaveAvailable
    ? "Er is een automatische herstelkopie, maar deze wijzigingen zijn nog niet naar een gekozen opslaglocatie geschreven."
    : "Deze wijzigingen zijn nog niet opgeslagen en er is nog geen automatische herstelkopie.";
  return dialogConfirm(
    "Niet-opgeslagen wijzigingen",
    `${recoveryMessage} Wilt u ${action} en deze wijzigingen verlaten?`
  );
}
