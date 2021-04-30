'use strict'
// import
import axios from 'axios'
import UserAgent from 'user-agents'
import cheerio from 'cheerio'

// typedef
type SearchType = 'all' | 'video' | 'music' | 'image' | 'gif' | 'news'
interface SearchOptions {
    query: string,
    type?: SearchType
}
interface StandardResult {
    title: string,
    href: string
}
interface Result extends StandardResult { summary: string }
interface ImageResult extends StandardResult { src: string }
type SearchResults = (Result | ImageResult)[]
interface StandardParams { q: string }
interface VideoParams extends StandardParams { tbm: 'vid' }
interface ImageParams extends StandardParams { tbm: 'isch' }
interface GifParams extends ImageParams { tbs: 'itp:animated' }
interface NewsParams extends StandardParams { tbm: 'nws' }
interface QueryStringParameters {
    all: StandardParams,
    video: VideoParams,
    music: StandardParams,
    image: ImageParams,
    gif: GifParams,
    news: NewsParams
}

// export
export const search = async (options: SearchOptions): Promise<SearchResults> => {
    // type guard
    if (typeof options !== 'object' || options === null) throw new TypeError('The search option must be an object')
    if (typeof options.query !== 'string') throw new TypeError('The search query must be a string')
    if (options.query.length === 0) throw new RangeError('The search query must be at least one character long')

    // search options initialize
    const srchTypes: (SearchType | undefined)[] = ['all', 'video', 'music', 'image', 'gif', 'news'],
        opts: SearchOptions = { ...options }
    if (!srchTypes.includes(opts.type)) opts.type = srchTypes[0]

    const result: SearchResults = [],
        params: QueryStringParameters = {
            all: { q: opts.query },
            video: { q: 'site:www.youtube.com/watch ' + opts.query, tbm: 'vid' },
            music: { q: 'site:soundcloud.com ' + opts.query },
            image: { q: opts.query, tbm: 'isch' },
            gif: { q: opts.query, tbm: 'isch', tbs: 'itp:animated' },
            news: { q: opts.query, tbm: 'nws' }
        },
        $ = cheerio.load((await axios.get('https://www.google.com/search', {
            params: params[opts.type || 'all'],
            headers: { 'User-Agent': (new UserAgent(/Chrome/)).toString() }
        })).data)

    switch (opts.type) {
        case 'all':
        case 'video':
        case 'music':
            for (const e of [...$('#search .g')]) {
                const link = $(e).find('a').attr('href')
                if (opts.type === 'music' &&
                    typeof link === 'string' && /^https?:\/\/soundcloud.com\/((mobile|\?.*|.+\/sets)?|[^\/]+)$/.test(link)) continue
                result.push({
                    title: $(e).find('h3').text(),
                    href: link || '',
                    summary: $(e).find('div > div > div > span').eq(1).text()
                })
            }
            break
        case 'image':
        case 'gif':
            const str = (() => {
                for (const e of [...$('script')]) {
                    if (/AF_initDataCallback\(\{key\: 'ds:1',/.test($(e).html() || '')) return $(e).html()
                }
            })() || '',
                titles: string[] = [],
                hrefs: string[] = [],
                srcs: string[] = []
            for (const v of (str.match(/"2008":\[.*?\]/gs) || [])) titles.push(v.replace(/^.*,"|"]$/g, ''))
            for (const v of (str.match(/"2003":\[.*?\}\]/gs) || [])) hrefs.push((v.match(/"(https?:\/\/.*?)"/s) || [])[1])
            for (const v of (str.match(/\["https?:\/\/(?!encrypted-tbn0\.gstatic\.com\/images).+",[0-9]+,[0-9]+\]/g) || [])) srcs.push(v.replace(/^[^"]*"|"[^"]*$/g, ''))
            for (const i of new Array(Math.min(titles.length, hrefs.length, srcs.length)).keys()) result.push({
                title: titles[i],
                href: hrefs[i],
                src: srcs[i].replace(/\\u[0-9a-z]{4}/g, u => String.fromCodePoint(Number(u.replace(/^\\u/, '0x'))))
            })
            break
        case 'news':
            for (const e of [...$('#search div[role="heading"]')]) result.push({
                title: $(e).text(),
                href: (() => {
                    for (const p of [...$(e).parents()]) {
                        if (p.name === 'a') return $(p).attr('href')
                    }
                })() || '',
                summary: $(e).parent().children('div').last().children('div').first().text()
            })
            break
    }
    return result
},
    all = async (query: string) => search({ query: query, type: 'all' }),
    video = async (query: string) => search({ query: query, type: 'video' }),
    music = async (query: string) => search({ query: query, type: 'music' }),
    image = async (query: string) => search({ query: query, type: 'image' }),
    gif = async (query: string) => search({ query: query, type: 'gif' }),
    news = async (query: string) => search({ query: query, type: 'news' })