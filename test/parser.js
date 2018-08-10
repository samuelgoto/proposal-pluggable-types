const Assert = require("assert");
const acorn = require("acorn");
const walk = require("acorn/dist/walk")
const tt = acorn.tokTypes;
const {TokenType, keywordTypes} = acorn;
const escodegen = require("escodegen");

const reserved = {};
const reserve = (token) => {
 reserved[token] = tt[token] = keywordTypes[token] = new TokenType(token, {keyword: token});
};

reserve("number");
reserve("boolean");
reserve("string");
reserve("any");
reserve("void");
reserve("object");
reserve("undefined");
reserve("null");

acorn.plugins.types = function(parser) {
 function parseType() {
    if (!this.eat(tt.colon)) {
     return;
    }
    // TODO(goto): disallow type declarations in variable lists.
    // because @jsdocs can't refer to multiple variables,
    // at least as far as I'm aware of.

    let node = this.startNode();
    if (this.eat(tt.number)) {
     node.label = tt.number.label;
    } else if (this.eat(tt.boolean)) {
     node.label = tt.boolean.label;
    } else if (this.eat(tt.string)) {
     node.label = tt.string.label;
    } else if (this.eat(tt.object)) {
     node.label = tt.object.label;
    } else if (this.eat(tt.any)) {
     node.label = tt.any.label;
    } else if (this.eat(tt.void)) {
     node.label = tt.void.label;
    } else if (this.eat(tt.null)) {
     node.label = tt.null.label;
    } else if (this.eat(tt.undefined)) {
     node.label = tt.undefined.label;
    } else {
     this.raise(this.pos, "Expected a type declaration");
     return;
    }

    return this.finishNode(node, "TypeDeclaration");
 }

 parser.extend("parseVarId", function(nextMethod) {
   return function(decl, kind) {
    decl.id = this.parseBindingAtom(kind);
    let type = parseType.call(this, decl);
    if (type) {
     decl.types = type;
    }
    this.checkLVal(decl.id, kind, false)
   };
  });

 parser.extend("parseBindingList", function(nextMethod) {
   return function(close, allowEmpty, allowTrailingComma) {
    // console.log(close);
    return nextMethod.call(this, close, allowEmpty, allowTrailingComma);
   };
  });

 parser.extend("parseBindingListItem", function(nextMethod) {
   return function(param) {
    let type = parseType.call(this);
    if (type) {
     // console.log(type);
     param.types = type;
    }
    return param;
    // return nextMethod.call(this, param);
   }
  });

 parser.extend("parseFunctionParams", function(nextMethod) {
   return function(node) {
    // NOTE(goto): this is a major hack, we should probably override
    // parseFunction, but that's really long, so, overriding
    // parseFunctionParams that happens just before parseFunctionBody
    // even if the : return type declaration are technically outside
    // of the function parameter list. oh well.
    this.expect(tt.parenL);
    node.params = this.parseBindingList(tt.parenR, false, this.options.ecmaVersion >= 8);
    this.checkYieldAwaitInDefaultParams();
    let type = parseType.call(this);
    if (type) {
     // console.log("hello");
     // console.log(type);
     node.returns = type;
    }
     // return nextMethod.call(this, node);
   };
  });

 parser.extend("readWord", function(nextMethod) {
   return function(code) {
    let word = this.readWord1();
    let type = tt.name;
    if (this.keywords.test(word) || reserved[word]) {
     if (this.containsEsc) {
      this.raiseRecoverable(this.start, "Escape sequence in keyword " + word);
     }
     type = keywordTypes[word];
    }
    return this.finishToken(type, word);
   }
  })
};

function parse(code) {
 var comments = [];
 let tokens = [];

 var ast = acorn.parse(code, {
   plugins: {types: true},
   // collect ranges for each node
   ranges: true,
   // collect comments in Esprima's format
   onComment: comments,
   // collect token ranges
   onToken: tokens
  });

 // attach comments using collected information
 escodegen.attachComments(ast, comments, tokens);

 return ast;
}

// https://github.com/google/closure-compiler/wiki/Annotating-JavaScript-for-the-Closure-Compiler#type-expressions
function transpile(code) {
 let ast = parse(code);

 walk.simple(ast, {
   FunctionDeclaration(declaration) {
    let labels = declaration.params.map(({name, types}) => { 
      return {name: name, label: types.label};
     });

    let block = ["*"];

    for (let {name, label} of labels) {
     block.push(` * @param {${label}} ${name}`);
    }
    
    if (declaration.returns) {
     block.push(` * @return {${declaration.returns.label}}`);
    }

    block.push(" ");


    declaration.leadingComments = 
     declaration.leadingComments || [];
    declaration.leadingComments.push({
      type: "Block",
      value: block.join("\n")
    });
   },
   VariableDeclaration(declaration) {
    if (declaration.declarations &&
        declaration.declarations[0].types) {
     let type = declaration.declarations[0].types;
     declaration.leadingComments = 
      declaration.leadingComments || [];
     let label = type.label;
     if (label == "any") {
      label = "*";
     } else if (label == "object") {
      label = "Object";
     } else if (label == "void") {
      throw new Error("closure doesn't have void");
     }
     declaration.leadingComments.push({
       type: "Block",
       value: `*\n * @type {${label}}\n `
      });
    }
   }
  });

 let result = escodegen.generate(ast, {comment: true});
 return result;
}

describe("Parser", function() {
  it("Parsing variable declarations", function() {
    let ast = parse(`
      // hello world
      var x: number = 42;
    `);

    // generate code
    let result = escodegen.generate(ast, {comment: true});

    assertThat(result).equalsTo(`
// hello world
var x = 42; 
    `);
  });

  it("Parsing primitives in variable declarations", function() {
    parse("var x: number = 42;");
    parse("var x: boolean = true;");
    parse("var x: string = 'hello';");
    parse("var x: void;");
    parse("var x: any = 'hi';");
    parse("var x: undefined;");
    parse("var x: null;");
    parse("var x: object = {};");
  });

  it("Transpiling primitives in variable declarations", function() {
    assertThat(transpile("var x: number = 42;"))
     .equalsTo("/**\n * @type {number}\n */\nvar x = 42;");
    assertThat(transpile("var x: boolean = true;"))
     .equalsTo("/**\n * @type {boolean}\n */\nvar x = true;");
    assertThat(transpile("var x: string = 'hello';"))
     .equalsTo("/**\n * @type {string}\n */\nvar x = 'hello';");
    assertThat(transpile("var x: any = 'hi';"))
     .equalsTo("/**\n * @type {*}\n */\nvar x = 'hi';");
    assertThat(transpile("var x: object = {};"))
     .equalsTo("/**\n * @type {Object}\n */\nvar x = {};");
    assertThat(transpile("var x: undefined;"))
     .equalsTo("/**\n * @type {undefined}\n */\nvar x;");
    assertThat(transpile("var x: null;"))
     .equalsTo("/**\n * @type {null}\n */\nvar x;");

    try {
     transpile("var x: void;");
     fail("void isn't represented in closure");
    } catch (e) {
    }
  });

  it("Parsing comments", function() {
    let result = transpile(`
/** hello world **/
var x: number = 42;
`);

    assertThat(result).equalsTo(`
/** hello world **/
/**
 * @type {number}
 */
var x = 42;
    `);
  });

  it("Parsing params in function declarations", function() {
    parse("function add(a: number, b: string) {}");
    parse("function add(a: boolean, b: object) {}");
    parse("function add(a: null, b: undefined) {}");
    parse("function add(a: any, b: void) {}");
  });

  it("Transpiling params in function declarations", function() {
    assertThat(transpile("function add(a: number, b: string) {}"))
     .equalsTo(`
/**
 * @param {number} a
 * @param {string} b
 */
function add(a, b) {
}
`);
  });

  it("Parsing return types in function declarations", function() {
    parse("function add(): number {}");
  });

  it("Transpiling returns in function declarations", function() {
    assertThat(transpile("function add(): number {}"))
     .equalsTo(`
/**
 * @return {number}
 */
function add() {
}
`);
  });

  function assertThat(x) {
   return {
    equalsTo(y) {
     Assert.equal(x.trim(), y.trim());
    }
   }
  }
 });

