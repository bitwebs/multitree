import codecs from 'codecs'
import Bitstream from '@web4/bitstream'
import { InputNode } from '@web4/bitstream/lib/nodes/index.js'
import Bittree from '@web4/bittree'
import BittreeMessages from '@web4/bittree/lib/messages.js'

export default class Multitree {
  constructor ({inputs, defaultInput, indexes, valueEncoding} = {}) {
    inputs = inputs || []
    valueEncoding = valueEncoding || 'json'
    this._valueEncoding = valueEncoding
    this._valueEncoder = codecs(valueEncoding)
    
    this.bitstream = new Bitstream(inputs, {indexes, input: defaultInput})

    // TODO should this.index possibly come from indexes?
    this.index = this.bitstream.createRebasedIndex({
      unwrap: true,
      apply: this._apply.bind(this)
    })

    this._inputTrees = new Map()
    this.indexTree = new Bittree(this.index, {
      extension: false,
      keyEncoding: 'utf-8',
      valueEncoding
    })
  }

  async ready () {
    await this.bitstream.ready()
  }

  get writable () {
    return !!this.bitstream.inputs.find(chain => chain.writable)
  }

  get config () {
    return {
      inputs: this.bitstream.inputs,
      defaultInput: this.bitstream.defaultInput,
      defaultIndexes: this.defaultIndexes
    }
  }

  tree (key) {
    if (key.key) {
      // was given a unichain
      key = key.key
    }

    let keyBuf, keyStr
    if (Buffer.isBuffer(key)) {
      keyBuf = key
      keyStr = key.toString('hex')
    } else {
      keyBuf = Buffer.from(key, 'hex')
      keyStr = key
    }
    if (!this._inputTrees.has(keyStr)) {
      const chain = this.bitstream.inputs.find(chain => chain.key.equals(keyBuf))
      if (!chain) throw new Error('Not an input')
      const tree = new Bittree(chain, {extension: false, keyEncoding: 'utf-8', valueEncoding: this._valueEncoding})
      modifyTree(tree, this.bitstream)
      this._inputTrees.set(keyStr, tree)
    }
    return this._inputTrees.get(keyStr)
  }

  get defaultTree () {
    if (!this.bitstream.defaultInput) throw new Error('No default input has treen set')
    return this.tree(this.bitstream.defaultInput.key)
  }

  addInput (input) {
    if (this.bitstream.inputs.find(chain => chain.key.equals(input.key))) {
      return
    }
    this.bitstream.addInput(input)
  }

  removeInput (input) {
    if (!this.bitstream.inputs.find(chain => chain.key.equals(input.key))) {
      return
    }
    this._inputTrees.delete(input.key.toString('hex'))
    this.bitstream.removeInput(input)
  }

  async get (...args) {
    return await this.indexTree.get(...args)
  }

  createReadStream (...args) {
    return this.indexTree.createReadStream(...args)
  }

  async put (...args) {
    return await this.defaultTree.put(...args)
  }

  async del (...args) {
    return await this.defaultTree.del(...args)
  }

  sub (prefix, opts) {
    const indexTreeSub = this.indexTree.sub(prefix, opts)
    const defaultTreeSub = this.defaultTree.sub(prefix, opts)
    indexTreeSub.put = defaultTreeSub.put.bind(defaultTreeSub)
    indexTreeSub.del = defaultTreeSub.del.bind(defaultTreeSub)
    return indexTreeSub
  }

  async _apply (batch) {
    const b = this.indexTree.batch({ update: false })
    for (const node of batch) {
      let op = undefined
      try {
        op = BittreeMessages.Node.decode(node.value)
      } catch (e) {
        // skip: this is most likely the header message
        continue
      }

      // TODO: handle conflicts

      if (op.key) {
        const key = op.key.toString('utf-8')
        const value = op.value ? this._valueEncoder.decode(op.value) : undefined
        if (value) await b.put(key, value)
        else await b.del(key)
      } 
    }
    await b.flush()
  }
}

function modifyTree (tree, bitstream) {
  // HACK
  // we proxy the chain given to tree to abstract away all of the bitstream wrapping
  // there's probably a better way to do this!
  // -prf
  const chain = tree._feed
  tree._feed = new Proxy(chain, {
    get (target, prop) {
      if (prop === 'append') {
        return v => {
          return bitstream.append(v, null, chain)
        }
      } else if (prop === 'get') {
        return async (index, opts) => {
          opts = opts || {}
          const _valueEncoding = opts.valueEncoding
          opts.valueEncoding = {
            buffer: true,
            encodingLength: () => {},
            encode: () => {},
            decode: (buf, offset, end) => {
              try {
                const parsed = InputNode.decode(buf)
                buf = parsed.value
              } catch (e) {
                // this should never happen?
                console.log('uhoh', e)
              }
              return _valueEncoding ? _valueEncoding.decode(buf, 0, buf.length) : args[0]
            }
          }
          return await chain.get(index + 1, opts)
        }
      } else if (prop === 'length') {
        return Math.max(0, chain.length - 1)
      }
      return chain[prop]
    }
  })
}
