# deapi-search

`deapi-search` is a library for Internet search.

## Installation

``` sh
npm install deapi-search
```


## Usage

This library is a function.

``` js
var deapisearch = require("deapi-search");
// test code
deapisearch(function(results) { /* Your code */ }, "search keyword", { // options
	category: "all", // Search categories(all, video, music, music.google, image, gif, news)
	useGoogle: false // Whether or not to use Google when searching in the "music" category (synonymous with the music.google category).
});
```


## License

MIT
