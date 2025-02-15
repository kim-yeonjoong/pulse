import { describe, it, vi } from 'vitest';
import ora from 'ora';
import { getSpinnerInstance } from './spinner'; // 파일 경로를 실제로 맞게 조정하세요.

vi.mock('ora', () => {
  return {
    default: vi.fn<() => void>(() => ({})),
  };
});

describe.concurrent('getSpinnerInstance', () => {
  // 생성된 인스턴스가 없다면 새로 생성해야 한다
  it('should return a new spinner instance if one does not already exist', ({
    expect,
  }) => {
    expect.assertions(2);

    const instance = getSpinnerInstance();

    expect(ora).toHaveBeenCalledWith({
      prefixText: '[PULSE]',
      spinner: 'dots',
    });
    expect(instance).toBeDefined();
  });

  // 기존에 생성한 인스턴스가 있다면 새로 생성하지 않아야 한다
  // at now, ora always return same instance
  it('should return the same spinner instance on subsequent calls', ({
    expect,
  }) => {
    expect.assertions(3);

    const firstInstance = getSpinnerInstance();
    const secondInstance = getSpinnerInstance();

    const anotherInstance = ora({ prefixText: '[PULSE2]', spinner: 'dots' });

    expect(firstInstance).toBeDefined();
    expect(firstInstance).toStrictEqual(secondInstance);
    expect(firstInstance).toStrictEqual(anotherInstance);
  });
});
