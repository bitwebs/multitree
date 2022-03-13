import ava from 'ava'
import Chainstore from '@web4/chainstore'
import ram from 'random-access-memory'
import Autotree from '../index.js'

let store
let writer1
let index
let multitree

ava.before(async () => {
  store = new Chainstore(ram)
  writer1 = store.get({ name: 'writer1' })
  index = store.get({ name: 'index' })
  await writer1.ready()
  
  multitree = new Autotree({inputs: [writer1], defaultInput: writer1, indexes: index})
  await multitree.ready()
})

ava.serial('Write, read, delete values', async (t) => {
  await multitree.put('a', 'foo')
  await multitree.put('b', 'bar')
  t.is((await multitree.get('a')).value, 'foo')
  t.is((await multitree.get('b')).value, 'bar')
  t.is((await multitree.tree(writer1).get('a')).value, 'foo')
  t.is((await multitree.tree(writer1).get('b')).value, 'bar')

  for await (const item of multitree.createReadStream()) {
    if (item.key === 'a') t.is(item.value, 'foo')
    if (item.key === 'b') t.is(item.value, 'bar')
  }
  for await (const item of multitree.tree(writer1).createReadStream()) {
    if (item.key === 'a') t.is(item.value, 'foo')
    if (item.key === 'b') t.is(item.value, 'bar')
  }

  await multitree.put('b', 'BAR')
  await multitree.put('a', 'FOO')
  t.is((await multitree.get('a')).value, 'FOO')
  t.is((await multitree.get('b')).value, 'BAR')
  t.is((await multitree.tree(writer1).get('a')).value, 'FOO')
  t.is((await multitree.tree(writer1).get('b')).value, 'BAR')

  await multitree.del('a')
  await multitree.del('b')
  t.is(await multitree.get('a'), null)
  t.is(await multitree.get('b'), null)
  t.is(await multitree.tree(writer1).get('a'), null)
  t.is(await multitree.tree(writer1).get('b'), null)
})

ava.serial('Write, read, delete sub() values', async (t) => {
  await multitree.sub('test').put('a', 'foo')
  await multitree.sub('test').put('b', 'bar')
  t.is((await multitree.sub('test').get('a')).value, 'foo')
  t.is((await multitree.sub('test').get('b')).value, 'bar')
  t.is((await multitree.tree(writer1).sub('test').get('a')).value, 'foo')
  t.is((await multitree.tree(writer1).sub('test').get('b')).value, 'bar')

  for await (const item of multitree.sub('test').createReadStream()) {
    if (item.key === 'a') t.is(item.value, 'foo')
    if (item.key === 'b') t.is(item.value, 'bar')
  }
  for await (const item of multitree.tree(writer1).sub('test').createReadStream()) {
    if (item.key === 'a') t.is(item.value, 'foo')
    if (item.key === 'b') t.is(item.value, 'bar')
  }

  await multitree.sub('test').put('b', 'BAR')
  await multitree.sub('test').put('a', 'FOO')
  await multitree.sub('test2').put('a', 'another')
  await multitree.sub('test2').put('b', 'value')
  t.is((await multitree.sub('test').get('a')).value, 'FOO')
  t.is((await multitree.sub('test').get('b')).value, 'BAR')
  t.is((await multitree.sub('test2').get('a')).value, 'another')
  t.is((await multitree.sub('test2').get('b')).value, 'value')
  t.is((await multitree.tree(writer1).sub('test').get('a')).value, 'FOO')
  t.is((await multitree.tree(writer1).sub('test').get('b')).value, 'BAR')
  t.is((await multitree.tree(writer1).sub('test2').get('a')).value, 'another')
  t.is((await multitree.tree(writer1).sub('test2').get('b')).value, 'value')

  await multitree.sub('test').del('a')
  await multitree.sub('test').del('b')
  t.is(await multitree.sub('test').get('a'), null)
  t.is(await multitree.sub('test').get('b'), null)
  t.is((await multitree.sub('test2').get('a')).value, 'another')
  t.is((await multitree.sub('test2').get('b')).value, 'value')
  t.is(await multitree.tree(writer1).sub('test').get('a'), null)
  t.is(await multitree.tree(writer1).sub('test').get('b'), null)
  t.is((await multitree.tree(writer1).sub('test2').get('a')).value, 'another')
  t.is((await multitree.tree(writer1).sub('test2').get('b')).value, 'value')
})