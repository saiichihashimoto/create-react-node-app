const { spawn } = require('child_process');

module.exports = function spawnAsync(command, args = [], options = {}) {
	return new Promise((resolve, reject) => {
		const subprocess = spawn(command, args, {
			...options,
			stdio: [process.stdin, process.stdout, process.stderr],
		});

		subprocess.on('error', reject);
		subprocess.on('close', (code) => (
			code ?
				reject(code) :
				resolve()
		));
	});
};
