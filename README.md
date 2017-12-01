# udger-nodejs
[![Build Status](https://travis-ci.org/udger/udger-nodejs.svg?branch=master)](https://travis-ci.org/udger/udger-nodejs)
[![Dependencies](https://david-dm.org/udger/udger-nodejs.svg)](https://david-dm.org/udger/udger-nodejs)

# Udger client for NodeJS (data ver. 3)
Local parser is very fast and accurate useragent string detection solution.
Enables developers to locally install and integrate a highly-scalable product.
We provide the detection of the devices (personal computer, tablet, Smart TV, Game console etc.),
operating system, client SW type (browser, e-mail client etc.) and devices market name
(example: Sony Xperia Tablet S, Nokia Lumia 820 etc.). It also provides information about
IP addresses (Public proxies, VPN services, Tor exit nodes, Fake crawlers, Web scrapers,
Datacenter name .. etc.)

- Tested with more the 50.000 unique user agents.
- Up to date data provided by https://udger.com/

## Requirements
 - nodejs >= 8.9.0
 - datafile v3 (udgerdb_v3.dat) from https://data.udger.com/

## Features
- Fast
- LRU cache
- Released under the MIT

## Install
    npm install udger-nodejs

## Usage
You should review the included examples in `examples/` and `test/` directory.

Here's a quick example:

```js
const udgerParser = require('udger-nodejs')('./udgerdb_v3.dat');

udgerParser.set({
    ua:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36',
    ip:'2A02:598:7000:116:0:0:0:101'
});

let ret = udgerParser.parse();

// beautify json output with 4 spaces indent
console.log(JSON.stringify(ret, null, 4));
```

Result

```
{
    "user_agent": {
        "ua_string": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36",
        "ua_class": "Browser",
        "ua_class_code": "browser",
        "ua": "Chrome 62.0.3202.94",
        "ua_version": "62.0.3202.94",
        "ua_version_major": "62",
        "ua_uptodate_current_version": "62",
        "ua_family": "Chrome",
        "ua_family_code": "chrome",
        "ua_family_homepage": "http://www.google.com/chrome/",
        "ua_family_vendor": "Google Inc.",
        "ua_family_vendor_code": "google_inc",
        "ua_family_vendor_homepage": "https://www.google.com/about/company/",
        "ua_family_icon": "chrome.png",
        "ua_family_icon_big": "chrome_big.png",
        "ua_family_info_url": "https://udger.com/resources/ua-list/browser-detail?browser=Chrome",
        "ua_engine": "WebKit/Blink",
        "os": "Windows 10",
        "os_code": "windows_10",
        "os_homepage": "https://en.wikipedia.org/wiki/Windows_10",
        "os_icon": "windows10.png",
        "os_icon_big": "windows10_big.png",
        "os_info_url": "https://udger.com/resources/ua-list/os-detail?os=Windows 10",
        "os_family": "Windows",
        "os_family_code": "windows",
        "os_family_vendor": "Microsoft Corporation.",
        "os_family_vendor_code": "microsoft_corporation",
        "os_family_vendor_homepage": "https://www.microsoft.com/about/",
        "device_class": "Desktop",
        "device_class_code": "desktop",
        "device_class_icon": "desktop.png",
        "device_class_icon_big": "desktop_big.png",
        "device_class_info_url": "https://udger.com/resources/ua-list/device-detail?device=Desktop",
        "device_marketname": "",
        "device_brand": "",
        "device_brand_code": "",
        "device_brand_homepage": "",
        "device_brand_icon": "",
        "device_brand_icon_big": "",
        "device_brand_info_url": "",
        "crawler_last_seen": "",
        "crawler_category": "",
        "crawler_category_code": "",
        "crawler_respect_robotstxt": ""
    },
    "ip_address": {
        "ip": "2a02:598:7000:116:0:0:0:101",
        "ip_ver": 6,
        "ip_classification": "Crawler",
        "ip_classification_code": "crawler",
        "ip_hostname": "",
        "ip_last_seen": "2016-02-12 04:28:56",
        "ip_country": "Czech Republic",
        "ip_country_code": "CZ",
        "ip_city": "Prague",
        "crawler_name": "SeznamBot/3.2-test1",
        "crawler_ver": "3.2-test1",
        "crawler_ver_major": "3",
        "crawler_family": "SeznamBot",
        "crawler_family_code": "seznambot",
        "crawler_family_homepage": "http://napoveda.seznam.cz/en/seznambot-intro/",
        "crawler_family_vendor": "Seznam.cz, a.s.",
        "crawler_family_vendor_code": "seznam-cz_as",
        "crawler_family_vendor_homepage": "http://onas.seznam.cz/",
        "crawler_family_icon": "seznam.png",
        "crawler_family_info_url": "https://udger.com/resources/ua-list/bot-detail?bot=SeznamBot#id12590",
        "crawler_last_seen": "2016-08-31 15:19:38",
        "crawler_category": "Search engine bot",
        "crawler_category_code": "search_engine_bot",
        "crawler_respect_robotstxt": "yes",
        "datacenter_name": "Seznam.cz",
        "datacenter_name_code": "seznam_cz",
        "datacenter_homepage": "http://onas.seznam.cz/"
    },
    "from_cache": false
}
```


## Result formats
By default, JSON Udger format is used. The JSON Udger format is coming from the PHP Parser (compatibility)
Others JSON format are available, by passing options in `udger.parse()` function.

### Native Udger JSON Format (default)

#### Usage

```js
udgerParser.parse();
```

#### Result

```
{
    "ip_address": {
        "ip": "66.249.64.73",
        "ip_ver": 4,
        "ip_classification": "Crawler",
        "ip_classification_code": "crawler",
        "ip_hostname": "crawl-66-249-64-73.googlebot.com",
        "ip_last_seen": "2016-10-02 09:16:57",
        "ip_country": "United States",
        "ip_country_code": "US",
        "ip_city": "Mountain View",
        "crawler_name": "Googlebot/2.1",
        "crawler_ver": "2.1",
        "crawler_ver_major": "2",
        "crawler_family": "Googlebot",
        "crawler_family_code": "googlebot",
        "crawler_family_homepage": "http://www.google.com/bot.html",
        "crawler_family_vendor": "Google Inc.",
        "crawler_family_vendor_code": "google_inc",
        "crawler_family_vendor_homepage": "https://www.google.com/about/company/",
        "crawler_family_icon": "bot_googlebot.png",
        "crawler_family_info_url": "https://udger.com/resources/ua-list/bot-detail?bot=Googlebot#id31",
        "crawler_last_seen": "2017-01-06 17:52:46",
        "crawler_category": "Search engine bot",
        "crawler_category_code": "search_engine_bot",
        "crawler_respect_robotstxt": "yes",
        "datacenter_name": "Google sites",
        "datacenter_name_code": "googgle_sites",
        "datacenter_homepage": "http://sites.google.com/"
    }
}
```

### Compact JSON Format

#### Usage

```js
udgerParser.parse({json:true});
```

#### Result

```js
{
    "ipAddress": {
        "ip": "66.249.64.73",
        "classification": "crawler",
        "lastSeen": "2016-10-02 09:16:57",
        "hostname": "crawl-66-249-64-73.googlebot.com",
        "geo": {
            "country": {
                "name": "United States",
                "code": "US"
            },
            "city": "Mountain View"
        },
        "crawler": {
            "name": "Googlebot/2.1",
            "family": "googlebot",
            "category": "search_engine_bot",
            "lastSeen": "2017-01-06 17:52:46"
        },
        "datacenter": "googgle_sites"
    }
}
```

### Full JSON Format

#### Usage

```js
udgerParser.parse({json:true, full:true});
```

#### Result

```js
{
    "ipAddress": {
        "ip": "66.249.64.73",
        "version": 4,
        "classification": {
            "name": "Crawler",
            "code": "crawler"
        },
        "lastSeen": "2016-10-02 09:16:57",
        "hostname": "crawl-66-249-64-73.googlebot.com",
        "geo": {
            "country": {
                "name": "United States",
                "code": "US"
            },
            "city": "Mountain View"
        },
        "crawler": {
            "name": "Googlebot/2.1",
            "version": {
                "current": "2.1",
                "major": "2"
            },
            "family": {
                "name": "Googlebot",
                "code": "googlebot",
                "homepage": "http://www.google.com/bot.html",
                "vendor": {
                    "name": "Google Inc.",
                    "code": "google_inc",
                    "homepage": "https://www.google.com/about/company/"
                },
                "icon": "bot_googlebot.png",
                "infoUrl": "https://udger.com/resources/ua-list/bot-detail?bot=Googlebot#id31"
            },
            "lastSeen": "2017-01-06 17:52:46",
            "category": {
                "name": "Search engine bot",
                "code": "search_engine_bot"
            },
            "respectRobotsTxt": "search_engine_bot"
        },
        "datacenter": {
            "name": "Google sites",
            "code": "googgle_sites",
            "homepage": "http://sites.google.com/"
        }
    },
    "fromCache": false
}
```

## LRU Cache
By default, cache is disable. To enable cache, just add this line BEFORE using udgerParser.set():

    // by default, cache size is 4000 keys (a key can be an UA, or UA+IP)
    // you can modify this limit
    udgerParser.setCacheSize(1000);
    udgerParser.setCacheEnable()

When a record is coming from the cache, the "from_cache" attribute in the response is "true"


## Running tests
    npm test


## Automatic updates download
- for autoupdate data use Udger data updater (https://udger.com/support/documentation/?doc=62)


## Documentation for programmers
- https://udger.com/pub/documentation/parser/NodeJS/html/


## Author
- The Udger.com Team (info@udger.com)


## old v2 format
This module does not support v2 format