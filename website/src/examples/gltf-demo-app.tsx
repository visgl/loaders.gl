// import {runApp} from 'examples/website/gltf/app';
import React from 'react';
import { useCallback } from 'react'

export default function Demo() {
  const refCallback = useCallback((canvas: HTMLCanvasElement) => {
    console.log(canvas);
    // runApp({canvas});
  }, [])
  return <canvas style={{width: "80vh", height: "80vh"}} ref={refCallback} />
}