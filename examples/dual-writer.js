import Chainstore from '@web4/chainstore'
import ram from 'random-access-memory'
import Multitree from '../index.js'

const store = new Chainstore(ram)
const writer1 = store.get({ name: 'writer1' })
const writer2 = store.get({ name: 'writer2' })
const index = store.get({ name: 'index' })

await writer1.ready()
await writer2.ready()

const multitree = new Multitree({inputs: [writer1, writer2], defaultInput: writer1, indexes: index})
await multitree.ready()

console.log('Writing a and b as writer 1')
await multitree.put('a', {foo: 'writer1'})
await multitree.put('b', {foo: 'writer1'})
console.log('MERGED a=', await multitree.get('a'))
console.log('MERGED b=', await multitree.get('b'))
console.log('WRITER1 a=', await multitree.tree(writer1).get('a'))
console.log('WRITER1 b=', await multitree.tree(writer1).get('b'))
console.log('WRITER2 a=', await multitree.tree(writer2).get('a'))
console.log('WRITER2 b=', await multitree.tree(writer2).get('b'))
console.log('')

console.log('Writing a and b as writer 2')
await multitree.tree(writer2).put('a', {foo: 'writer2'})
await multitree.tree(writer2).put('b', {foo: 'writer2'})
console.log('MERGED a=', await multitree.get('a'))
console.log('MERGED b=', await multitree.get('b'))
console.log('WRITER1 a=', await multitree.tree(writer1).get('a'))
console.log('WRITER1 b=', await multitree.tree(writer1).get('b'))
console.log('WRITER2 a=', await multitree.tree(writer2).get('a'))
console.log('WRITER2 b=', await multitree.tree(writer2).get('b'))
console.log('')

console.log('Reading as stream')
for await (const item of multitree.createReadStream()) {
  console.log('MERGED', item)
}
for await (const item of multitree.tree(writer1).createReadStream()) {
  console.log('WRITER1', item)
}
for await (const item of multitree.tree(writer2).createReadStream()) {
  console.log('WRITER2', item)
}
console.log('')

console.log('Overwriting a and b, one with each writer')
await multitree.put('b', {foo: 'writer1'})
await multitree.tree(writer2).put('a', {foo: 'writer2'})
console.log('MERGED a=', await multitree.get('a'))
console.log('MERGED b=', await multitree.get('b'))
console.log('WRITER1 a=', await multitree.tree(writer1).get('a'))
console.log('WRITER1 b=', await multitree.tree(writer1).get('b'))
console.log('WRITER2 a=', await multitree.tree(writer2).get('a'))
console.log('WRITER2 b=', await multitree.tree(writer2).get('b'))
console.log('')

console.log('Deleting a and b, one with each writer')
await multitree.del('a')
await multitree.tree(writer2).del('b')
console.log('MERGED a=', await multitree.get('a'))
console.log('MERGED b=', await multitree.get('b'))
console.log('WRITER1 a=', await multitree.tree(writer1).get('a'))
console.log('WRITER1 b=', await multitree.tree(writer1).get('b'))
console.log('WRITER2 a=', await multitree.tree(writer2).get('a'))
console.log('WRITER2 b=', await multitree.tree(writer2).get('b'))
