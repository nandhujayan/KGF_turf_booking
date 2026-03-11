import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, PerspectiveCamera, Stars, MeshDistortMaterial, GradientTexture } from '@react-three/drei';
import * as THREE from 'three';

function StadiumLights() {
  const group = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    }
  });

  return (
    <group ref={group}>
      <spotLight position={[10, 20, 10]} angle={0.15} penumbra={1} intensity={2} color="#00ff88" castShadow />
      <spotLight position={[-10, 20, 10]} angle={0.15} penumbra={1} intensity={2} color="#00eaff" castShadow />
      <spotLight position={[0, 20, -10]} angle={0.15} penumbra={1} intensity={2} color="#39ff14" castShadow />
    </group>
  );
}

function Turf() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color="#0a0f1c">
        <GradientTexture
          stops={[0, 1]}
          colors={['#0a0f1c', '#16ffbd']}
          size={1024}
        />
      </meshStandardMaterial>
    </mesh>
  );
}

function FloatingParticles() {
  const count = 100;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 1] = Math.random() * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 50;
    }
    return pos;
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.1} color="#00ff88" transparent opacity={0.6} />
    </points>
  );
}

export default function Stadium3D() {
  return (
    <div className="fixed inset-0 -z-10 bg-secondary">
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 5, 20]} fov={50} />
        <fog attach="fog" args={['#0a0f1c', 10, 50]} />
        <ambientLight intensity={0.2} />
        <StadiumLights />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[1, 32, 32]} />
            <MeshDistortMaterial
              color="#00ff88"
              speed={2}
              distort={0.4}
              radius={1}
            />
          </mesh>
        </Float>

        <Turf />
        <FloatingParticles />
      </Canvas>
    </div>
  );
}
