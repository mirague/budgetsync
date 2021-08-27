budgetsync
==========

Sync budget info.

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/budgetsync.svg)](https://npmjs.org/package/budgetsync)
[![Downloads/week](https://img.shields.io/npm/dw/budgetsync.svg)](https://npmjs.org/package/budgetsync)
[![License](https://img.shields.io/npm/l/budgetsync.svg)](https://github.com/mirague/budgetsync/blob/master/package.json)

<!-- toc -->
* [Installation](#installation)
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->

# Installation
1. `yarn` or `npm install`
2. `cp .env.example .env`
3. Update `.env` file with values.
4. Read how to [Setup Nordigen credentials](https://nordigen.com/en/account_information_documenation/integration/quickstart_guide/)
5. Read how to [Setup Avanza credentials](https://github.com/fhqvst/avanza)
6. Read how to [Setup Google Spreadsheet credentials](https://www.section.io/engineering-education/google-sheets-api-in-nodejs/)
7. Done! See usage down below

## Sample CRONTAB
Example for running all commands every hour
```sh-session
crontab -e

0 */1 * * * cd ~/budgetsync && ./bin/run bank
0 */1 * * * cd ~/budgetsync && ./bin/run crypto
0 */1 * * * cd ~/budgetsync && ./bin/run avanza
```

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

Sync investments holding value from Avanza to YNAB tracking account

```
USAGE
  $ budgetsync avanza
```

_See code: [src/commands/avanza.ts](https://github.com/mirague/budgetsync/blob/v0.0.0/src/commands/avanza.ts)_

## `budgetsync bank`

Import transactions from Nordigen to YNAB

```
USAGE
  $ budgetsync bank
```

_See code: [src/commands/bank.ts](https://github.com/mirague/budgetsync/blob/v0.0.0/src/commands/bank.ts)_

## `budgetsync crypto`

Sync Crypto holdings from a Google Sheet to YNAB tracking account

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
