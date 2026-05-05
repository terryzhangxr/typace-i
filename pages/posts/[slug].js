// --- 目录提取与图片处理 ---
  useEffect(() => {
    if (!contentRef.current) return;

    // 处理图片预览
    const images = contentRef.current.querySelectorAll('img');
    images.forEach(img => {
      img.style.cursor = 'zoom-in';
      img.onclick = () => setPreviewImage(img.src);
    });

    // 提取标题 (h1, h2, h3)
    const headings = Array.from(contentRef.current.querySelectorAll('h1, h2, h3'));
    
    setToc(headings.map((h, index) => {
      let id = h.id;
      
      
      if (!id) {
        
        const safeText = h.textContent.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fa5-]/g, '');
        
        id = `${safeText || 'heading'}-${index}`;
        
       
        h.id = id; 
      }
      
      return { id, text: h.textContent, level: h.tagName.toLowerCase() };
    }));

    
    const obs = new IntersectionObserver(entries => {
     
      entries.forEach(e => { if (e.isIntersecting) setActiveHeading(e.target.id); });
    }, { rootMargin: '-10% 0px -70% 0px' });
    
    headings.forEach(h => obs.observe(h));
    
    return () => obs.disconnect();
  }, [contentHtml]);
