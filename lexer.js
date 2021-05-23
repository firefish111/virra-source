const util = require("./util.js"); // require("../cmd/util");
const chalk = require("chalk")

const typ = [ 
  "i8",   "i16", "i32", "i64",
  "u8",   "u16", "u32", "u64",
                 "f32", "f64",
  "bool", "str", "fun"
];

const kw = [
  // var stuff
  "let", "imut", "of", "ret", "to",
  // special keyword (almost a namespace), to access c functions, e.g.
  // c:malloc(1024);
  "c",
  // PYTHON2 BAD OK THIS KEYWORD ACCEPTS BRACKETS
  "write",
  // control flow
  "if", "elseif", "else", "ret", "loop"
];

const sym = [
  "->", ";",

  "(", ")", "[", "]", "{", "}"
];

// escape a string for use in regex
const reg_esc = string => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// combine in regex combinations nof symbols
const any_raw = (...list) => new RegExp(list.join("|")),
      any = (...list) => any_raw(...list.map(x => reg_esc(x)));

const tokens = [
  { match: any(...kw), name: "keyword" },
  { match: any("true", "false"), name: "boolean" },
  { match: any(...typ), name: "datatype" },
  { match: any(...sym), name: "symbol" }, // syntactic symbols

  { match: /-?[0-9\.]+/, name: "number" },
  { match: /[a-zA-Z]\w*/, name: "identifier" },
  // should work
  { match: /"([^"]|(\\"))*"/, name: "string"},

  { match: /\s+/, skip: true }, // whitespace
  { match: /\*\*[^\n]*/, skip: true }, // line comment
  { match: /\*\[(.|\n)*\]\*/, skip: true }, // multi-line comment

  { match: any('=', '+', '-', '*', '/', '<=', '>='), name: "operator" }, // operator

];

for (let tok of tokens) {
  tok.match = new RegExp("^(" + tok.match.source + ")");
}

let code = "",
    i = 0,

    line = 1,
    col  = 1;


module.exports = () => {
  let tok;

  while (!tok) {
    let old_i = i;
    if (i === code.length) {
      i ++;
      return { type: "EOF", value: "" };
    }
    else if (i > code.length) {
      process.exit(1); // called for EOF more than once, prevent endless loop
    }

    for (let tokType of tokens) {
      let matches = code
        .slice(i)
        .match(tokType.match);
      
      if (matches && matches.length) {
        if (!tokType.skip)
          tok = {type: tokType.name, value: matches[0], line, col};
      
        for(let j = 0; j < matches[0].length; j ++){
          col ++;
          if(matches[0][j] === '\n') {
            col = 1;
            line ++;
          }
        }
        i += matches[0].length;
        break;
      }
    }
    // no matches
    if (i === old_i) {
      let matches;
      
      let oldCol = col, oldLine = line;

      while (!(matches && matches.length)){
        i++;
        col ++;
        if(code[i] === '\n') { col = 1; line ++; }

        for (let _tokType of tokens){
          matches = matches || code.slice(i).match(_tokType.match);
        }
      }

      preview = code.split("\n")
      util.fatal(`Unexpected token: ${code.slice(old_i, i)}\n\t\t\t${preview[line - 1]}\n\t\t\t${" ".repeat(col - 2)}${chalk.red("^".repeat(code.slice(old_i, i).length))}\n\t\t\tAt ${oldLine}:${oldCol} in ${chalk.red(name)}\n`);
    }
  }
  
  return tok;
};

module.exports.init = (_name ,_code) => {
  code = _code;
	name = _name
  i = 0;
}