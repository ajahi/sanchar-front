'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// Login-page only (loaded via next/dynamic, so three.js never ships to the dashboard).
// Glass bubbles bob on the cream backdrop; logos sit inside and are seen refracted.
const CREAM = '#FAF3E0';
const TAU = Math.PI * 2;

function instagram(g: CanvasRenderingContext2D, s: number) {
  const gr = g.createRadialGradient(s * .3, s * 1.05, 0, s * .3, s * 1.05, s * 1.25);
  gr.addColorStop(0, '#fdf497'); gr.addColorStop(.12, '#fdf497'); gr.addColorStop(.45, '#fd5949');
  gr.addColorStop(.62, '#d6249f'); gr.addColorStop(.9, '#285AEB');
  g.fillStyle = gr; g.beginPath(); g.roundRect(s * .1, s * .1, s * .8, s * .8, s * .22); g.fill();
  g.strokeStyle = g.fillStyle = '#fff'; g.lineWidth = s * .055;
  g.beginPath(); g.roundRect(s * .24, s * .24, s * .52, s * .52, s * .15); g.stroke();
  g.beginPath(); g.arc(s / 2, s / 2, s * .125, 0, TAU); g.stroke();
  g.beginPath(); g.arc(s * .635, s * .365, s * .035, 0, TAU); g.fill();
}

// Sanchar mailbox on a vermilion disc; the SVG strokes with currentColor, so recolor it white.
async function sanchar(g: CanvasRenderingContext2D, s: number) {
  g.fillStyle = '#CC3316'; g.beginPath(); g.arc(s / 2, s / 2, s * .42, 0, TAU); g.fill();
  const svg = (await (await fetch('/sanchar-mailbox.svg')).text()).replaceAll('currentColor', '#FFFBF2')
    .replace('width="100%" height="100%"', 'width="600" height="600"'); // % sizes decode to 0x0
  const img = new Image();
  img.src = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  await img.decode();
  g.drawImage(img, s * .2, s * .18, s * .6, s * .6);
  URL.revokeObjectURL(img.src);
}

export default function BubbleScene({ hot }: { hot: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hotRef = useRef(hot);
  hotRef.current = hot;

  useEffect(() => {
    const canvas = canvasRef.current!;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(CREAM);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
    scene.environment = env;
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.z = 10;

    // Cream backdrop with soft pop-color glows so the glass has something to bend.
    const bc = document.createElement('canvas'); bc.width = bc.height = 1024;
    const bg = bc.getContext('2d')!;
    bg.fillStyle = CREAM; bg.fillRect(0, 0, 1024, 1024);
    for (const [x, y, r, col] of [[330, 430, 340, '#FFB62755'], [600, 330, 300, '#D81B6033'], [520, 690, 320, '#CC331633']] as const) {
      const gr = bg.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, col); gr.addColorStop(1, '#FAF3E000');
      bg.fillStyle = gr; bg.fillRect(0, 0, 1024, 1024);
    }
    const backTex = new THREE.CanvasTexture(bc); backTex.colorSpace = THREE.SRGBColorSpace;
    const back = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshBasicMaterial({ map: backTex, toneMapped: false }));
    back.position.z = -8; scene.add(back);

    const group = new THREE.Group(); scene.add(group);
    const bubbleGeo = new THREE.SphereGeometry(1, 96, 96);
    const bubbleMat = new THREE.MeshPhysicalMaterial({
      transmission: 1, thickness: 0.6, roughness: 0, ior: 1.25,
      iridescence: 1, iridescenceIOR: 1.3, iridescenceThicknessRange: [120, 900],
      clearcoat: 1, clearcoatRoughness: 0, envMapIntensity: 1.3,
    });

    const disposables: { dispose(): void }[] = [renderer, pmrem, env, backTex, bubbleGeo, bubbleMat, back.geometry, back.material as THREE.Material];
    const logoPlane = (draw: (g: CanvasRenderingContext2D, s: number) => void | Promise<void>) => {
      const c = document.createElement('canvas'); c.width = c.height = 512;
      const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
      Promise.resolve(draw(c.getContext('2d')!, 512)).then(() => (tex.needsUpdate = true)).catch(() => {});
      // alphaTest keeps the logo in the opaque pass, so the transmissive bubble refracts it
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5, toneMapped: false }));
      disposables.push(tex, mesh.geometry, mesh.material);
      return mesh;
    };

    // [x, y, z, radius, logo?]: Instagram is the hero (the only social sign-in), Sanchar beside it, the rest are plain bubbles.
    const specs: [number, number, number, number, ((g: CanvasRenderingContext2D, s: number) => void | Promise<void>)?][] = [
      [-0.6, 0.2, 0.3, 1.35, instagram],
      [1.7, 1.3, -0.8, 0.85, sanchar],
      [1.4, -1.5, 0.5, 0.45],
      [-2.4, 1.6, -1.2, 0.35],
      [-2.6, -0.4, -0.6, 0.5],
    ];
    const bubbles = specs.map(([x, y, z, r, draw], i) => {
      const b = new THREE.Group(); b.scale.setScalar(r);
      const shell = new THREE.Mesh(bubbleGeo, bubbleMat);
      const logo = draw ? logoPlane(draw) : null;
      if (logo) b.add(logo);
      b.add(shell); group.add(b);
      return { b, shell, logo, home: [x, y, z], r, k: 1, i };
    });

    const mouse = new THREE.Vector2();
    const onMove = (e: PointerEvent) => mouse.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    const resize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
      group.scale.setScalar(Math.min(1, camera.aspect / 1.2));
      // desktop: canvas spans the page, so push the bubbles left of the sign-in card
      const halfW = Math.tan(THREE.MathUtils.degToRad(17.5)) * 10 * camera.aspect;
      group.position.x = w >= 1024 ? -halfW * 0.32 : 0;
    };
    const ro = new ResizeObserver(resize); ro.observe(canvas);
    addEventListener('pointermove', onMove);

    const speed = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0.25 : 1;
    const clock = new THREE.Clock();
    renderer.setAnimationLoop(() => {
      const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime * speed;
      for (const o of bubbles) {
        const [x, y, z] = o.home, i = o.i;
        o.b.position.set(x + Math.sin(t * .6 + i * 2.3) * .15, y + Math.sin(t * 1.1 + i * 2.1) * .3, z + Math.sin(t * .8 + i * 1.3) * .7);
        o.k += ((hotRef.current && i === 0 ? 1.12 : 1) - o.k) * dt * 6;
        const wob = Math.sin(t * 2.4 + i) * .03; // jelly squash
        o.shell.scale.set(o.k * (1 + wob), o.k * (1 - wob), o.k * (1 + wob));
        if (o.logo) {
          o.logo.scale.setScalar(o.k);
          o.logo.rotation.set(Math.sin(t * .9 + i) * .2, Math.sin(t * .7 + i * 2) * .35, Math.sin(t * .5 + i) * .1);
        }
      }
      group.rotation.y += (mouse.x * .25 - group.rotation.y) * dt * 3;
      group.rotation.x += (-mouse.y * .15 - group.rotation.x) * dt * 3;
      renderer.render(scene, camera);
    });

    return () => {
      renderer.setAnimationLoop(null);
      ro.disconnect();
      removeEventListener('pointermove', onMove);
      disposables.forEach((d) => d.dispose());
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="block h-full w-full" />;
}
