import Chainstore from '@web4/chainstore'
import ram from 'random-access-memory'
import Multitree from '../index.js'

const store = new Chainstore(ram)
const writer1 = store.get({ name: 'writer1' })
const index = store.get({ name: 'index' })

await writer1.ready()

const multitree = new Multitree({inputs: [writer1], defaultInput: writer1, indexes: index})
await multitree.ready()

console.log('Writing a and b')
await multitree.put('a', {foo: 'bar'})
await multitree.put('b', {foo: 'baz'})
console.log('MERGED a=', await multitree.get('a'))
console.log('MERGED b=', await multitree.get('b'))
console.log('WRITER1 a=', await multitree.tree(writer1).get('a'))
console.log('WRITER1 b=', await multitree.tree(writer1).get('b'))
console.log('')

console.log('Reading as stream')
for await (const item of multitree.createReadStream()) {
  console.log('MERGED', item)
}
for await (const item of multitree.tree(writer1).createReadStream()) {
  console.log('WRITER1', item)
}
console.log('')

console.log('Overwriting a and b')
await multitree.put('b', {foo: 'BAZ'})
await multitree.put('a', {foo: 'BAR'})
console.log('MERGED a=', await multitree.get('a'))
console.log('MERGED b=', await multitree.get('b'))
console.log('WRITER1 a=', await multitree.tree(writer1).get('a'))
console.log('WRITER1 b=', await multitree.tree(writer1).get('b'))
console.log('')

console.log('Deleting a and b')
await multitree.del('a')
await multitree.del('b')
console.log('MERGED a=', await multitree.get('a'))
console.log('MERGED b=', await multitree.get('b'))
console.log('WRITER1 a=', await multitree.tree(writer1).get('a'))
console.log('WRITER1 b=', await multitree.tree(writer1).get('b'))
console.log('')
