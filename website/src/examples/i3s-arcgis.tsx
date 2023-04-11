import {runApp} from 'examples/website/i3s-arcgis/app';
import React from 'react';
import { useCallback } from 'react'

export default function Demo() {
  const refCallback = useCallback((canvas: HTMLCanvasElement) => {
    console.log(canvas);
    runApp("arcgis-demo");
  }, [])
  return <span ref={refCallback} />
}