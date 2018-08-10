const Assert = require("assert");
const acorn = require("acorn");
const tt = acorn.tokTypes;
const {TokenType, keywordTypes} = acorn;
const escodegen = require("escodegen");

tt.number = keywordTypes.number = new TokenType("number", {keyword: "number"});

// console.log(tt.number);

// console.log(acorn.keywordTypes);
// console.log(TokenType);
// console.log(tt.number);

describe("Parser", function() {
  it("Parsing basic", function() {

    acorn.plugins.types = function(parser) {
     parser.extend("parseVarId", function(nextMethod) {
       return function(decl, kind) {
        decl.id = this.parseBindingAtom(kind);
        if (this.eat(tt.colon)) {
         if (!this.eat(tt.number)) {
          this.raise(this.pos, "Expected a type declaration");
          return;
         }

         let node = this.startNode();
         node.label = tt.number.label;
         decl.types = this.finishNode(node, "TypeDeclaration");
        }
        
        this.checkLVal(decl.id, kind, false)
       };
      });

     parser.extend("readWord", function(nextMethod) {
       return function(code) {
        let word = this.readWord1();
        let type = tt.name;
        // console.log(word);
        if (this.keywords.test(word) ||
            word == "number") {
         if (this.containsEsc) {
          this.raiseRecoverable(this.start, "Escape sequence in keyword " + word);
         }
         type = keywordTypes[word];
        }
        return this.finishToken(type, word);
       }
      })
    };


    // debugger;

    var comments = [];
    let tokens = [];

    let code = `
// hello world
var x: number = 42;
    `;
    
    var ast = acorn.parse(code, {
      plugins: {types: true},
      // collect ranges for each node
      ranges: true,
      // collect comments in Esprima's format
      onComment: comments,
      // collect token ranges
      onToken: tokens
     });

    // console.log(comments);

    // attach comments using collected information
    escodegen.attachComments(ast, comments, tokens);

    // generate code
    let result = escodegen.generate(ast, {comment: true});

    // console.log(Assert);

    assertThat(result).equalsTo(`
// hello world
var x = 42; 
    `);

    // console.log(JSON.stringify(ast, undefined, 2));
  });

  function assertThat(x) {
   return {
    equalsTo(y) {
     Assert.equal(x.trim(), y.trim());
    }
   }
  }
 });

