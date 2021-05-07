import { Greeter } from '../index';

test('Greeter', () => {
  expect(Greeter('5antos')).toBe('Hello 5antos');
  expect(Greeter('World')).toBe('Hello World');
});
