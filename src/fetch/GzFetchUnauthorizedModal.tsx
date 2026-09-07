import { useEffect, useRef, useSyncExternalStore, type FC } from 'react';
import { Modal } from '@chenhui996/gg-ui';

import {
  cancelUnauthorizedModal,
  completeUnauthorizedModal,
  confirmUnauthorizedModal,
  executeUnauthorizedAction,
  getUnauthorizedServerSnapshot,
  getUnauthorizedSnapshot,
  registerUnauthorizedModalHost,
  subscribeUnauthorized,
} from './unauthorized';

/** @deprecated 请使用 GzFetchFeedbackProvider 统一接入请求反馈。 */
const GzFetchUnauthorizedModal: FC = () => {
  const hostIdRef = useRef<symbol | undefined>(undefined);
  hostIdRef.current ??= Symbol('gz-fetch-unauthorized-modal-host');
  const hostId = hostIdRef.current;
  const snapshot = useSyncExternalStore(
    subscribeUnauthorized,
    getUnauthorizedSnapshot,
    getUnauthorizedServerSnapshot,
  );

  useEffect(() => registerUnauthorizedModalHost(hostId), [hostId]);

  if (snapshot.activeHostId !== hostId) {
    return null;
  }

  const handleConfirm = (): void => {
    const options = confirmUnauthorizedModal();
    if (options) {
      executeUnauthorizedAction(options);
    }
  };

  return (
    <Modal
      afterClose={completeUnauthorizedModal}
      cancelText='取消'
      closable
      okText='重新登录'
      open={snapshot.phase === 'open'}
      title={snapshot.options?.modalTitle}
      onCancel={cancelUnauthorizedModal}
      onOk={handleConfirm}
    >
      {snapshot.options?.modalMessage}
    </Modal>
  );
};

GzFetchUnauthorizedModal.displayName = 'GzFetchUnauthorizedModal';

export default GzFetchUnauthorizedModal;
