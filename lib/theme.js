// lib/theme.js
import { useEffect, useState } from 'react';

export function useDarkMode() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 初始化主题
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialMode = savedDarkMode ?? prefersDarkMode;
    
    setIsDarkMode(initialMode);
    document.documentElement.classList.toggle('dark', initialMode);
  }, []);

  // 监听 storage 事件（跨页面同步）
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'darkMode') {
        const newMode = e.newValue === 'true';
        setIsDarkMode(newMode);
        document.documentElement.classList.toggle('dark', newMode);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // 切换主题
  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('darkMode', newMode);
    document.documentElement.classList.toggle('dark', newMode);
    
    // 触发跨页面同步
    window.dispatchEvent(new Event('storage'));
  };

  return [isDarkMode, toggleDarkMode];
}
