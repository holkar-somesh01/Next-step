import React, { createContext, useContext, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => setIsDark((prev) => !prev);

  const colors = isDark
    ? {
        bg: '#0F0F17',
        card: '#1A1A2E',
        cardBorder: '#252540',
        text: '#F1F5F9',
        label: '#CBD5E1',
        subText: '#94A3B8',
        placeholder: '#475569',
        icon: '#64748B',
        inputBg: '#252540',
        inputBorder: '#2D2D50',
        inputFocusBg: '#1e2a45',
        sectionLabel: '#64748B',
        rowBorder: '#252540',
        menuIconBg: '#252540',
        menuIconColor: '#94A3B8',
        headerGradient: ['#1a1a2e', '#16213e'],
        tabBg: '#1A1A2E',
        tabBorder: '#252540',
      }
    : {
        bg: '#F1F5F9',
        card: '#FFFFFF',
        cardBorder: '#F1F5F9',
        text: '#0F172A',
        label: '#374151',
        subText: '#6B7280',
        placeholder: '#9CA3AF',
        icon: '#64748B',
        inputBg: '#F8FAFC',
        inputBorder: '#E2E8F0',
        inputFocusBg: '#EFF6FF',
        sectionLabel: '#94A3B8',
        rowBorder: '#F1F5F9',
        menuIconBg: '#F8FAFC',
        menuIconColor: '#64748B',
        headerGradient: ['#1E3A8A', '#3B82F6'],
        tabBg: '#FFFFFF',
        tabBorder: '#F1F5F9',
      };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
