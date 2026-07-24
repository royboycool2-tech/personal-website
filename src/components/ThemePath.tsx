import { useState, useEffect, useRef } from 'react';

export interface ThemePathNode {
  id: string;
  title: string;
  tool: string;
  description?: string;
  tags?: string[];
  link?: string;
}

export interface ThemePathProps {
  id: number;
  title: string;
  description?: string;
  color: string;
  status?: string;
  nodes: ThemePathNode[];
}

const DEFAULT_STATUS = '持续探索中';

export default function ThemePath({ id, title, description, color, status = DEFAULT_STATUS, nodes }: ThemePathProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) {
    return (
      <div ref={sectionRef} className="relative rounded-3xl border-4 border-[#37332B] bg-[#FFFDE5] p-6">
        <div className="flex flex-wrap items-baseline gap-3 mb-6">
          <span className="text-sm font-black tracking-wider" style={{ color }}>
            {String(id).padStart(2, '0')}
          </span>
          <h3 className="text-xl font-black text-[#28251F]">{title}</h3>
        </div>

        {description && (
          <p className="text-[#706A5E] mb-6 leading-relaxed">
            {description}
          </p>
        )}

        <div className="relative pl-6 space-y-4">
          {nodes.map((node, index) => {
            const isActive = hoveredNode === node.id;

            return (
              <div key={node.id} className="relative">
                <div 
                  className="absolute left-0 top-2 w-4 h-4 rounded-full border-2 border-[#37332B] z-10" 
                  style={{ backgroundColor: isActive ? color : '#F7F3E8' }} 
                />
                
                {index < nodes.length - 1 && (
                  <div className="absolute left-1.5 top-6 w-px h-12 bg-[#37332B]" style={{ opacity: isActive ? 1 : 0.4 }} />
                )}

                <div 
                  className="ml-8 cursor-pointer py-2"
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => setHoveredNode(isActive ? null : node.id)}
                  tabIndex={0}
                >
                  <div className="flex flex-col gap-1">
                    <h4 className="font-black text-[#28251F]">{node.title}</h4>
                    <span className="text-sm font-mono" style={{ color }}>{node.tool}</span>
                  </div>

                  {isActive && (node.description || node.tags || node.link) && (
                    <div className="mt-3 pt-3 border-t border-dashed border-[#37332B]/20 space-y-2 animate-fadeIn">
                      {node.description && (
                        <p className="text-sm text-[#706A5E] leading-relaxed">{node.description}</p>
                      )}
                      {node.tags && node.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {node.tags.map((tag) => (
                            <span key={tag} className="text-xs font-bold px-2 py-1 rounded-full" style={{ backgroundColor: `${color}15`, color }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {node.link && (
                        <a href={node.link} className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider" style={{ color }}>
                          查看实践 →
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <div className="ml-8 flex items-center gap-2 text-sm font-bold pt-4" style={{ color }}>
            <span>{status}</span>
            <span className="text-lg">↘</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={sectionRef} className="relative rounded-3xl border-4 border-[#37332B] bg-[#FFFDE5] p-6 md:p-8 h-full">
      <div className="flex flex-wrap items-baseline gap-3 mb-6">
        <span className="text-sm md:text-base font-black tracking-wider" style={{ color }}>
          {String(id).padStart(2, '0')}
        </span>
        <h3 className="text-2xl md:text-3xl font-black text-[#28251F]">{title}</h3>
      </div>

      {description && (
        <p className="text-[#706A5E] mb-6 leading-relaxed">
          {description}
        </p>
      )}

      <div className="space-y-6">
        {nodes.map((node, index) => {
          const isActive = hoveredNode === node.id;

          return (
            <div
              key={node.id}
              className={`transition-all duration-500 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: `${index * 120}ms` }}
            >
              <button
                className="group flex items-start gap-3 w-full text-left cursor-pointer"
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => setHoveredNode(isActive ? null : node.id)}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setHoveredNode(isActive ? null : node.id)}
              >
                <div 
                  className={`w-4 h-4 rounded-full border-2 border-[#37332B] flex-shrink-0 mt-1 transition-all duration-300 z-30`}
                  style={{ 
                    backgroundColor: isActive ? color : '#F7F3E8',
                    transform: isActive ? 'scale(1.3)' : 'scale(1)',
                    boxShadow: isActive ? `0 0 10px ${color}60` : 'none'
                  }}
                />

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-black text-[#28251F]">
                      {node.title}
                    </h4>
                    <div className="w-6 h-px bg-[#37332B]/30 flex-shrink-0" />
                  </div>

                  <span className="text-sm font-mono mt-1 block" style={{ color }}>
                    {node.tool}
                  </span>

                  {isActive && (node.description || node.tags || node.link) && (
                    <div 
                      className="mt-3 pt-3 border-t border-dashed border-[#37332B]/20 space-y-2"
                    >
                      {node.description && (
                        <p className="text-sm text-[#706A5E] leading-relaxed">
                          {node.description}
                        </p>
                      )}
                      {node.tags && node.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {node.tags.map((tag) => (
                            <span 
                              key={tag}
                              className="text-xs font-bold px-2 py-1 rounded-full"
                              style={{ backgroundColor: `${color}15`, color }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {node.link && (
                        <a href={node.link} className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider" style={{ color }}>
                          查看实践 →
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </button>
            </div>
          );
        })}

        <div 
          className={`flex items-center gap-2 text-sm font-bold transition-all duration-500 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ 
            color,
            transitionDelay: `${nodes.length * 120 + 300}ms`
          }}
        >
          <span>{status}</span>
          <span className="text-lg">↘</span>
        </div>
      </div>
    </div>
  );
}