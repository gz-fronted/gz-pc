import { message } from '@chenhui996/gg-ui';

type FeedbackHostId = symbol;
type ShowErrorMessage = (content: string) => void;

interface FeedbackHost {
  showErrorMessage: ShowErrorMessage;
}

const feedbackHosts = new Map<FeedbackHostId, FeedbackHost>();
let activeHostId: FeedbackHostId | undefined;

export const registerFeedbackHost = (
  hostId: FeedbackHostId,
  host: FeedbackHost,
): (() => void) => {
  feedbackHosts.set(hostId, host);
  activeHostId ??= hostId;

  return () => {
    feedbackHosts.delete(hostId);
    if (activeHostId !== hostId) {
      return;
    }

    const nextHost = feedbackHosts.keys().next();
    activeHostId = nextHost.done ? undefined : nextHost.value;
  };
};

export const showFetchErrorMessage = (content: string): void => {
  const activeHost =
    activeHostId === undefined ? undefined : feedbackHosts.get(activeHostId);
  if (activeHost) {
    activeHost.showErrorMessage(content);
    return;
  }

  message.error(content);
};

export const resetFeedbackManagerForTests = (): void => {
  feedbackHosts.clear();
  activeHostId = undefined;
};
