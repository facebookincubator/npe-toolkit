# NPE Config
<!-- markdownlint-disable-next-line -->
*Common build configuration utiltiies for NPE projects*

Notes:

* To use

  * Add `"@npe/config": "link:../../tools/config"` (with correct relative directory) to your devDependencies in package.json
  * Add the following any JS based configuration file:

    ```js
      const {WebpackUtils} = require('@npe/config');
      ...
      WebpackUtils.someFunction();
    ```

* Currently as a single package for simplicity, can split if it becomes too much of a grab bag

JS-based configuration files:

* `babel.config.js` for configuring build transpliations and file mappings
* `webpack.config.js` for bundling web builds
* `metro.config.js` for bundling React Native mobile builds
* `jest.config.js` for testing
