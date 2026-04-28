"use client";

import React, { createContext, useContext, useMemo } from 'react';
import { WINDOW_BREAKPOINTS } from '@/lib/constant';

export type WindowMode = 'mobile' | 'desktop' | null;

interface WindowModeData {
  mode: WindowMode;
  width: number | null;
  isMobile: boolean;
}

const DEFAULT_VALUE: WindowModeData = { mode: null, width: null, isMobile: false };

const WindowModeContext = createContext<WindowModeData>(DEFAULT_VALUE);

export function useWindowMode(): WindowModeData {
  return useContext(WindowModeContext);
}

interface WindowModeProviderProps {
  mode: WindowMode;
  width: number | null;
  children: React.ReactNode;
}

export function WindowModeProvider({ mode, width, children }: WindowModeProviderProps) {
  const value = useMemo<WindowModeData>(
    () => ({
      mode,
      width,
      isMobile: mode === 'mobile' || (width !== null && width <= WINDOW_BREAKPOINTS.MOBILE),
    }),
    [mode, width]
  );
  return React.createElement(WindowModeContext.Provider, { value }, children);
}

export function getGridColumns(width: number | null): number {
  if (!width) return 4;

  if (width <= 640) return 2;
  if (width <= 768) return 3;
  if (width <= 1024) return 4;
  if (width <= 1280) return 5;
  return 6;
}
