module.exports = {
  "arrowParens": "avoid",
  "bracketSameLine": true,
  "bracketSpacing": false,
  "requirePragma": true,
  "singleQuote": true,
  "trailingComma": "all",
  "overrides": [
    {
      "files": [
        "**/*.{cjs,mjs,js,jsx,flow}"
      ],
      "options": {
        "parser": "flow"
      }
    },
    {
      "files": [
        "**/*.graphql"
      ],
      "options": {
        "parser": "graphql",
        "requirePragma": false
      }
    },
    {
      "files": [
        "**/*.json"
      ],
      "options": {
        "parser": "json-stringify",
        "requirePragma": false
      }
    },
    {
      "files": [
        "**/*.{md,markdown}"
      ],
      "options": {
        "parser": "markdown",
        "proseWrap": "always",
        "requirePragma": false
      }
    },
    {
      "files": [
        "**/*.{ts,tsx}"
      ],
      "options": {
        "parser": "typescript"
      }
    }
  ]
}
