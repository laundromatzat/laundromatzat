import React from 'react';
import { Link } from 'react-router-dom';

const TOOLS = [
  {
    id: 'pin-pals',
    title: 'Pin Pals',
    description: 'A collaborative map for pinning your favorite spots.',
    path: '/pin-pals',
    imageUrl: '/assets/tools/pin-pals.png',
  },
  {
    id: 'bg-remover',
    title: 'Background Remover',
    description: 'Instant, in-browser background removal for your photos.',
    path: '/tools/background-removal',
    imageUrl: '/assets/tools/bg-remover.png',
  },
  {
    id: 'fabric-designer',
    title: 'Nylon Fabric Designer',
    description: 'Design and visualize nylon fabric projects with AI.',
    path: '/tools/nylon-fabric-designer',
    imageUrl: '/assets/tools/fabric-designer.png',
  },
];

const ToolsSection: React.FC = () => {
  return (
    <section className="py-24 bg-white">
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-xl">
            <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4 block">
              The Lab
            </span>
            <h2 className="text-4xl md:text-5xl font-serif text-zinc-900 leading-tight">
              Experimental Tools & <br/> <span className="italic text-zinc-500">Creative Utilities.</span>
            </h2>
          </div>
          <Link 
            to="/tools" 
            className="text-sm font-semibold uppercase tracking-widest border-b border-zinc-900 pb-1 hover:text-zinc-600 hover:border-zinc-600 transition-colors"
          >
            View All Tools
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TOOLS.map((tool) => (
            <Link
              key={tool.id}
              to={tool.path}
              className="group relative overflow-hidden rounded-2xl bg-zinc-100 aspect-[4/3] md:aspect-auto md:h-[400px]"
            >
              <img
                src={tool.imageUrl}
                alt={tool.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500" />
              
              <div className="absolute inset-0 p-8 flex flex-col justify-end">
                <h3 className="text-2xl font-serif text-white mb-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  {tool.title}
                </h3>
                <p className="text-white/90 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                  {tool.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ToolsSection;
