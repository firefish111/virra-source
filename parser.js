const util = require("./util.js"),
      scan = require("./lexer.js"),
      chalk = require("chalk");

// use output.push to push

const typeconv = {
  "i8": "char",
  "i16": "short",
  "i32": "int",
  "i64": "long int",
  "u8": "unsigned char",
  "u16": "unsigned short",
  "u32": "unsigned int",
  "u64": "unsigned long int",
  "f32": "float",
  "f64": "double",
  "str": "char*",
  "bool": "bool"
};

const data = {
  "i8": "number",
  "i16": "number",
  "i32": "number",
  "i64": "number",
  "u8": "number",
  "u16": "number",
  "u32": "number",
  "u64": "number",
  "f32": "number",
  "f64": "number",
  "str": "string",
  "bool": "boolean"
}

let output = [];
let current_tok, next_tok;
let headers = ["stdio", "stdbool", "stdlib"];

let IDENTIFIER_TYPES = {};

// g
headers.forEach(hd => output.push(`#include <${hd}.h>`)) 

output.push("#include \"./virra.h\"", "", "int main() {");

// EOF is the only token with null length
let err_detail = () =>
  !next_tok.value.length ?
    chalk.red(` at end`) : 
    `
\t\t\t${_file.split("\n")[next_tok.line - 1]}
\t\t\t${" ".repeat(next_tok.col - 1)}${chalk.red("^".repeat(Math.max(next_tok.value.length, 1)))}
\t\t\tAt ${next_tok.line}:${next_tok.col} in ${chalk.red(_filename)}
`;

let advance = () => {
    current_tok = next_tok; 
    let sc = scan();
    next_tok = {...sc, is: x => x === sc.value}; 
  },
    consume = (typ, value) => { 
      if (value !== undefined && next_tok.value !== value){ 
        util.fatal(`Expected "${value}"${next_tok.value ? `, found ${next_tok.value}` : " before EOF"}${err_detail()}`); 
      }
      else if (next_tok.type !== typ) {
        util.fatal(`Expected ${typ}, found ${next_tok.type}${err_detail()}`); 
      }

      advance();
      return current_tok;
    };

// this is superflous right now, but it will come in handy later
function parse_type() {
  if (next_tok.is("(")) {
    advance();
    let typ = parse_type();
    consume("symbol", ")");
    return typ;
  }

  return consume("datatype").value;
}

const typeError = (expected, recieved) => util.fatal("TypeError: Expected " + chalk.yellow(data[expected]) + ", received " + chalk.yellow(recieved.type) + "\n\n\t\t" + _file.split("\n")[recieved.line - 1] + "\n\t\t" + " ".repeat(recieved.col - 1) + chalk.red("^".repeat(recieved.value.length)) + "\n\t\tline " + recieved.line + ":" + recieved.col);

function parse_expression_1() {
  if(next_tok.type === 'number' || next_tok.type === 'string' || next_tok.type === 'boolean' || next_tok.type === 'identifier'){
    advance();

    if(current_tok.type === "identifier"){
      current_tok.type = IDENTIFIER_TYPES[current_tok.value];
    }

    return current_tok;
  }
  else if(next_tok.is('(')){
    advance();
    let inner = parse_expression();
    consume('symbol', ')');

    return { value: '(' + inner.value + ')', type: inner.type, line: inner.line, col: inner.col };
  }
}

// type_conversions.from.to = old => new
const type_conversions = {
  number: {
    string: "___lltostr"
  },
  boolean: {
    string: "___booltostr"
  }
};

function parse_expression(){
  let inner = parse_expression_1();
  if(next_tok.is("to")){
    advance();

    let oldtype = inner.type,
        newtype = parse_type();

    // todo: actually convert the type
    let new_value = type_conversions[oldtype][data[newtype]] + '(' + inner.value + ')';

    return { value: new_value, type: data[newtype], line: inner.line, col: inner.col }
  } else return inner;
}

function parse_statement() {
  if (next_tok.is("let") || next_tok.is("imut")) {
    let constant = consume("keyword").value === "imut"; // let, imut

    let name = consume("identifier").value;
    consume("keyword", "of");

    let type = parse_type(),
        ctype = typeconv[type];

    IDENTIFIER_TYPES[name] = data[type];

    consume("operator", "=");

    if (type === "fun") {
      consume("symbol", "(");
      let args = [];
      
      while (!next_tok.is(")")) {
        let id = consume("identifier").value;
        consume("keyword", "of");
        args.push({ name: id, type: typeconv[parse_type()] });
      }
      
      consume("symbol", ")");
      consume("symbol", "->");


      let return_type = parse_type(),
          return_ctype = typeconv[return_type];

      consume("symbol", "{");

      // parse();

      consume("symbol", "}");

      return ; // todo
    } else {
      let expr = parse_expression(),
          value = expr.value;

      if(expr.type !== data[type]) typeError(type, expr);

      consume("symbol", ";");
      
      output.push(`${constant ? "const " : ""}${ctype} ${name} = ${value};`);
    }
  } else if (next_tok.is("write")) {
    advance()
    consume("symbol", "(");
    let expr = parse_expression(),
        value = expr.value;

    if(expr.type !== 'string') typeError('str', expr);
  
    consume("symbol", ")");
    consume("symbol", ";");

    output.push(`printf(${value});`);
  } else if (next_tok.type === "keyword"){
    // todo
    util.unsupport("keywords");
    util.fatal(`Unexpected ${next_tok.type}:${err_detail()}`);
    advance();
  }

  else { util.fatal(`Unexpected ${next_tok.type}${err_detail()}`); advance(); }
}

function parse() {
  let stmts = [];
  while (next_tok.type !== "EOF") {
    stmts.push(parse_statement());
  }
  return { type: "StatementList", statements: stmts };
}

let _file,
    _filename;

module.exports = (filename, filecontents) => {
  scan.init(filename, filecontents);
  _file = filecontents;
	_filename = filename.replace("./", "")
  advance();

  parse();
  
  output.push("", "return 0;", "}")

  return output.join("\n");
}