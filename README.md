# Demonstration of a memory leak in prisma

## Usage

- `yarn install`
- `yarn prisma db push`
- `yarn run start:dev`

## Behavior

This loops forever doing a bunch of prisma ops.
Every 30 seconds, memory stats are logged.

See `doOnePrimsaLoop()` for the operations performed.
It's a mix of:

- `create()` with nested `createMany()`
- `$queryRaw()` to update some of the created records
- `$transaction()` to delete what was just created

## Leak

The RSS increases by 0.8 Mb/min when left running.
Here's a 27 hour run:
https://docs.google.com/spreadsheets/d/1TPP-h-zk86fHhLOShuDtfZVF999_oqGrb05BSf0zPdA/edit#gid=34165034
