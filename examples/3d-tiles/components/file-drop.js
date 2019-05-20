// Add drag and drop functions for given canvas
export default function fileDrop(canvas, onDrop) {
  canvas.ondragover = e => {
    e.dataTransfer.dropEffect = 'link';
    e.preventDefault();
  };

  canvas.ondrop = e => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length === 1) {
      const file = e.dataTransfer.files[0];
      const readPromise = new Promise(resolve => {
        const reader = new window.FileReader();
        reader.onload = ev => resolve(ev.target.result);
        reader.readAsArrayBuffer(file);
      });

      onDrop(readPromise, file);
    }
  };
}
