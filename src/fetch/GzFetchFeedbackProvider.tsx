import { message } from '@chenhui996/gg-ui';
import {
  useCallback,
  useEffect,
  useRef,
  type FC,
  type PropsWithChildren,
} from 'react';

import { registerFeedbackHost } from './feedback';
import GzFetchUnauthorizedModal from './GzFetchUnauthorizedModal';

const GzFetchFeedbackProvider: FC<PropsWithChildren> = ({ children }) => {
  const hostIdRef = useRef<symbol | undefined>(undefined);
  hostIdRef.current ??= Symbol('gz-fetch-feedback-host');
  const hostId = hostIdRef.current;
  const [messageApi, messageContextHolder] = message.useMessage();
  const showErrorMessage = useCallback(
    (content: string): void => {
      void messageApi.error(content);
    },
    [messageApi],
  );

  useEffect(
    () => registerFeedbackHost(hostId, { showErrorMessage }),
    [hostId, showErrorMessage],
  );

  return (
    <>
      {messageContextHolder}
      <GzFetchUnauthorizedModal />
      {children}
    </>
  );
};

GzFetchFeedbackProvider.displayName = 'GzFetchFeedbackProvider';

export default GzFetchFeedbackProvider;
