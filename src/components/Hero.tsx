import React from 'react';

const Hero: React.FC = () => {
  const handleScrollToWork = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const element = document.getElementById('work-section');
    if (element) {
      const headerOffset = 85;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <section className="relative w-full h-screen min-h-[800px] overflow-hidden bg-zinc-900">
      
      {/* Background Image */}
      <div className="absolute inset-0 w-full h-full">
        <img 
            src="https://images.unsplash.com/photo-1621799754526-a0d52c49fad5?auto=format&fit=crop&q=80&w=2000" 
            alt="Abstract film grain texture" 
            className="w-full h-full object-cover grayscale contrast-[1.1] brightness-[0.8]"
        />
        <div className="absolute inset-0 bg-black/30 mix-blend-multiply"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center items-start text-left md:items-center md:text-center px-6">
        <div className="animate-fade-in w-full md:w-auto">
          <span className="block text-xs md:text-sm font-medium uppercase tracking-[0.2em] text-white/90 mb-6 backdrop-blur-sm bg-white/10 px-4 py-2 rounded-full mx-0 md:mx-auto w-fit">
            Creative Studio
          </span>
          <h1 className="text-5xl md:text-8xl lg:text-9xl font-serif font-normal text-white tracking-tight mb-8 drop-shadow-sm">
            laundromatzat<span className="italic text-aura-bg">.com</span>
          </h1>
          <p className="max-w-lg mx-0 md:mx-auto text-lg md:text-xl text-white/90 font-light leading-relaxed mb-12 text-shadow-sm">
            A collection of films, photos, and experimental tools.
          </p>
          
          <a 
            href="#work-section" 
            onClick={handleScrollToWork}
            className="group relative px-10 py-4 bg-aura-bg text-aura-text-primary rounded-full text-sm font-semibold uppercase tracking-widest hover:bg-white transition-all duration-500 overflow-hidden shadow-lg hover:shadow-xl inline-block"
          >
            <span className="relative z-10 group-hover:text-aura-text-primary">View Work</span>
          </a>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce text-white/50">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
};

export default Hero;
