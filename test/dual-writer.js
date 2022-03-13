import ava from 'ava'
import Chainstore from '@web4/chainstore'
import ram from 'random-access-memory'
import Multitree from '../index.js'

let store
let writer1
let writer2
let index
let multitree

ava.before(async () => {
  store = new Chainstore(ram)
  writer1 = store.get({ name: 'writer1' })
  writer2 = store.get({ name: 'writer2' })
  index = store.get({ name: 'index' })
  await writer1.ready()
  await writer2.ready()
  
  multitree = new Multitree({inputs: [writer1, writer2], defaultInput: writer1, indexes: index})
  await multitree.ready()
})

ava.serial('Write, read, delete values', async (t) => {
  await multitree.put('a', 'writer1')
  await multitree.put('b', 'writer1')
  t.is((await multitree.get('a')).value, 'writer1')
  t.is((await multitree.get('b')).value, 'writer1')
  t.is((await multitree.tree(writer1).get('a')).value, 'writer1')
  t.is((await multitree.tree(writer1).get('b')).value, 'writer1')
  t.is(await multitree.tree(writer2).get('a'), null)
  t.is(await multitree.tree(writer2).get('b'), null)

  for await (const item of multitree.createReadStream()) {
    if (item.key === 'a') t.is(item.value, 'writer1')
    if (item.key === 'b') t.is(item.value, 'writer1')
  }

  await multitree.tree(writer2).put('b', 'writer2')
  await multitree.tree(writer2).put('a', 'writer2')
  t.is((await multitree.get('a')).value, 'writer2')
  t.is((await multitree.get('b')).value, 'writer2')
  t.is((await multitree.tree(writer1).get('a')).value, 'writer1')
  t.is((await multitree.tree(writer1).get('b')).value, 'writer1')
  t.is((await multitree.tree(writer2).get('a')).value, 'writer2')
  t.is((await multitree.tree(writer2).get('b')).value, 'writer2')

  for await (const item of multitree.createReadStream()) {
    if (item.key === 'a') t.is(item.value, 'writer2')
    if (item.key === 'b') t.is(item.value, 'writer2')
  }

  await multitree.tree(writer1).put('a', 'writer1')
  await multitree.tree(writer2).put('b', 'writer2')
  t.is((await multitree.get('a')).value, 'writer1')
  t.is((await multitree.get('b')).value, 'writer2')
  t.is((await multitree.tree(writer1).get('a')).value, 'writer1')
  t.is((await multitree.tree(writer1).get('b')).value, 'writer1')
  t.is((await multitree.tree(writer2).get('a')).value, 'writer2')
  t.is((await multitree.tree(writer2).get('b')).value, 'writer2')

  for await (const item of multitree.createReadStream()) {
    if (item.key === 'a') t.is(item.value, 'writer1')
    if (item.key === 'b') t.is(item.value, 'writer2')
  }

  await multitree.tree(writer1).del('a')
  await multitree.tree(writer2).del('b')
  t.is(await multitree.get('a'), null)
  t.is(await multitree.get('b'), null)
  t.is(await multitree.tree(writer1).get('a'), null)
  t.is((await multitree.tree(writer1).get('b')).value, 'writer1')
  t.is((await multitree.tree(writer2).get('a')).value, 'writer2')
  t.is(await multitree.tree(writer2).get('b'), null)
})

ava.serial('Write, read, delete sub() values', async (t) => {
  await multitree.sub('test').put('a', 'writer1')
  await multitree.sub('test').put('b', 'writer1')
  t.is((await multitree.sub('test').get('a')).value, 'writer1')
  t.is((await multitree.sub('test').get('b')).value, 'writer1')
  t.is((await multitree.tree(writer1).sub('test').get('a')).value, 'writer1')
  t.is((await multitree.tree(writer1).sub('test').get('b')).value, 'writer1')
  t.is(await multitree.tree(writer2).sub('test').get('a'), null)
  t.is(await multitree.tree(writer2).sub('test').get('b'), null)

  for await (const item of multitree.sub('test').createReadStream()) {
    if (item.key === 'a') t.is(item.value, 'writer1')
    if (item.key === 'b') t.is(item.value, 'writer1')
  }

  await multitree.tree(writer2).sub('test').put('b', 'writer2')
  await multitree.tree(writer2).sub('test').put('a', 'writer2')
  t.is((await multitree.sub('test').get('a')).value, 'writer2')
  t.is((await multitree.sub('test').get('b')).value, 'writer2')
  t.is((await multitree.tree(writer1).sub('test').get('a')).value, 'writer1')
  t.is((await multitree.tree(writer1).sub('test').get('b')).value, 'writer1')
  t.is((await multitree.tree(writer2).sub('test').get('a')).value, 'writer2')
  t.is((await multitree.tree(writer2).sub('test').get('b')).value, 'writer2')

  for await (const item of multitree.sub('test').createReadStream()) {
    if (item.key === 'a') t.is(item.value, 'writer2')
    if (item.key === 'b') t.is(item.value, 'writer2')
  }

  await multitree.tree(writer1).sub('test').put('a', 'writer1')
  await multitree.tree(writer2).sub('test').put('b', 'writer2')
  t.is((await multitree.sub('test').get('a')).value, 'writer1')
  t.is((await multitree.sub('test').get('b')).value, 'writer2')
  t.is((await multitree.tree(writer1).sub('test').get('a')).value, 'writer1')
  t.is((await multitree.tree(writer1).sub('test').get('b')).value, 'writer1')
  t.is((await multitree.tree(writer2).sub('test').get('a')).value, 'writer2')
  t.is((await multitree.tree(writer2).sub('test').get('b')).value, 'writer2')

  for await (const item of multitree.sub('test').createReadStream()) {
    if (item.key === 'a') t.is(item.value, 'writer1')
    if (item.key === 'b') t.is(item.value, 'writer2')
  }

  await multitree.tree(writer1).sub('test').del('a')
  await multitree.tree(writer2).sub('test').del('b')
  t.is(await multitree.sub('test').get('a'), null)
  t.is(await multitree.sub('test').get('b'), null)
  t.is(await multitree.tree(writer1).sub('test').get('a'), null)
  t.is((await multitree.tree(writer1).sub('test').get('b')).value, 'writer1')
  t.is((await multitree.tree(writer2).sub('test').get('a')).value, 'writer2')
  t.is(await multitree.tree(writer2).sub('test').get('b'), null)
})