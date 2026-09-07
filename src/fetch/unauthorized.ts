import type { GzFetchUnauthorizedOptions } from './types';

export const DEFAULT_UNAUTHORIZED_LOGIN_URL = '/login';
export const DEFAULT_UNAUTHORIZED_MODAL_TITLE = '登录失效';
export const DEFAULT_UNAUTHORIZED_MODAL_MESSAGE =
  '当前登录状态已失效，请重新登录。';

export interface ResolvedUnauthorizedOptions {
  enabled: boolean;
  loginUrl: string;
  modalTitle: string;
  modalMessage: string;
  onUnauthorized?: () => void;
}

type UnauthorizedPhase = 'idle' | 'open' | 'closing';
type UnauthorizedListener = () => void;
type UnauthorizedModalHostId = symbol;

export interface UnauthorizedSnapshot {
  activeHostId?: UnauthorizedModalHostId;
  options?: ResolvedUnauthorizedOptions;
  phase: UnauthorizedPhase;
}

const IDLE_SNAPSHOT: UnauthorizedSnapshot = { phase: 'idle' };

let snapshot: UnauthorizedSnapshot = IDLE_SNAPSHOT;
const listeners = new Set<UnauthorizedListener>();
const modalHosts = new Set<UnauthorizedModalHostId>();

const emitChange = (): void => {
  for (const listener of listeners) {
    listener();
  }
};

const setSnapshot = (nextSnapshot: UnauthorizedSnapshot): void => {
  snapshot = nextSnapshot;
  emitChange();
};

export const resolveUnauthorizedOptions = (
  options?: GzFetchUnauthorizedOptions,
): ResolvedUnauthorizedOptions => ({
  enabled: options?.enabled ?? false,
  loginUrl: options?.loginUrl ?? DEFAULT_UNAUTHORIZED_LOGIN_URL,
  modalTitle: options?.modalTitle ?? DEFAULT_UNAUTHORIZED_MODAL_TITLE,
  modalMessage: options?.modalMessage ?? DEFAULT_UNAUTHORIZED_MODAL_MESSAGE,
  ...(options?.onUnauthorized === undefined
    ? {}
    : { onUnauthorized: options.onUnauthorized }),
});

export const getUnauthorizedSnapshot = (): UnauthorizedSnapshot => snapshot;

export const getUnauthorizedServerSnapshot = (): UnauthorizedSnapshot =>
  IDLE_SNAPSHOT;

export const subscribeUnauthorized = (
  listener: UnauthorizedListener,
): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const registerUnauthorizedModalHost = (
  hostId: UnauthorizedModalHostId,
): (() => void) => {
  modalHosts.add(hostId);
  if (snapshot.activeHostId === undefined) {
    setSnapshot({ ...snapshot, activeHostId: hostId });
  }

  return () => {
    modalHosts.delete(hostId);
    if (snapshot.activeHostId !== hostId) {
      return;
    }

    const nextHost = modalHosts.values().next();
    const nextHostId = nextHost.done ? undefined : nextHost.value;
    if (snapshot.phase === 'closing') {
      setSnapshot(
        nextHostId === undefined
          ? IDLE_SNAPSHOT
          : { activeHostId: nextHostId, phase: 'idle' },
      );
      return;
    }
    if (nextHostId === undefined) {
      setSnapshot(
        snapshot.options === undefined
          ? { phase: snapshot.phase }
          : { options: snapshot.options, phase: snapshot.phase },
      );
      return;
    }
    setSnapshot({ ...snapshot, activeHostId: nextHostId });
  };
};

export const openUnauthorizedModal = (
  options: ResolvedUnauthorizedOptions,
): boolean => {
  if (!options.enabled || snapshot.phase !== 'idle') {
    return false;
  }

  setSnapshot({
    ...(snapshot.activeHostId === undefined
      ? {}
      : { activeHostId: snapshot.activeHostId }),
    options,
    phase: 'open',
  });
  return true;
};

const beginCloseUnauthorizedModal = ():
  ResolvedUnauthorizedOptions | undefined => {
  if (snapshot.phase !== 'open' || snapshot.options === undefined) {
    return undefined;
  }

  const { options } = snapshot;
  setSnapshot({ ...snapshot, phase: 'closing' });
  return options;
};

export const cancelUnauthorizedModal = (): boolean =>
  beginCloseUnauthorizedModal() !== undefined;

export const confirmUnauthorizedModal = ():
  ResolvedUnauthorizedOptions | undefined => beginCloseUnauthorizedModal();

export const completeUnauthorizedModal = (): void => {
  if (snapshot.phase !== 'closing') {
    return;
  }

  setSnapshot(
    snapshot.activeHostId === undefined
      ? IDLE_SNAPSHOT
      : { activeHostId: snapshot.activeHostId, phase: 'idle' },
  );
};

export const executeUnauthorizedAction = (
  options: ResolvedUnauthorizedOptions,
  navigate: (loginUrl: string) => void = (loginUrl) =>
    window.location.assign(loginUrl),
): void => {
  if (options.onUnauthorized) {
    options.onUnauthorized();
    return;
  }

  navigate(options.loginUrl);
};

export const resetUnauthorizedManagerForTests = (): void => {
  modalHosts.clear();
  snapshot = IDLE_SNAPSHOT;
  emitChange();
};
