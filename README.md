This is a [stage 0](https://tc39.github.io/process-document/) proposal to add a [pluggable type system](http://bracha.org/pluggableTypesPosition.pdf) to JavaScript.

A **pluggable** type system is a set of syntactical entrypoints that serve as type **annotations** (i.e. they have no observable semantics at runtime) that formally enable (i.e. without transpilation) optional type checking and inferencing to be defined and plugged-in from **userland** (e.g. typescript, flow and closure).

```javascript
function add(x: number, y: number): number {
    return x + y;
}
```

Is equivalent to:

```javascript
function add(x /*: number */, y /*: number */) /*: number */ {
    return x + y;
}
```

You **bind** a type system plugin to code by using a **to-be-determined-at-stage-2** convention. Current examples are [```// @flow```](https://flow.org/en/docs/usage/#toc-prepare-your-code-for-flow) comment annotations or file extensions (e.g. [```.flow```](https://github.com/facebook/flow/issues/1996#issuecomment-230919868) or ```.ts```).

```javascript
// @flow
```

Or possibly a new ```jsdoc``` reserved tag pointing to an opaque URL:

```javascript
/**
 * This class abstracts X, Y and Z.
 *
 * @types https://www.typescriptlang.org/
 */
```

Pluggable type systems have no type checking/enforcement at runtime (as opposed to, say, [gradual](http://code.sgo.to/proposal-optional-types/FAQ.html#sound-gradual-typing) type systems). Their benefits are **mostly**\* materialized while writing/reading code.

\* e.g. a future run-time type reflection API isn't necessarily conflicting with this formulation of pluggable types.

Pluggable type systems support:

1. typescript/flow users
1. closure users
1. vanilla javascript users
1. TC39

For **syntax-based** type system users (e.g. typescript and flow), it empowers them by making them part of a supported/compatible/standard language extension (type system plugins), enabling browsers/node (which takes vanilla javascript) to take typed code directly (i.e. without transpilation) and plug them in with developer tools (e.g. through a [language server protocol](https://github.com/Microsoft/language-server-protocol)).

![type checking](browser.png)

For [@comments-based](http://usejsdoc.org/) type systems user's (e.g. closure compiler, which, by design, wants to be strictly under the standard grammar), it enables them to move to natively supported syntax, improving ergonomics while still maintaining **backwards compatibility** with their existing type system. For example:

```javascript
/**
 * @constructor
 * @implements {Shape}
 */
function Square() {};
Square.prototype.draw = function() {
  ...
};
```

Which, with the syntax extensions, enables them to be written as:

```javascript
class Square implements Shape {
  ...
}
```

For users, in isolation, the basic syntax of a pluggable type systems enables **code navigation** (e.g. ctrl-click jumps to definition) in code editors (e.g. developer tools in browsers).

![](https://code.visualstudio.com/assets/docs/editor/editingevolved/ctrlhover.png)

For TC39, pluggable type systems enable:

1. the autonomy to steer **convergence** on syntax of type systems at TC39 
1. the **delegation** of the development/innovation of type **semantics** to userland
1. the formalization of **current norm** (e.g. officializes typescript/flow as type system plugins rather than incompatible languages)
1. a **stepping stone** on the path towards finding a unified [optional type system](http://code.sgo.to/proposal-optional-types/)

Having said that, the main **drawback** with pluggable type systems for TC39 it that they corner ourselves from **gradual typing** (i.e. once introduced without runtime type checking, they can't add them afterwards without introducing extra syntax).

We believe, however, that there is significant evidence in the research literature that gradual typing incurs a significant performance penalty, which makes it impractical. In addition, TypeScript, Flow, and Closure Compiler have demonstrated that optional typing works well for JS at scale.

# Syntax

In this proposal, we describe syntactical extensions that enables type plugins to define semantics. At runtime, every extension below is semantically sequivalent to wrapping them in ```/* */``` comments.

# Variables

```javascript
let isDone: boolean = false;
let decimal: number = 6;
let hex: number = 0xf00d;
let binary: number = 0b1010;
let octal: number = 0o744;
let color: string = "blue";
let list: number[] = [1, 2, 3];
let x: [string, number] = ["hello", 10]; // tuples
let notsure: any = 4;
let u: undefined = undefined;
let n: null = null;
```

# Functions

```javascript
function add(x: number, y: number): number {
    return x + y;
}

let mul: (x: number, y: number) => number =
    function(x: number, y: number): number { return x * y; };

function vote(candidate: string, callback: (result: string) => any) {  
   // ...  
}
```

Optional parameters:

```javascript
function buildName(firstName: string, lastName?: string) {
  if (lastName) {
    return firstName + " " + lastName;
  } else {
    return firstName;
  }
}
```

# Classes

```javascript
class BankAccount {  
  balance: number;  
  constructor(initially: number) {  
    this.balance = initially;  
  }  
  deposit(credit: number) {  
    this.balance += credit;  
    return this.balance;  
  }  
}
```

# Interfaces

```javascript
interface Timer {
  currentTime: Date;
  setTime(d: Date);
}

class Clock implements Timer {
  ...
}
```

# Generics

```javascript
interface Array<T> {  
    reverse(): T[];  
    sort(compareFn?: (a: T, b: T) => number): T[];  
    // ...   
}

function identity<T>(arg: T): T {
    return arg;
}

class GenericNumber<T> {
    zeroValue: T;
    add: (x: T, y: T) => T;
}
```

# Related Work

* [Other languages](http://code.sgo.to/proposal-optional-types/FAQ.html#other-languages)
* [TC39 discussions](http://code.sgo.to/proposal-optional-types/FAQ.html#tc39-discussions)
* [An Optional Type System for JS](http://code.sgo.to/proposal-optional-types/)
