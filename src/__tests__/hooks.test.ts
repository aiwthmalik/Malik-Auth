import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { useLocalStorage, useClickOutside } from '../lib/hooks';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return initial value when localStorage is empty', () => {
    const { result } = renderHook(() => useLocalStorage<string>('test-key', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('should return stored value from localStorage', () => {
    localStorage.setItem('test-key', JSON.stringify('stored-value'));
    const { result } = renderHook(() => useLocalStorage<string>('test-key', 'default'));
    expect(result.current[0]).toBe('stored-value');
  });

  it('should update localStorage when setValue is called', () => {
    const { result } = renderHook(() => useLocalStorage<string>('test-key', 'default'));
    act(() => {
      result.current[1]('new-value');
    });
    expect(result.current[0]).toBe('new-value');
    expect(JSON.parse(localStorage.getItem('test-key')!)).toBe('new-value');
  });

  it('should handle function updates', () => {
    const { result } = renderHook(() => useLocalStorage<number>('test-num', 0));
    act(() => {
      result.current[1]((prev) => prev + 5);
    });
    expect(result.current[0]).toBe(5);
  });

  it('should handle objects', () => {
    const { result } = renderHook(() => useLocalStorage<{ count: number }>('test-obj', { count: 0 }));
    act(() => {
      result.current[1]({ count: 42 });
    });
    expect(result.current[0]).toEqual({ count: 42 });
  });

  it('should handle localStorage errors gracefully', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Quota exceeded');
    });
    const { result } = renderHook(() => useLocalStorage<string>('test-key', 'default'));
    act(() => {
      result.current[1]('new-value');
    });
    expect(result.current[0]).toBe('new-value');
    spy.mockRestore();
  });
});

describe('useClickOutside', () => {
  it('should call handler when clicking outside the ref element', () => {
    const handler = vi.fn();
    const ref = { current: document.createElement('div') } as React.RefObject<HTMLDivElement>;
    document.body.appendChild(ref.current!);

    renderHook(() => useClickOutside(ref, handler));

    act(() => {
      const event = new MouseEvent('mousedown', { bubbles: true });
      document.body.dispatchEvent(event);
    });

    expect(handler).toHaveBeenCalledTimes(1);
    document.body.removeChild(ref.current!);
  });

  it('should not call handler when clicking inside the ref element', () => {
    const handler = vi.fn();
    const ref = { current: document.createElement('div') } as React.RefObject<HTMLDivElement>;
    document.body.appendChild(ref.current!);

    renderHook(() => useClickOutside(ref, handler));

    act(() => {
      const event = new MouseEvent('mousedown', { bubbles: true });
      ref.current!.dispatchEvent(event);
    });

    expect(handler).not.toHaveBeenCalled();
    document.body.removeChild(ref.current!);
  });

  it('should not call handler when disabled', () => {
    const handler = vi.fn();
    const ref = { current: document.createElement('div') } as React.RefObject<HTMLDivElement>;
    document.body.appendChild(ref.current!);

    renderHook(() => useClickOutside(ref, handler, false));

    act(() => {
      const event = new MouseEvent('mousedown', { bubbles: true });
      document.body.dispatchEvent(event);
    });

    expect(handler).not.toHaveBeenCalled();
    document.body.removeChild(ref.current!);
  });
});
