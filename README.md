# Multitree

**This is an experiment and should not be used yet!**

A multiwriter BitTree comprised of multiple input BitTrees using BitStream and Unichain v2 (all alpha software).

```js
import Chainstore from '@web4/chainstore'
import ram from 'random-access-memory'
import Multitree from '@web4/multitree' // not actually published

const store = new Chainstore(ram)
const writer1 = store.get({ name: 'writer1' })
const writer2 = store.get({ name: 'writer2' })
const index = store.get({ name: 'index' })

await writer1.ready()
await writer2.ready()

const multitree = new Multitree({inputs: [writer1, writer2], defaultInput: writer1, indexes: index})
await multitree.ready()

await multitree.put('a', 'writer1')
await multitree.put('b', 'writer1')
await multitree.get('a') => // {value: 'writer1', ...}
await multitree.get('b') => // {value: 'writer1', ...}

await multitree.tree(writer2).put('a', 'writer2')
await multitree.get('a') => // {value: 'writer2', ...}
await multitree.get('b') => // {value: 'writer1', ...}

await multitree.tree(writer2).del('a')
await multitree.del('a')
await multitree.get('a') => // null
await multitree.get('b') => // null
```

See the examples folder for more.

## License

MIT