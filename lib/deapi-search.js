'use strict';
// ライブラリの読み込み
var cheerioClient = require("cheerio-httpcli");

// 定数
var searchURLList = {
    all: "https://www.google.com/search",
    video: "https://www.google.com/search",
    music: "https://soundcloud.com/search",
    "music.google": "https://www.google.com/search",
    image: "https://www.google.com/search",
    gif: "https://www.google.com/search",
    news: "https://www.google.com/search"
};

// プライベート関数
function _getType(x) { // 型名を返す
    return Object.prototype.toString.call(x).replace(/\[object |\]/g, "");
};

function _isType(x, typeName) { // xが指定された型名か判定する
    var type = _getType(x),
        comparisonType = _getType(typeName);
    if (comparisonType === "String") return type === typeName;
    else if (comparisonType === "Array") return typeName.indexOf(type) !== -1;
    else return false;
};

function _initType(value, defaultValue) { // valueの型が異なる場合defaultValueの値を返す
    return _isType(value, _getType(defaultValue)) ? value : defaultValue;
};

function _initParam(param, defaultParam) { // キーの型が異なる場合defaultParamのキーで上書きして返す
    if (!(_isType(param, _getType(defaultParam)) && _isType(param, ["Object", "Array"]))) return _isType(defaultParam, "Array") ? [] : {};
    Object.keys(defaultParam).forEach(function(k) {
        if (!_isType(param[k], _getType(defaultParam[k]))) param[k] = defaultParam[k];
    });
    return param;
};

// エクスポート
module.exports = function(callback, query, options) {
    if (!_isType(callback, "Function")) return;
    query = _initType(query, "");
    options = _initParam(_initType(options, {}), {
        category: "all", // 検索カテゴリ(all, video, music, music.google, image, gif, news)
        useGoogle: false // musicカテゴリで検索するときにGoogleを使用するかどうか(music.googleカテゴリと同義)
    });
    if (!(options.category in searchURLList)) options.category = "all";
    if (options.category === "music.google") options.useGoogle = true;
    else if (options.category === "music" && options.useGoogle) options.category = "music.google";
    cheerioClient.set("followMetaRefresh", false); // ループ防止
    cheerioClient.fetch(searchURLList[options.category], ({ // カテゴリ別送信リクエスト
        all: {
            q: query
        },
        video: {
            q: "site:www.youtube.com/watch " + query,
            tbm: "vid"
        },
        music: {
            q: query,
            facet: "model",
            limit: "20",
            offset: "0",
            linked_partitioning: "1",
            app_locale: "en"
        },
        "music.google": {
            q: "site:soundcloud.com " + query
        },
        image: {
            q: query,
            tbm: "isch"
        },
        gif: {
            q: query,
            tbm: "isch",
            tbs: "itp:animated"
        },
        news: {
            q: query,
            tbm: "nws"
        }
    })[options.category], function(err, $, res, body) {
        var results = []; // 検索結果を格納する配列
        if (/^(all|video|music\.google)$/.test(options.category)) {
            $("div.g div.rc").each(function(i, e) {
                results.push({
                    title: $(e).find("h3.LC20lb.DKV0Md").text(),
                    href: $(e).find("div.yuRUbf a").attr("href"),
                    summary: $(e).find("span.aCOpRe").text()
                });
            });
        } else if (options.category === "music") $("ul li h2 a").each(function(i, e) {
            results.push({
                title: $(e).text(),
                href: "https://soundcloud.com" + $(e).attr("href")
            });
        });
        else if (/^(image|gif)$/.test(options.category)) {
            var str = $(Array.prototype.slice.call($("script")).filter(function(e) {
                    return /AF_initDataCallback\(\{key: 'ds:1',/.test($(e).text());
                })[0]).text(),
                titles = (str.match(/"2008":\[[\s\S]*?\]/g) || []).map(function(v) {
                    return v.replace(/^.*,"|"]$/g, "");
                }),
                hrefs = (str.match(/"2003":\[[\s\S]*?\}\]/g) || []).map(function(v) {
                    return decodeURIComponent(JSON.parse(v.split(",").filter(function(v) {
                        return /^"https?:\/\/.+"$/.test(v);
                    })[0]));
                }),
                srcs = (str.match(/\["https?:\/\/(?!encrypted-tbn0\.gstatic\.com\/images).+",[0-9]+,[0-9]+\]/g) || []).map(function(v) {
                    return v.replace(/^[^"]*"|"[^"]*$/g, "");
                });
            titles.forEach(function(v, i) {
                results.push({
                    title: v,
                    href: hrefs[i],
                    src: srcs[i]
                });
            });
        } else if (options.category === "news") $("div.dbsr").each(function(i, e) {
            results.push({
                title: $(e).find("div.JheGif.nDgy9d").text(),
                href: $(e).find("a").attr("href"),
                summary: $(e).find("div.Y3v8qd").text()
            });
        });
        if (options.category.split(".")[0] === "music") results = results.filter(function(r) {
            return !/^https?:\/\/soundcloud.com\/((mobile|\?.*|.+\/sets)?|[^\/]+)$/.test(r.href); // 再生できるページのみにする
        }).map(function(r) {
            return {
                title: options.category.split(".").length === 1 ? r.title : r.title.replace(/ (by|-|on).*$/g, ""), // ページタイトルのGoogle検索特有の表記を削除する
                href: r.href
            };
        });
        callback(results);
    });
};
