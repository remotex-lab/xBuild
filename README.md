# @remotex-labs/xbuild

`@remotex-labs/xbuild` is a versatile TypeScript toolchain build system

## Installation

Install `@remotex-labs/xbuild` globally using npm:

```bash
npm install -g @remotex-labs/xbuild
```

Or using Yarn:

```bash
yarn global add @remotex-labs/xbuild
```

## Usage

Run the `xBuild -h` CLI tool with various options to build your typeScript projects.
Command-Line Options

```bash
     ______       _ _     _
     | ___ \     (_) |   | |
__  _| |_/ /_   _ _| | __| |
\ \/ / ___ \ | | | | |/ _` |
 >  <| |_/ / |_| | | | (_| |
/_/\_\____/ \__,_|_|_|\__,_|

Version: 0.0.2-beta.0

index.js [file]

A versatile JavaScript and TypeScript toolchain build system.

Positionals:
  entryPoints  The file entryPoints to build                            [string]

Options:
  -h, --help                  Show help                                [boolean]
  -n, --node                  Build for node platform [boolean] [default: false]
  -d, --dev                   Array entryPoints to run for development   [array]
  -s, --serve                 Serve the build folder over HTTP
                                                      [boolean] [default: false]
  -o, --outdir                Output directory        [string] [default: "dist"]
      --declaration, --de     Add TypeScript declarations
                                                      [boolean] [default: false]
  -w, --watch                 Watch for file changes  [boolean] [default: false]
  -c, --config                Build configuration file (js/ts)
                                          [string] [default: "xbuild.config.ts"]
      --tsconfig, --tc        Set TypeScript configuration file to use
                                             [string] [default: "tsconfig.json"]
  -m, --minify                Minify the code         [boolean] [default: false]
  -b, --bundle                Bundle the code         [boolean] [default: false]
      --noTypeChecker, --ntc  Skip TypeScript type checking
                                                      [boolean] [default: false]
      --buildOnError, --boe   Continue building even if there are TypeScript
                              type errors             [boolean] [default: false]
  -v, --version               Show version number     [boolean] [default: false]

```

## Configuration

The `xBuild` configuration file allows you to customize various settings for the build and development process. By default, xbuild uses `xbuild.config.ts` (`--config` change it). Here’s how you can configure it:

### Example Configuration
```typescript
const config: ConfigurationInterface = {
    declaration: true,
    buildOnError: false,
    noTypeChecker: false,
    esbuild: {
        entryPoints: ['./src/index.ts'],
        bundle: true,
        minify: true,
        format: 'esm',
    },
    serve: {
        active: true,
        port: 8080,
        host: 'localhost',
        onRequest: (req, res, next) => {
            console.log('Server request received');
            next();
        }
    }
};
```
