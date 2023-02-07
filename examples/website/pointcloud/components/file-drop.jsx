// Add drag and drop functions for given canvas
export default function fileDrop(canvas, onDrop) {
  canvas.ondragover = (event) => {
    event.dataTransfer.dropEffect = 'link';
    event.preventDefault();
  };

  canvas.ondrop = (event) => {
    event.preventDefault();
    if (event.dataTransfer.files && event.dataTransfer.files.length === 1) {
      onDrop(event.dataTransfer.files[0]);
    }
  };
}
