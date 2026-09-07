import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  cancelUnauthorizedModal,
  completeUnauthorizedModal,
  confirmUnauthorizedModal,
  executeUnauthorizedAction,
  getUnauthorizedSnapshot,
  openUnauthorizedModal,
  registerUnauthorizedModalHost,
  resetUnauthorizedManagerForTests,
  resolveUnauthorizedOptions,
} from '../../src/fetch/unauthorized';

beforeEach(() => {
  resetUnauthorizedManagerForTests();
});

describe('unauthorized manager', () => {
  it('uses disabled public defaults', () => {
    expect(resolveUnauthorizedOptions()).toEqual({
      enabled: false,
      loginUrl: '/login',
      modalTitle: '登录失效',
      modalMessage: '当前登录状态已失效，请重新登录。',
    });
  });

  it('resolves all public overrides without requiring a callback', () => {
    expect(
      resolveUnauthorizedOptions({
        enabled: true,
        loginUrl: '/sso/login',
        modalTitle: '认证失效',
        modalMessage: '请重新认证。',
      }),
    ).toEqual({
      enabled: true,
      loginUrl: '/sso/login',
      modalTitle: '认证失效',
      modalMessage: '请重新认证。',
    });
  });

  it('allows only one open flow and one active modal host', () => {
    const firstHost = Symbol('first-host');
    const secondHost = Symbol('second-host');
    const unregisterFirstHost = registerUnauthorizedModalHost(firstHost);
    const unregisterSecondHost = registerUnauthorizedModalHost(secondHost);
    const options = resolveUnauthorizedOptions({ enabled: true });

    expect(openUnauthorizedModal(options)).toBe(true);
    expect(openUnauthorizedModal(options)).toBe(false);
    expect(getUnauthorizedSnapshot()).toMatchObject({
      activeHostId: firstHost,
      phase: 'open',
    });

    unregisterFirstHost();
    expect(getUnauthorizedSnapshot().activeHostId).toBe(secondHost);
    unregisterSecondHost();
  });

  it('releases after close and can open a later independent flow', () => {
    const options = resolveUnauthorizedOptions({ enabled: true });

    expect(openUnauthorizedModal(options)).toBe(true);
    expect(cancelUnauthorizedModal()).toBe(true);
    expect(getUnauthorizedSnapshot().phase).toBe('closing');
    expect(openUnauthorizedModal(options)).toBe(false);

    completeUnauthorizedModal();
    expect(getUnauthorizedSnapshot().phase).toBe('idle');
    expect(openUnauthorizedModal(options)).toBe(true);
  });

  it('executes a custom unauthorized callback once and skips navigation', () => {
    const onUnauthorized = vi.fn();
    const navigate = vi.fn();
    const options = resolveUnauthorizedOptions({
      enabled: true,
      loginUrl: '/ignored',
      onUnauthorized,
    });
    openUnauthorizedModal(options);

    const confirmedOptions = confirmUnauthorizedModal();
    const duplicateConfirmation = confirmUnauthorizedModal();
    if (confirmedOptions) {
      executeUnauthorizedAction(confirmedOptions, navigate);
    }

    expect(duplicateConfirmation).toBeUndefined();
    expect(onUnauthorized).toHaveBeenCalledOnce();
    expect(navigate).not.toHaveBeenCalled();
  });

  it.each([
    [undefined, '/login'],
    ['/custom-login', '/custom-login'],
  ])('navigates to the resolved login URL %s', (loginUrl, expectedUrl) => {
    const navigate = vi.fn();
    const options = resolveUnauthorizedOptions({
      enabled: true,
      ...(loginUrl === undefined ? {} : { loginUrl }),
    });

    executeUnauthorizedAction(options, navigate);

    expect(navigate).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith(expectedUrl);
  });
});
