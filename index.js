// temporary file to run language

const fs = require('fs'),
      cp = require('child_process'),
			filename = `./example.vl`,
      filecontent = fs.readFileSync(filename, 'utf8'),
      util = require('./util'),
      parse = require('./parser.js'),
      { spawn } = require('child_process');
 
if(!fs.existsSync('./build')) fs.mkdirSync('./build');

fs.writeFile('./build/_out.c', parse(filename, filecontent), 'utf8', () => {
  const gcc = spawn('./build.sh');

  let hasErrored = false;

  gcc.stderr.on('data', data => {
    util.error(`InternalError: GCC compilation failed with following error:\n\n${data}\n`);

    hasErrored = true;
  });

  gcc.on('close', () => {
    if (hasErrored) return;
    const run = spawn('./build/_out');
    
    run.stdout.on('data', data => console.log(data.toString()));
    run.stderr.on('data', util.error);
  })
});