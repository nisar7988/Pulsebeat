import { getThemePreset } from './presets';

const defaultPreset = getThemePreset('pulse');

export const colors = defaultPreset.colors;
export const gradients = defaultPreset.gradients;

export type Colors = typeof colors;
export type Gradients = typeof gradients;
