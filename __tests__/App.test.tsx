/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

test('renders correctly', async () => {
  let tabCount = 0;

  await ReactTestRenderer.act(() => {
    const renderer = ReactTestRenderer.create(<App />);
    tabCount = renderer.root.findAllByProps({ accessibilityRole: 'tab' }).length;
  });

  expect(tabCount).toBe(2);
});
