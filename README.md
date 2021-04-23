# deapi-search

`deapi-search` is a library for Internet search.

## Installation

``` sh
npm install deapi-search
```


## Usage

This library is a function.

``` js
const deapiSearch = require('deapi-search');

// example code
(async () => {
    try {
        const res = await deapiSearch.search({
            query: 'Hello, World!', // search keyword
            type: 'all' // Search categories(all, video, music, image, gif, news)
        });
        console.log(res);
    } catch (e) {
        console.error(e);
    }
})();
```


## License

MIT