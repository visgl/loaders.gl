import {Matrix4} from '@math.gl/core';

// Simple controller that keeps updating translation and rotation
export default class Controller {
  constructor(canvas, {initialZoom = 2, onDrop = (file) => {}} = {}) {
    this.mouse = {
      lastX: 0,
      lastY: 0
    };

    this.translate = initialZoom;
    this.rotation = [0, 0];
    this.rotationStart = [0, 0];
    this.rotationAnimation = true;

    this.onDrop = onDrop;

    this._initializeEventHandling(canvas);
  }

  animate(time) {
    if (this.rotationAnimation) {
      this.rotation[1] = time / 3600;
    }
  }

  getMatrices() {
    const [pitch, roll] = this.rotation;

    const cameraPosition = [
      -this.translate * Math.sin(roll) * Math.cos(-pitch),
      -this.translate * Math.sin(-pitch),
      this.translate * Math.cos(roll) * Math.cos(-pitch)
    ];

    const viewMatrix = new Matrix4()
      .translate([0, 0, -this.translate])
      .rotateX(pitch)
      .rotateY(roll);

    return {
      cameraPosition,
      viewMatrix
    };
  }

  // PRIVATE

  _initializeEventHandling(canvas) {
    canvas.onwheel = (e) => {
      this.translate += e.deltaY / 10;
      if (this.translate < 0.1) {
        this.translate = 0.1;
      }
      e.preventDefault();
    };

    canvas.onpointerdown = (e) => {
      this.mouse.lastX = e.clientX;
      this.mouse.lastY = e.clientY;

      this.rotationStart[0] = this.rotation[0];
      this.rotationStart[1] = this.rotation[1];

      canvas.setPointerCapture(e.pointerId);
      e.preventDefault();

      this.rotationAnimation = false;
    };

    canvas.onpointermove = (e) => {
      if (e.buttons) {
        const dX = e.clientX - this.mouse.lastX;
        const dY = e.clientY - this.mouse.lastY;

        this.rotation[0] = this.rotationStart[0] + dY / 100;
        this.rotation[1] = this.rotationStart[1] + dX / 100;
      }
    };

    canvas.ondragover = (e) => {
      e.dataTransfer.dropEffect = 'link';
      e.preventDefault();
    };

    canvas.ondrop = async (event) => {
      event.preventDefault();
      if (event.dataTransfer.files && event.dataTransfer.files.length === 1) {
        const file = event.dataTransfer.files[0];
        this.onDrop(file);
      }
    };
  }
}
