import { describe, it, expect } from 'vitest';
import { replaceEnvironmentValue, getHostWithBase } from './replacer.helper';

process.env = {
  ...process.env,
  PULSE_API_URL: 'https://api.example.com',
  PULSE_TOKEN: '12345TOKEN',
};

describe.concurrent('replaceEnvironmentValue', () => {
  it('문자열에서 환경 변수를 대체해야 한다', () => {
    const input = 'The API URL is PULSE_API_URL and the token is PULSE_TOKEN.';
    const expected =
      'The API URL is https://api.example.com and the token is 12345TOKEN.';
    expect(replaceEnvironmentValue(input)).toStrictEqual(expected);
  });

  it('객체에서 환경 변수를 대체해야 한다', () => {
    const input = {
      url: 'PULSE_API_URL',
      token: 'PULSE_TOKEN',
    };
    const expected = '{"url":"https://api.example.com","token":"12345TOKEN"}';
    expect(replaceEnvironmentValue(input)).toStrictEqual(expected);
  });

  it('일치하는 환경 변수가 없으면 동일한 값을 반환해야 한다', () => {
    const input = 'No matching environment variables here.';
    expect(replaceEnvironmentValue(input)).toStrictEqual(input);
  });
});

describe.concurrent('getHostWithBase', () => {
  it('baseUrl 이 제공되지 않으면 그대로 반환해야 한다', () => {
    const host = 'example.com';
    expect(getHostWithBase(host)).toStrictEqual(host);
  });

  it('호스트에 프로토콜이 없으면 baseUrl 과 호스트를 결합해야 한다', () => {
    const host = 'example.com';
    const baseUrl = 'https://base.example';
    const expected = 'https://base.example/example.com';
    expect(getHostWithBase(host, baseUrl)).toStrictEqual(expected);
  });

  it('호스트에 이미 프로토콜이 있으면 호스트를 반환해야 한다', () => {
    const host = 'https://example.com';
    const baseUrl = 'https://base.example';
    expect(getHostWithBase(host, baseUrl)).toStrictEqual(host);
  });
});
