module.exports = {
    globalName: false,
    nodeModulesToCompile: [
        // The build system ignores compiling anything in node_modules by default.
        // List modules here (by name) that you want the build system to compile.

        'custom-attributes',
    ],
}
