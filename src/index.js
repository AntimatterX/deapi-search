'use strict';
// ライブラリの読み込み
const cheerioClient = require('cheerio-httpcli');

// 設定
cheerioClient.set('followMetaRefresh', false);

// 定数
const SEARCH_URLS = {
    all: 'https://www.google.com/search',
    video: 'https://www.google.com/search',
    music: 'https://www.google.com/search',
    image: 'https://www.google.com/search',
    gif: 'https://www.google.com/search',
    news: 'https://www.google.com/search'
};

// 型定義
/**
 * @typedef {{ query: string, type: string|void }} SearchOptions
 * @typedef {{ title: string, href: string, summary: string }} StandardSearchResult
 * @typedef {{ title: string, href: string, src: string }} ImageSearchResult
 * @typedef {StandardSearchResult[]|ImageSearchResult[]} SearchResults
 */

// エクスポート
/**
 * @param {SearchOptions} options
 * @returns {Promise<SearchResults>}
 */
exports.search = async options => {
    if (typeof options !== 'object' || options === null) throw TypeError();
    if (typeof options.query !== 'string') throw new TypeError();
    if (options.query.length === 0) throw new RangeError();
    const opts = Object.assign({}, options);
    opts.type = (typeof opts.type === 'string' ? opts.type : '').toLowerCase();
    if (!(opts.type in SEARCH_URLS)) opts.type = 'all';
    const { $ } = await cheerioClient.fetch(SEARCH_URLS[opts.type], ({
        all: { q: opts.query },
        video: { q: 'site:www.youtube.com/watch ' + opts.query, tbm: 'vid' },
        music: { q: 'site:soundcloud.com ' + opts.query },
        image: { q: opts.query, tbm: 'isch' },
        gif: { q: opts.query, tbm: 'isch', tbs: 'itp:animated' },
        news: { q: opts.query, tbm: 'nws' }
    })[opts.type]),
        result = [];
    switch (opts.type) {
        case 'all':
        case 'video':
        case 'music':
            for (const e of Array.from($('#search .g'))) {
                const link = $(e).find('a').attr('href');
                if (opts.type === 'music' &&
                    /^https?:\/\/soundcloud.com\/((mobile|\?.*|.+\/sets)?|[^\/]+)$/.test(link)) continue;
                result.push({
                    title: $(e).find('h3').text(),
                    href: link,
                    summary: $(e).find('div > div > div > span').eq(1).text()
                });
            }
            return result;
        case 'image':
        case 'gif':
            let str;
            for (const e of Array.from($('script'))) {
                if (!/AF_initDataCallback\(\{key: 'ds:1',/.test($(e).text())) continue;
                str = $(e).text();
                break;
            }
            const titles = [],
                hrefs = [],
                srcs = [];
            for (const v of (str.match(/"2008":\[.*?\]/gs) || [])) titles.push(v.replace(/^.*,"|"]$/g, ''));
            for (const v of (str.match(/"2003":\[.*?\}\]/gs) || [])) hrefs.push(v.match(/"(https?:\/\/.*?)"/s)[1]);
            for (const v of (str.match(/\["https?:\/\/(?!encrypted-tbn0\.gstatic\.com\/images).+",[0-9]+,[0-9]+\]/g) || [])) srcs.push(v.replace(/^[^"]*"|"[^"]*$/g, ''));
            for (const i of new Array(Math.min(titles.length, hrefs.length, srcs.length)).keys()) result.push({
                title: titles[i],
                href: hrefs[i],
                src: srcs[i]
            });
            return result;
        case 'news':
            for (const e of Array.from($('#search div[role="heading"]'))) {
                let link;
                for (const p of Array.from($(e).parents())) {
                    if (p.name !== 'a') continue;
                    link = $(p).attr('href');
                    break;
                }
                result.push({
                    title: $(e).text(),
                    href: link,
                    summary: $(e).parent().children('div').last().children('div').first().text()
                });
            }
            return result;
    }
};
/**
 * @param {string} query 
 * @returns {Promise<SearchResults>}
 */
exports.all = async query => exports.search({ query, type: 'all' });
/**
 * @param {string} query 
 * @returns {Promise<SearchResults>}
 */
exports.video = async query => exports.search({ query, type: 'video' });
/**
 * @param {string} query 
 * @returns {Promise<SearchResults>}
 */
exports.music = async query => exports.search({ query, type: 'music' });
/**
 * @param {string} query 
 * @returns {Promise<SearchResults>}
 */
exports.image = async query => exports.search({ query, type: 'image' });
/**
 * @param {string} query 
 * @returns {Promise<SearchResults>}
 */
exports.gif = async query => exports.search({ query, type: 'gif' });
/**
 * @param {string} query 
 * @returns {Promise<SearchResults>}
 */
exports.news = async query => exports.search({ query, type: 'news' });