import React, { useEffect, useRef } from 'react';

const AntigravityBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Particle[] = [];
        let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

        const particleCount = 200;
        const circleRadius = 150;
        const repelRadius = 80; // Inner radius where particles actively repel

        class Particle {
            x: number;
            y: number;
            vx: number;
            vy: number;
            size: number;
            color: string;
            baseAngle: number;
            baseDistance: number;
            rotationSpeed: number;

            constructor() {
                // Random position within circle
                this.baseAngle = Math.random() * Math.PI * 2;
                this.baseDistance = Math.random() * circleRadius;

                // Position relative to circle center
                this.x = Math.cos(this.baseAngle) * this.baseDistance;
                this.y = Math.sin(this.baseAngle) * this.baseDistance;

                this.vx = 0;
                this.vy = 0;
                this.size = Math.random() * 2.5 + 0.5;

                // Blue gradient shades
                const colors = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'];
                this.color = colors[Math.floor(Math.random() * colors.length)];

                // Random rotation speed for organic movement
                this.rotationSpeed = (Math.random() - 0.5) * 0.015;
            }

            update() {
                // Calculate distance from center (0,0 - cursor position)
                const distFromCenter = Math.sqrt(this.x * this.x + this.y * this.y);

                // Repel from center
                if (distFromCenter < repelRadius && distFromCenter > 0) {
                    const repelForce = (repelRadius - distFromCenter) / repelRadius;
                    const angle = Math.atan2(this.y, this.x);
                    this.vx += Math.cos(angle) * repelForce * 2;
                    this.vy += Math.sin(angle) * repelForce * 2;
                }

                // Gentle orbit rotation
                const perpX = -this.y;
                const perpY = this.x;
                const perpLength = Math.sqrt(perpX * perpX + perpY * perpY);
                if (perpLength > 0) {
                    this.vx += (perpX / perpLength) * this.rotationSpeed;
                    this.vy += (perpY / perpLength) * this.rotationSpeed;
                }

                // Keep particles within circle boundary with soft bounce
                if (distFromCenter > circleRadius) {
                    const angle = Math.atan2(this.y, this.x);
                    this.x = Math.cos(angle) * circleRadius;
                    this.y = Math.sin(angle) * circleRadius;
                    // Bounce velocity
                    this.vx *= -0.5;
                    this.vy *= -0.5;
                }

                // Apply velocity
                this.x += this.vx;
                this.y += this.vy;

                // Damping for smooth motion
                this.vx *= 0.95;
                this.vy *= 0.95;

                // Gentle pull toward ideal orbit distance
                const idealDistance = circleRadius * 0.7;
                if (distFromCenter > 0) {
                    const distDiff = idealDistance - distFromCenter;
                    const pullStrength = distDiff * 0.001;
                    const angle = Math.atan2(this.y, this.x);
                    this.vx += Math.cos(angle) * pullStrength;
                    this.vy += Math.sin(angle) * pullStrength;
                }
            }

            draw(ctx: CanvasRenderingContext2D, centerX: number, centerY: number) {
                const screenX = centerX + this.x;
                const screenY = centerY + this.y;

                // Add glow effect for more appeal
                ctx.shadowBlur = 3;
                ctx.shadowColor = this.color;

                ctx.beginPath();
                ctx.arc(screenX, screenY, this.size, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();

                // Reset shadow
                ctx.shadowBlur = 0;
            }
        }

        const init = () => {
            particles = [];
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle());
            }
        };

        const animate = () => {
            // Subtle fade trail effect
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            particles.forEach(particle => {
                particle.update();
                particle.draw(ctx, mouse.x, mouse.y);
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        const handleMouseMove = (e: MouseEvent) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        };

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        init();

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);
        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-0 pointer-events-none"
            style={{
                width: '100vw',
                height: '100vh',
                backgroundColor: '#ffffff'
            }}
        />
    );
};

export default AntigravityBackground;
