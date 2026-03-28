import { useEffect, useRef, useState } from "react";
import Globe, { GlobeMethods } from "react-globe.gl";
import * as THREE from "three";

const CLOUDS_ALT = 0.004;
const CLOUDS_ROTATION_SPEED = -0.006;

const GlobeBackground = () => {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;

    // Auto-rotate
    globe.controls().autoRotate = true;
    globe.controls().autoRotateSpeed = 0.35;
    globe.controls().enableZoom = false;
    globe.controls().enablePan = false;
    globe.controls().enableRotate = false;

    // Add clouds
    const CLOUDS_IMG_URL = "//unpkg.com/three-globe/example/img/earth-water.png";
    new THREE.TextureLoader().load(CLOUDS_IMG_URL, (cloudsTexture) => {
      const clouds = new THREE.Mesh(
        new THREE.SphereGeometry(globe.getGlobeRadius() * (1 + CLOUDS_ALT), 75, 75),
        new THREE.MeshPhongMaterial({
          map: cloudsTexture,
          transparent: true,
          opacity: 0.15,
        })
      );
      globe.scene().add(clouds);

      (function rotateClouds() {
        clouds.rotation.y += (CLOUDS_ROTATION_SPEED * Math.PI) / 180;
        requestAnimationFrame(rotateClouds);
      })();
    });

    // Dim atmosphere
    globe.pointOfView({ lat: 20, lng: 78, altitude: 2.5 });
  }, []);

  // Parallax: move globe vertically with scroll
  const translateY = scrollY * 0.15;

  return (
    <div
      id="globe-container"
      className="fixed inset-0 pointer-events-none z-0"
      style={{
        transform: `translateY(${translateY}px)`,
        opacity: Math.max(0.15, 1 - scrollY / 2000),
        transition: "opacity 0.3s ease",
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center" style={{ marginTop: "-10vh" }}>
        <Globe
          ref={globeRef}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          atmosphereColor="hsl(42, 78%, 48%)"
          atmosphereAltitude={0.18}
          animateIn={false}
        />
      </div>
      {/* Overlay gradient to blend globe into background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/80" />
    </div>
  );
};

export default GlobeBackground;
