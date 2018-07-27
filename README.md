This is a [stage 0](https://tc39.github.io/process-document/) proposal to add a [pluggable type system](http://bracha.org/pluggableTypesPosition.pdf) to JavaScript.

A **pluggable** type system is a set of syntactical entrypoints that serve as type **annotations** (i.e. they have no observable semantics at runtime) that formally enable (i.e. without transpilation) optional type checking and inferencing to be defined and plugged-in from **userland** (e.g. typescript, flow and closure).

```javascript
function add(x: number, y: number): number {
    return x + y;
}
```

This is, at runtime, roughly semantically equivalent to:

```javascript
function add(x /*: number */, y /*: number */) /*: number */ {
    return x + y;
}
```

Since pluggable type systems have no observable semantics at runtime (as opposed to, say, [gradual](http://code.sgo.to/proposal-optional-types/FAQ.html#sound-gradual-typing) type systems), **all** of their benefits are **exclusively** materialized while writing code in code editors or reading code while debugging.

Pluggable type systems support:

1. vanilla javascript users
1. syntax-based type system users (e.g. typescript and flow)
1. comments-based type system users (e.g. closure)
1. a stepping stone towards a unified [optional type system](https://github.com/samuelgoto/proposal-optional-types)

For users, in isolation, the basic syntax of a pluggable type system enables **code navigation** (e.g. ctrl-click jumps to definition) in code editors (e.g. developer tools in browsers).

![](https://code.visualstudio.com/assets/docs/editor/editingevolved/ctrlhover.png)

For **syntax-based** type system users (e.g. typescript and flow), it empowers them enabling browsers/node (which takes vanilla javascript) to take typed code directly (i.e. without transpilation) and plug them in with developer tools (e.g. through a [language server protocol](https://github.com/Microsoft/language-server-protocol)).

![type checking](browser.png)

For [@comments-based](http://usejsdoc.org/) type systems user's (e.g. closure compiler, which, by design, wants to be strictly under the standard grammar), it enables them to move to natively supported syntax, improving ergonomics while still maintaining backwards compatibility with the existing type system. For example:

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

Could, with the proposed pluggable extension points, be written as:

```javascript
class Square implements Shape {
  ...
}
```

For TC39, pluggable type systems enable:

1. the delegation of the development/innovation of a type system to userland
1. the formalization of current norm
1. a stepping stone on the path towards finding unification ([example](http://code.sgo.to/proposal-optional-types/))

Having said that, the main **drawback** with pluggable type systems for TC39 it that they corner ourselves from gradual typing. We believe there is substantial evidence in the industry and academia that types can't incur in significant performance benefits.

# Syntax

# Object Type Literals

```javascript
var MakePoint: () => {  
    x: number; y: number;  
};
```

# Interfaces

Named object types are interfaces.

```javascript
interface Friend {  
    name: string;  
    favoriteColor?: string;  
}

function add(friend: Friend) {  
    var name = friend.name;  
}

add({ name: "Fred" });  // Ok  
add({ favoriteColor: "blue" });  // Error, name required  
add({ name: "Jill", favoriteColor: "green" });  // Ok
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

Shorthard for public:

```javascript
class BankAccount {  
    constructor(public balance: number) {  
    }  
    deposit(credit: number) {  
        this.balance += credit;  
        return this.balance;  
    }  
}
```

# Generics

```javascript
interface Array<T> {  
    reverse(): T[];  
    sort(compareFn?: (a: T, b: T) => number): T[];  
    // ...   
}
```


```javascript
map<U>(func: (value: T, index: number, array: T[]) => U, thisArg?: any): U[];
```

```javascript
interface NamedItem {  
    name: string;  
}

class List<T extends NamedItem> {  
    next: List<T> = null;

    constructor(public item: T) {  
    }

    insertAfter(item: T) {  
        var temp = this.next;  
        this.next = new List(item);  
        this.next.next = temp;  
    }

    log() {  
        console.log(this.item.name);  
    }

    // ...  
}
```


# Related Work

* Python's pluggable type system
* [An Optional Type System for JS](http://code.sgo.to/proposal-optional-types/)
