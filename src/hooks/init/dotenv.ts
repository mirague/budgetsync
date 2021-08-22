import {Hook} from '@oclif/config'

const hook: Hook<'init'> = async function (opts) {
  require('dotenv').config()
}

export default hook
