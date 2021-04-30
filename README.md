# deapi-search

`deapi-search` is a library for Internet search.

## Installation

``` sh
npm install deapi-search
```


## Usage

There are seven methods in this library.

In the search method, you can optionally specify the search query and the type of content to be searched.
See the code below for a sample code of the search method.

The other methods are methods to search for different types of content.
They do not optionally specify the search query, but pass it as the first argument.
These are the same as when you use the search method with that content type as an option.
In fact, the search method is called internally.

```js
// ES Modules
import * as deapiSearch from 'deapi-search'
```

``` js
// CommonJS
const deapiSearch = require('deapi-search');
```

a

```js
// example code
(async () => {
    try {
        const res = await deapiSearch.search({
            query: 'Hello, World!', // search keyword
            type: 'all' // Search categories(all, video, music, image, gif, news)
        })
        console.log(res)
    } catch (e) {
        console.error(e)
    }
})()
```


## License

MIT