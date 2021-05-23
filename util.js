const chalk = require("chalk"),
      clipr = require("cli-progress"),
      ora = require('ora');;

module.exports = {
  // major error, can't continue
  fatal: str => {
    console.log(`[${chalk.red("FATAL")}] ${str}`)
    process.exit(1)
  },
  // major error, but can continue
  error: str => console.log(`[${chalk.red("ERROR")}] ${str}`),
  // minor error or debug information
  warn: str => console.log(`[${chalk.yellow("WARN")}] ${str}`),
  // misc information
  info: str => console.log(`[${chalk.blueBright("INFO")}] ${str}`),
  // completed
  success: str => console.log(`[${chalk.green("DONE")}] ${str}`),

  // unsupported
  unsupport: function(man) { // javascript in a nutshell
    this.warn(`This error may have occured because an unsupported feature was used.
  ${" ".repeat(7)}Please refer to the documentation on: ${chalk.cyanBright(man)}`)
  },
  
  progress_det: () => 
    new clipr.SingleBar({ 
      format: '[' + chalk.blueBright('{bar}') + ']  {value}/{total} {eta_formatted}', 
      barCompleteChar: '=', 
      barIncompleteChar: ' ', 
      hideCursor: true
    }),
  
  progress_indet: text => {
  	const spinner = ora() 
  	spinner.color = 'blueBright';
  	spinner.text = text;
  	
  	spinner.spinner = "line"
  	spinner.start()
  	return spinner;
  }
  
}