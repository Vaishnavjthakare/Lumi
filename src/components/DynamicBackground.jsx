import React, { useEffect, useRef } from 'react';

export default function DynamicBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    
    let particles = [];
    // Adjust density based on screen size (roughly 1 particle per 15,000 pixels)
    let numParticles = Math.floor((window.innerWidth * window.innerHeight) / 15000);
    if (numParticles > 120) numParticles = 120; // Cap to maintain performance
    
    let mouse = { x: null, y: null, radius: 150 };

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.z = Math.random() * 0.8 + 0.2; // Parallax depth layer
        this.size = (Math.random() * 2 + 1) * this.z;
        this.baseX = this.x;
        this.baseY = this.y;
        this.density = ((Math.random() * 30) + 1) * this.z; // Closer particles react heavier
        this.vx = (Math.random() - 0.5) * 1.5 * this.z; // Farther particles move slower
        this.vy = (Math.random() - 0.5) * 1.5 * this.z;
      }
      
      draw(isDark) {
        // Pure White in Dark Mode, Deep Black in Light Mode. Factor in Z depth for opacity.
        let baseOpacity = isDark ? (0.6 * this.z) : (0.7 * this.z);
        ctx.fillStyle = isDark ? `rgba(255, 255, 255, ${baseOpacity})` : `rgba(0, 0, 0, ${baseOpacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
        
        // Render a soft glow around particles
        ctx.shadowBlur = isDark ? 8 : 4;
        ctx.shadowColor = isDark ? `rgba(255, 255, 255, ${baseOpacity})` : `rgba(0, 0, 0, ${baseOpacity * 0.5})`;
      }
      
      update() {
        // Continuous organic floating
        this.x += this.vx;
        this.y += this.vy;
        
        // Gentle bounce off walls
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

        // Magical mouse collision tracking
        if (mouse.x != null && mouse.y != null) {
          let dx = mouse.x - this.x;
          let dy = mouse.y - this.y;
          let distance = Math.sqrt(dx * dx + dy * dy);
          let forceDirectionX = dx / distance;
          let forceDirectionY = dy / distance;
          let maxDistance = mouse.radius;
          let force = (maxDistance - distance) / maxDistance;
          let directionX = forceDirectionX * force * this.density;
          let directionY = forceDirectionY * force * this.density;
          
          if (distance < maxDistance) {
            this.x -= directionX;
            this.y -= directionY;
          }
        }
      }
    }

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Recalculate particle count
      const newNum = Math.floor((window.innerWidth * window.innerHeight) / 15000);
      numParticles = newNum > 120 ? 120 : newNum;
      if (particles.length < numParticles) {
         for (let i = particles.length; i < numParticles; i++) {
           particles.push(new Particle());
         }
      } else if (particles.length > numParticles) {
         particles.splice(numParticles);
      }
    };
    
    window.addEventListener('resize', resize);
    resize();



    const init = () => {
      particles = [];
      for (let i = 0; i < numParticles; i++) {
        particles.push(new Particle());
      }
    };

    const animate = () => {
      // Clear frame efficiently
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const isDark = document.documentElement.classList.contains('dark');
      
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw(isDark);
        
        // Connect nearby particles to draw constellation grid
        for (let j = i; j < particles.length; j++) {
          let dx = particles[i].x - particles[j].x;
          let dy = particles[i].y - particles[j].y;
          let distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 150) {
            ctx.beginPath();
            let opacity = (1 - distance/150) * Math.min(particles[i].z, particles[j].z);
            if (isDark) {
               ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.7})`; // Glowing white connections
            } else {
               ctx.strokeStyle = `rgba(0, 0, 0, ${opacity * 0.8})`; // Bold black light mode wires
            }
            ctx.lineWidth = 1;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
            ctx.closePath();
          }
        }
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    init();
    animate();

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseLeave);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: -10 }} // Pushes canvas below all router panels
    />
  );
}
