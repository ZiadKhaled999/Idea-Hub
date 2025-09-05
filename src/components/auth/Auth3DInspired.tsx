import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Sphere, Box, Cylinder, OrbitControls, Text3D, Torus } from '@react-three/drei';
import * as THREE from 'three';

interface FloatingElementProps {
  position: [number, number, number];
  color: string;
  speed: number;
  type: 'notebook' | 'pencil' | 'paper' | 'star' | 'lightbulb';
}

const FloatingElement = ({ position, color, speed, type }: FloatingElementProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * speed) * 0.4;
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.2;
      if (type === 'star') {
        groupRef.current.rotation.z = state.clock.elapsedTime * 0.3;
      }
    }
  });

  const renderElement = () => {
    switch (type) {
      case 'notebook':
        return (
          <group>
            <Box args={[0.8, 1, 0.1]} position={[0, 0, 0]}>
              <meshPhongMaterial color="#4FC3F7" />
            </Box>
            <Box args={[0.6, 0.8, 0.12]} position={[0, 0, 0.1]}>
              <meshPhongMaterial color="#E3F2FD" />
            </Box>
            {/* Spiral binding */}
            {[...Array(5)].map((_, i) => (
              <Cylinder key={i} args={[0.02, 0.02, 0.2]} position={[-0.3, 0.3 - i * 0.15, 0.15]} rotation={[Math.PI / 2, 0, 0]}>
                <meshPhongMaterial color="#81C784" />
              </Cylinder>
            ))}
          </group>
        );
      
      case 'pencil':
        return (
          <group>
            {/* Pencil body */}
            <Cylinder args={[0.08, 0.08, 1.5]} position={[0, 0, 0]} rotation={[0, 0, Math.PI / 6]}>
              <meshPhongMaterial color="#FFD54F" />
            </Cylinder>
            {/* Pencil tip */}
            <Cylinder args={[0.01, 0.08, 0.2]} position={[0, 0.85, 0]} rotation={[0, 0, Math.PI / 6]}>
              <meshPhongMaterial color="#8D6E63" />
            </Cylinder>
            {/* Eraser */}
            <Cylinder args={[0.1, 0.1, 0.15]} position={[0, -0.85, 0]} rotation={[0, 0, Math.PI / 6]}>
              <meshPhongMaterial color="#F48FB1" />
            </Cylinder>
            {/* Eyes */}
            <Sphere args={[0.1]} position={[0.05, 0.2, 0.1]}>
              <meshPhongMaterial color="#FFFFFF" />
            </Sphere>
            <Sphere args={[0.1]} position={[-0.05, 0.2, 0.1]}>
              <meshPhongMaterial color="#FFFFFF" />
            </Sphere>
            <Sphere args={[0.05]} position={[0.05, 0.2, 0.15]}>
              <meshPhongMaterial color="#000000" />
            </Sphere>
            <Sphere args={[0.05]} position={[-0.05, 0.2, 0.15]}>
              <meshPhongMaterial color="#000000" />
            </Sphere>
            {/* Mouth */}
            <Torus args={[0.05, 0.02]} position={[0, 0.05, 0.12]} rotation={[0, 0, 0]}>
              <meshPhongMaterial color="#000000" />
            </Torus>
          </group>
        );
      
      case 'paper':
        return (
          <Box args={[0.7, 1, 0.02]} rotation={[0, 0, Math.PI / 8]}>
            <meshPhongMaterial color="#FFFFFF" />
          </Box>
        );
      
      case 'star':
        return (
          <group>
            {[...Array(5)].map((_, i) => (
              <Box key={i} args={[0.05, 0.3, 0.05]} rotation={[0, 0, (i * Math.PI * 2) / 5]} position={[0, 0, 0]}>
                <meshPhongMaterial color="#FFE082" emissive="#FFF176" emissiveIntensity={0.3} />
              </Box>
            ))}
          </group>
        );
      
      case 'lightbulb':
        return (
          <group>
            <Sphere args={[0.3]} position={[0, 0.2, 0]}>
              <meshPhongMaterial color="#FFF176" emissive="#FFFF8D" emissiveIntensity={0.5} />
            </Sphere>
            <Cylinder args={[0.15, 0.15, 0.2]} position={[0, -0.1, 0]}>
              <meshPhongMaterial color="#37474F" />
            </Cylinder>
          </group>
        );
      
      default:
        return null;
    }
  };

  return (
    <group
      ref={groupRef}
      position={position}
      scale={hovered ? 1.1 : 1}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {renderElement()}
    </group>
  );
};

const ParticleField = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = 150;

  useEffect(() => {
    if (pointsRef.current) {
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 25;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 25;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 25;
        
        // Create sparkly colors
        const color = new THREE.Color();
        color.setHSL(Math.random() * 0.2 + 0.15, 0.7, 0.8);
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
      }
      
      pointsRef.current.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      pointsRef.current.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    }
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.02;
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.01) * 0.1;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry />
      <pointsMaterial size={0.03} vertexColors transparent opacity={0.8} />
    </points>
  );
};

const CloudElement = ({ position }: { position: [number, number, number] }) => {
  const cloudRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (cloudRef.current) {
      cloudRef.current.position.x = position[0] + Math.sin(state.clock.elapsedTime * 0.3) * 0.5;
      cloudRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.4) * 0.2;
    }
  });

  return (
    <group ref={cloudRef} position={position}>
      <Sphere args={[0.6]} position={[0, 0, 0]}>
        <meshPhongMaterial color="#F5F5F5" transparent opacity={0.8} />
      </Sphere>
      <Sphere args={[0.4]} position={[0.4, 0.1, 0]}>
        <meshPhongMaterial color="#F5F5F5" transparent opacity={0.8} />
      </Sphere>
      <Sphere args={[0.5]} position={[-0.3, 0.1, 0]}>
        <meshPhongMaterial color="#F5F5F5" transparent opacity={0.8} />
      </Sphere>
      <Sphere args={[0.3]} position={[0.2, -0.2, 0]}>
        <meshPhongMaterial color="#F5F5F5" transparent opacity={0.8} />
      </Sphere>
    </group>
  );
};

export const Auth3DInspired = () => {
  return (
    <div className="fixed inset-0 -z-10 bg-gradient-to-br from-primary/20 via-primary-glow/15 to-background">
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
      <div className="absolute top-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-xl animate-pulse" />
      <div className="absolute top-1/4 right-0 w-48 h-48 bg-primary-glow/10 rounded-full blur-2xl animate-pulse delay-1000" />
      <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-accent/10 rounded-full blur-xl animate-pulse delay-500" />
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>
    </div>
  );
};