import { useMemo } from 'react';
import { PanResponder } from 'react-native';

export const MAIN_TAB_ROUTES = ['Home', 'Watchlist', 'Sectors', 'Portfolio', 'Overview', 'Calculators'];

const SWIPE_CAPTURE_DX = 12;
const SWIPE_TRIGGER_DX = 56;
const SWIPE_MAX_DY = 24;

const getAdjacentItem = (items, activeItem, direction) => {
  const index = items.indexOf(activeItem);
  if (index === -1) return null;

  const nextIndex = direction === 'left' ? index + 1 : index - 1;
  if (nextIndex < 0 || nextIndex >= items.length) return null;
  return items[nextIndex];
};

export const useHorizontalSwipe = (items, activeItem, onChange, { disabled = false } = {}) => {
  return useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          if (disabled) return false;
          const absDx = Math.abs(gestureState.dx);
          const absDy = Math.abs(gestureState.dy);
          return absDx > SWIPE_CAPTURE_DX && absDx > absDy * 1.2;
        },
        onPanResponderRelease: (_, gestureState) => {
          if (disabled) return;

          const { dx, dy, vx } = gestureState;
          if (Math.abs(dy) > SWIPE_MAX_DY) return;
          if (Math.abs(dx) < SWIPE_TRIGGER_DX && Math.abs(vx) < 0.35) return;

          const direction = dx < 0 ? 'left' : 'right';
          const nextItem = getAdjacentItem(items, activeItem, direction);
          if (nextItem && nextItem !== activeItem) {
            onChange(nextItem);
          }
        },
      }).panHandlers,
    [activeItem, disabled, items, onChange],
  );
};
