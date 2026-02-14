self.onmessage = (e) => {
    if (e.data === 'start') {
        self.interval = setInterval(() => {
            self.postMessage('tick');
        }, 1000 / 60); // Target 60 FPS
    } else if (e.data === 'stop') {
        clearInterval(self.interval);
    }
};
