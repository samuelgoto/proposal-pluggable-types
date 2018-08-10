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
 parser.extend("parseVarId", function(nextMethod) {
   return function(decl, kind) {
    decl.id = this.parseBindingAtom(kind);
    if (this.eat(tt.colon)) {
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

     decl.types = this.finishNode(node, "TypeDeclaration");
    }
        
    this.checkLVal(decl.id, kind, false)
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

function transpile(ast) {
 walk.simple(ast, {
   VariableDeclaration(declaration) {
    if (declaration.declarations &&
        declaration.declarations[0].types) {
     let type = declaration.declarations[0].types;
     declaration.leadingComments.push({
       type: "Block",
       value: `* @type {${type.label}} *`
      });
    }
   }
  });
}

describe("Parser", function() {
  it("Parsing basic", function() {
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

  it("Parsing primitives", function() {
    parse("var x: number = 42;");
    parse("var x: boolean = true;");
    parse("var x: string = 'hello';");
    parse("var x: void;");
    parse("var x: any = 'hi';");
    parse("var x: undefined;");
    parse("var x: null;");
  });

  it("Parsing comments", function() {
    let ast = parse(`
      /** hello world **/
      var x: number = 42;
    `);

    transpile(ast);

    let result = escodegen.generate(ast, {comment: true});
    assertThat(result).equalsTo(`
/** hello world **/
/** @type {number} **/
var x = 42;
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

