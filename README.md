This is a [stage 0](https://tc39.github.io/process-document/) proposal to add a [pluggable type system](http://bracha.org/pluggableTypesPosition.pdf) to JavaScript.

* Authors: @samuelgoto, @dimvar, @gbracha
* Early reviewers: 

A **pluggable** type system is a set of syntactical entrypoints that serve as type **annotations** (i.e. they have no observable semantics at runtime) that formally enable (i.e. without transpilation) optional type checking and inferencing to be plugged-in from **userland** (e.g. typescript, flow and closure).

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

Since pluggable type systems have no observable semantics at runtime (as opposed to [gradual](http://code.sgo.to/proposal-optional-types/FAQ.html#sound-gradual-typing) type systems), **all** of their benefits are materialized while writing code in code editors or reading code while debugging (as opposed to runtime implementations).

In isolation, exclusively with the syntactical annotations (e.g. standard JavaScript), a pluggable type system enables in editors and debugger (e.g. browsers):

![autocompletion](autocomplete.png)

- code navigation
- code autocompletion
- structural type checking (todo(goto): sanity check with @dimvar?)
- type checking for enums and primitives (todo(goto): sanity check with @dimvar?)

In collaboration with userland type systems, a pluggable type system enables:

- innovation of type systems to happen in userland
- unification of syntax between type systems
- a **stepping stone** towards a unified [optional type system](http://code.sgo.to/proposal-optional-types/)

Importantly, pluggable type systems are a normative formalization of current practices (typescript and flow).

The main drawback with pluggable type systems it that they corner ourselves from gradual typing. We believe there is substantial evidence in the industry and academia that types can't incur in significant performance benefits.

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
