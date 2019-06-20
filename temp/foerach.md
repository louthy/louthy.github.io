[Response to twitter thread](https://twitter.com/korifey_ad/status/1141257997886337024)

> 'Typical foreach looks no different'

They are different, the `foreach` approach is full of unnecessary boilerplate for many operations.  If you have a first-class function for the ForEach handler then:
```c#
    things.ForEach(YourFunc);
```
Is easier than:
```c#
    foreach(var thing in things)
    {
        YourFunc(thing);
    }
```
It is declarative, and therefore better (i.e. easier on the programmer's eye and brain).

> '.foreach' postfix template in ReSharper

This can be dismissed away from general advice, not everybody uses ReSharper.

> Support for continue and break

Most people writing code functionally would avoid this approach, and it's lack of availability for ForEach would therefore be considered a good thing.  In [language-ext](https://github.com/louthy/language-ext) you would use `things.Where(...)` or `things.Filter(...)` for `continue` and `things.FoldWhile(...)` or `things.FoldUntil(...)` for `break`.  They're not exactly the same, because of the imperative nature of `break` and `continue` (essentially `goto` in disguise); but anybody trying to write more reliable code would want to break their code into declarative stages of `Where\Filter`, `Select\Map`, `Aggregate\Fold`, etc.

> You can't do ForEach over all things

Not true.  Anyone can build an extension method for any type that provides a `ForEach` implementation.

> ForEach generates unnecessary closures

They're clearly necessary ;)  But it's true closures do allocate.  However they will be shortlived and in GC gen 0, so cleaned up with the minimal of fuss.  This argument is one to never use lambdas, or memory allocation.  Which for the vast majority of cases is overzealous.  I agree that you don't want unnecessary allocations for performance sensitive code, but mostly this is bad general advice.  Code should be written to survive until tomorrow - with optimisations happening later on.  It's an amatuerish mistake to optimise too early.  I learned that mistake very early in my career.

> With foreach you're throwing away all of the optimisations that foreach can do

Erm, usually `ForEach` is implemented as a `foreach`.  Seems an odd statement.  [Enumerators](https://github.com/microsoft/referencesource/blob/master/mscorlib/system/collections/generic/list.cs#L569) are being reimplemented as [structs](https://github.com/microsoft/referencesource/blob/master/mscorlib/system/collections/generic/list.cs#L1140) now and so there's no allocation cost to the enumerator.  Again, this is promoting premature optimisation, not a good idea.

> CLR performs caching

The `ForEach` could be implemented for each type - It can do more with each type directly rather than the default `IEnumerable` implementation.  That would be a better approach to optimising, I think. 

Most of this seems to focus on getting the last few nanoseconds out of an iteration.  Which is laudable, but I think it's mostly terrible general advice.  As code bases get larger, most teams value reliability, maintainability, and readability over outright performance.  

That's why I wrote [language-ext](https://github.com/louthy/language-ext) - because super large applications need better tools to help the weak programmer brain.  In language-ext `ForEach` is called `Iter`, by the way :) 
