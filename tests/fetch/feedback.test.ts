import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  registerFeedbackHost,
  resetFeedbackManagerForTests,
  showFetchErrorMessage,
} from '../../src/fetch/feedback';

const mocks = vi.hoisted(() => ({
  staticMessageError: vi.fn(),
}));

vi.mock('@chenhui996/gg-ui', () => ({
  message: {
    error: mocks.staticMessageError,
  },
}));

beforeEach(() => {
  mocks.staticMessageError.mockReset();
  resetFeedbackManagerForTests();
});

describe('feedback manager', () => {
  it('uses the contextual host when one is registered', () => {
    const showErrorMessage = vi.fn();
    registerFeedbackHost(Symbol('host'), { showErrorMessage });

    showFetchErrorMessage('请求失败');

    expect(showErrorMessage).toHaveBeenCalledWith('请求失败');
    expect(mocks.staticMessageError).not.toHaveBeenCalled();
  });

  it('falls back to the static message for projects without a provider', () => {
    showFetchErrorMessage('网络异常');

    expect(mocks.staticMessageError).toHaveBeenCalledWith('网络异常');
  });

  it('moves to the next host and restores fallback after hosts unmount', () => {
    const firstHost = vi.fn();
    const secondHost = vi.fn();
    const unregisterFirst = registerFeedbackHost(Symbol('first'), {
      showErrorMessage: firstHost,
    });
    const unregisterSecond = registerFeedbackHost(Symbol('second'), {
      showErrorMessage: secondHost,
    });

    showFetchErrorMessage('first');
    unregisterFirst();
    showFetchErrorMessage('second');
    unregisterSecond();
    showFetchErrorMessage('fallback');

    expect(firstHost).toHaveBeenCalledWith('first');
    expect(secondHost).toHaveBeenCalledWith('second');
    expect(mocks.staticMessageError).toHaveBeenCalledWith('fallback');
  });
});
