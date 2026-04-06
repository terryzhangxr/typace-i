import { useState, useEffect } from 'react';
import '../styles/globals.css';

export default function MyApp({ Component, pageProps }) {
  // 全局唯一的主题状态
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // 1. 初始化：同步 document 上的类名（由 _document.js 预设好的）
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
    setMounted(true);

    // 2. 可选：监听外部（如其他标签页）对主题的修改
    const observer = new MutationObserver(() => {
      const currentDark = document.documentElement.classList.contains('dark');
      if (currentDark !== isDarkMode) setIsDarkMode(currentDark);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, [isDarkMode]);

  // 全局切换函数
  const toggleDarkMode = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    localStorage.setItem('darkMode', next);
    
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // 将主题状态和切换函数注入到所有页面的 Props 中
  return (
    <Component 
      {...pageProps} 
      isDarkMode={isDarkMode} 
      toggleDarkMode={toggleDarkMode} 
      themeMounted={mounted} 
    />
  );
}
