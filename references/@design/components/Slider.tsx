/**
 * Slider Component
 * @id design-components-slider
 * @version 1.0.0
 * @since 2026-03-20
 */

import React from 'react';
import { colors } from '../tokens';

interface SliderProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  style?: React.CSSProperties;
}

export const Slider: React.FC<SliderProps> = ({
  min,
  max,
  value,
  onChange,
  style,
}) => {
  return (
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{
        width: 120,
        height: 4,
        WebkitAppearance: 'none',
        background: colors.borderLight,
        borderRadius: 2,
        outline: 'none',
        ...style,
      }}
    />
  );
};

export default Slider;
