budgetsync
==========

Sync budget info.

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/budgetsync.svg)](https://npmjs.org/package/budgetsync)
[![Downloads/week](https://img.shields.io/npm/dw/budgetsync.svg)](https://npmjs.org/package/budgetsync)
[![License](https://img.shields.io/npm/l/budgetsync.svg)](https://github.com/mirague/budgetsync/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g budgetsync
$ budgetsync COMMAND
running command...
$ budgetsync (-v|--version|version)
budgetsync/0.0.0 darwin-x64 node-v15.14.0
$ budgetsync --help [COMMAND]
USAGE
  $ budgetsync COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`budgetsync avanza`](#budgetsync-avanza)
* [`budgetsync bank`](#budgetsync-bank)
* [`budgetsync crypto`](#budgetsync-crypto)
* [`budgetsync help [COMMAND]`](#budgetsync-help-command)

## `budgetsync avanza`

sync Avanza holdings to YNAB tracking account

```
USAGE
  $ budgetsync avanza
```

_See code: [src/commands/avanza.ts](https://github.com/mirague/budgetsync/blob/v0.0.0/src/commands/avanza.ts)_

## `budgetsync bank`

import transactions from Nordigen to YNAB

```
USAGE
  $ budgetsync bank
```

_See code: [src/commands/bank.ts](https://github.com/mirague/budgetsync/blob/v0.0.0/src/commands/bank.ts)_

## `budgetsync crypto`

sync Crypto holdings to YNAB tracking account

```
USAGE
  $ budgetsync crypto
```

_See code: [src/commands/crypto.ts](https://github.com/mirague/budgetsync/blob/v0.0.0/src/commands/crypto.ts)_

## `budgetsync help [COMMAND]`

display help for budgetsync

```
USAGE
  $ budgetsync help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.3/src/commands/help.ts)_
<!-- commandsstop -->
