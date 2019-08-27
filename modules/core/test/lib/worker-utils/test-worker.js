export default `
  self.onmessage = event => {
    setTimeout(() => self.postMessage(event.data), 50);
  };
`;
