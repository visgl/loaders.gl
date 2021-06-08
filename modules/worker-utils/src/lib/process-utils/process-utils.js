import ChildProcess from 'child_process';

// Get an available port
// Works on Unix systems
export function getAvailablePort(defaultPort = 3000) {
  return new Promise((resolve, reject) => {
    // Get a list of all ports in use
    ChildProcess.exec('lsof -i -P -n | grep LISTEN', (error, stdout, stderr) => {
      if (error) {
        // likely no permission, e.g. CI
        resolve(defaultPort);
        return;
      }

      const portsInUse = [];
      const regex = /:(\d+) \(LISTEN\)/;
      stdout.split('\n').forEach((line) => {
        const match = line.match(regex);
        if (match) {
          portsInUse.push(Number(match[1]));
        }
      });
      let port = defaultPort;
      while (portsInUse.includes(port)) {
        port++;
      }
      resolve(port);
    });
  });
}
