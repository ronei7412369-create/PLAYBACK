import React, { useEffect, useRef } from 'react';

export const BackgroundAnimation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    const vsSource = `
      attribute vec4 aVertexPosition;
      void main() {
          gl_Position = aVertexPosition;
      }
    `;

    const fsSource = `
      precision highp float;
      uniform vec2 u_resolution;
      uniform float u_time;

      void main() {
          vec2 uv = gl_FragCoord.xy / u_resolution.xy;
          
          vec2 p = uv * 2.0 - 1.0;
          p.x *= u_resolution.x / u_resolution.y;

          p.y += 0.8;

          float radius = 1.6;
          float thickness = 0.5;
          
          float r = length(p);
          float a = atan(p.y, p.x);

          float dist = abs(r - radius);

          float warp = sin(r * 4.0 - u_time * 0.5) * 0.3;
          
          float lineFreq = 80.0;
          
          float lines = sin((a + warp) * lineFreq + u_time * 2.0);
          
          lines = smoothstep(0.85, 1.0, lines);

          float mask = smoothstep(thickness, 0.0, dist);

          float coreGlow = 0.05 / (dist * dist + 0.05);

          float pattern = lines * mask;

          vec3 color1 = vec3(0.0, 0.4, 1.0);
          vec3 color2 = vec3(0.8, 0.1, 0.9);
          
          vec3 baseColor = mix(color1, color2, sin(a * 2.0 + u_time * 0.5) * 0.5 + 0.5);
          
          vec3 lineColor = mix(baseColor, vec3(1.0), 0.4);

          vec3 finalColor = lineColor * pattern * 2.5 + baseColor * coreGlow * 1.5;

          finalColor *= smoothstep(1.5, -0.5, p.y);
          
          finalColor *= smoothstep(3.0, 1.0, r);

          gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    function loadShader(gl: WebGLRenderingContext, type: number, source: string) {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    if (!vertexShader || !fragmentShader) return;

    const shaderProgram = gl.createProgram();
    if (!shaderProgram) return;
    
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(shaderProgram));
      return;
    }

    const positions = new Float32Array([
      -1.0,  1.0,
       1.0,  1.0,
      -1.0, -1.0,
       1.0, -1.0,
    ]);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const vertexPosition = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
    const resolutionLocation = gl.getUniformLocation(shaderProgram, 'u_resolution');
    const timeLocation = gl.getUniformLocation(shaderProgram, 'u_time');

    function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement) {
      const displayWidth  = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;

      if (canvas.width  !== displayWidth || canvas.height !== displayHeight) {
        canvas.width  = displayWidth;
        canvas.height = displayHeight;
        gl!.viewport(0, 0, gl!.canvas.width, gl!.canvas.height);
      }
    }

    let animationFrameId: number;

    function render(time: number) {
      if (!canvas || !gl || !shaderProgram) return;
      resizeCanvasToDisplaySize(canvas);

      gl.clearColor(0.0, 0.0, 0.0, 0.0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(shaderProgram);

      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(vertexPosition, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(vertexPosition);

      gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
      gl.uniform1f(timeLocation, time * 0.001);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      animationFrameId = requestAnimationFrame(render);
    }

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      gl.deleteProgram(shaderProgram);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteBuffer(positionBuffer);
    };

  }, []);
  return (
    <>
      <div className="fixed inset-0 crt-scanlines pointer-events-none z-10 opacity-20"></div>

      <div className="fixed top-0 left-0 w-full h-full -z-10 bg-[#050505]">
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
      </div>
    </>
  );
};


