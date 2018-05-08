const Database = require('better-sqlite3');
const debug = require('debug')('udger-nodejs');
const Address6 = require('ip-address').Address6;
const Address4 = require('ip-address').Address4;
const utils = require('./utils');
const fs = require('fs-extra');
const dotProp = require('dot-prop');
const path = require('path');
const RandExp = require('randexp');

/** Class exposing udger parser methods */
class UdgerParser {

    /**
     * Load udger SQLite3 database.
     * @param {string} file - full path to udgerdb_v3.dat
     */
    constructor(file) {
        this.db = new Database(file, {readonly: true, fileMustExist: true});
        this.file = file;
        this.ip = null;
        this.ua = null;

        this.cacheEnable = false;
        this.cacheMaxRecords = 4000;
        this.cache = {};
        this.keyCache = '';

        this.defaultRet = fs.readJsonSync(path.resolve(__dirname+'/defaultResult.json'));
        this.retUa = {};
        this.retIp = {};
    }

    /**
     * Connect (reconnect) sqlite database
     * @return {Boolean} true if db has been opened, false if already connected
     */
    connect() {
        if (!this.db) {
            this.db = new Database(this.file, {readonly: true, fileMustExist: true});
            return true;
        }
        return false;
    }

    /**
     * Disconnect sqlite database, avoid read/write conflict
     * see https://github.com/udger/udger-updater-nodejs/issues/5
     * @return {Boolean} true if db has been closed, false if no db opened
     */
    disconnect() {
        if (this.db) {
            this.db.close();
            this.db = null;
            return true;
        }
        return false;
    }

    /**
     * Initialize User-Agent or IP(v4/v6), or both
     * @param {Object} data - An object
     * @param {String} data.ua - User-Agent
     * @param {String} data.ip - IP Address
     */
    set(data) {

        let help = 'set() is waiting for an object having only ip and/or ua attribute';

        if (!data) {
            throw new Error(help);
            return;
        }

        if (typeof data === 'string') {
            throw new Error(help);
            return;
        }

        for (let key in data) {
            if (key === 'ua') {
                this.ua = data.ua;
            } else if (key === 'ip') {
                this.ip = data.ip.toLowerCase();
            } else {
                throw new Error(help);
                return;
            }
        }

        this.keyCache =  '';

        if (this.cacheEnable) {
            if (this.ip) this.keyCache = this.ip;
            if (this.ua) this.keyCache += this.ua;
        }

        this.retUa = JSON.parse(JSON.stringify(this.defaultRet['user_agent']));
        this.retIp = JSON.parse(JSON.stringify(this.defaultRet['ip_address']));
    }

    /**
     * Activate cache
     * @param {Boolean} cache - true or false
     */
    setCacheEnable(cache) {
        this.cacheEnable = cache;
    }

    /**
     * Return if the cache is enable or not
     * @return {Boolean} true if the cache is enable, false if not
     */
    isCacheEnable() {
        return this.cacheEnable;
    }

    /**
     * Set Cache Size
     * @param {Number} records - the maximum number of items we want to keep in the cache
     */
    setCacheSize(records) {
        this.cacheMaxRecords = records;
    }

    /**
     * Check if a key exist in the cache
     * @param {Number} key - key can be UA or UA+IP
     * @return {Boolean} return true if the key exist in the cache, false if not
     */
    cacheKeyExist(key) {
        if (this.cache[key]) {
            return true;
        }
        return false;
    }

    /**
     * Return an item from the cache
     * @param {String} key - key can be UA or UA+IP
     * @return {Object} stored parser result
     */
    cacheRead(key, opts) {
        let ret = this.cache[key];
        if (opts && opts.json) {
            if (opts.full) {
                ret['fromCache'] = true;
            }
        } else {
            ret['from_cache'] = true;
        }
        return ret;
    }

    /**
     * Write an item into the cache
     * @param {String} key - key can be UA or UA+IP
     */
    cacheWrite(key, data) {
        if (this.cache[key]) {
            // already in the cache
            return;
        }

        this.cache[key] = data;

        debug("cache: store result of %s (length=%s)", key);
        debug("cache: entries count: %s/%s",(Object.keys(this.cache).length || 0), this.cacheMaxRecords);

        // warning, js object is used for performance reason
        // as opposite of php object, we can not use splice/pop stuff here
        // so, when an entry must be remove because the cache is full, we
        // can not determine which one will be removed
        while (Object.keys(this.cache).length > this.cacheMaxRecords) {
            debug("cache: removing entry",Object.keys(this.cache)[0]);
            delete this.cache[Object.keys(this.cache)[0]];
        }
    }

    /**
     * Clean the cache
     */
    cacheClean() {
        this.cache = {};
    }

    /**
     * Parse the User-Agent string
     * @param {String} ua - An User-Agent string
     */
    parseUa(ua, opts) {

        let rua = JSON.parse(JSON.stringify(this.retUa));
        let ruaJson = {};

        if (!ua) return {
            udger: rua,
            json: ruaJson
        };

        let q,r,e;

        let client_id = 0;
        let client_class_id = -1;
        let os_id = 0;
        let deviceclass_id = 0;

        debug("parse useragent string: START (useragent: " + ua + ")");

        rua['ua_string'] = ua;
        rua['ua_class'] = 'Unrecognized';
        rua['ua_class_code'] = 'unrecognized';

        dotProp.set(ruaJson,'ua.string',ua);
        if (opts.full) {
            dotProp.set(ruaJson, 'ua.class.name', 'Unrecognized');
            dotProp.set(ruaJson, 'ua.class.code', 'unrecognized');
        } else {
            dotProp.set(ruaJson, 'ua.class', 'unrecognized');
        }

        ////////////////////////////////////////////////
        // search for crawlers
        ////////////////////////////////////////////////

        q = this.db.prepare(
            "SELECT " +
            "udger_crawler_list.id as botid," +
            "name, ver, ver_major, last_seen, respect_robotstxt," +
            "family, family_code, family_homepage, family_icon," +
            "vendor, vendor_code, vendor_homepage," +
            "crawler_classification, crawler_classification_code " +
            "FROM udger_crawler_list " +
            "LEFT JOIN udger_crawler_class ON udger_crawler_class.id=udger_crawler_list.class_id " +
            "WHERE ua_string=?"
        );

        r = q.get(ua);

        if (r) {

            debug("parse useragent string: crawler found");

            client_class_id = 99;

            // UDGER FORMAT
            rua['ua_class'] = 'Crawler';
            rua['ua_class_code'] = 'crawler';
            rua['ua'] = r['name'] || '';
            rua['ua_version'] = r['ver'] || '';
            rua['ua_version_major'] = r['ver_major'] || '';
            rua['ua_family'] = r['family'] || '';
            rua['ua_family_code'] = r['family_code'] || '';
            rua['ua_family_homepage'] = r['family_homepage'] || '';
            rua['ua_family_vendor'] = r['vendor'] || '';
            rua['ua_family_vendor_code'] = r['vendor_code'] || '';
            rua['ua_family_vendor_homepage'] = r['vendor_homepage'] || '';
            rua['ua_family_icon'] = r['family_icon'] || '';
            rua['ua_family_info_url'] = "https://udger.com/resources/ua-list/bot-detail?bot=" + (r['family'] || '') + "#id" + (r['botid'] || '');

            rua['crawler_last_seen'] = r['last_seen'] || '';
            rua['crawler_category'] = r['crawler_classification'] || '';
            rua['crawler_category_code'] = r['crawler_classification_code'] || '';
            rua['crawler_respect_robotstxt'] = r['respect_robotstxt'] || '';

            // JSON FORMAT
            rua['ua'] && dotProp.set(ruaJson, 'ua.name', rua['ua']);

            if (opts.full) {
                dotProp.set(ruaJson,'ua.class.name','Crawler');
                dotProp.set(ruaJson, 'ua.class.code', 'crawler');
                rua['ua_version'] && dotProp.set(ruaJson, 'ua.version.current', rua['ua_version']);
                rua['ua_version_major'] && dotProp.set(ruaJson, 'ua.version.major', rua['ua_version_major']);

                rua['ua_family'] && dotProp.set(ruaJson, 'ua.family.name', rua['ua_family']);
                rua['ua_family_code'] && dotProp.set(ruaJson, 'ua.family.code', rua['ua_family_code']);
                rua['ua_family_homepage'] && dotProp.set(ruaJson, 'ua.family.homepage', rua['ua_family_homepage']);
                rua['ua_family_vendor'] && dotProp.set(ruaJson, 'ua.family.vendor.name', rua['ua_family_vendor']);
                rua['ua_family_vendor_code'] && dotProp.set(ruaJson, 'ua.family.vendor.code', rua['ua_family_vendor_code']);
                rua['ua_family_homepage'] && dotProp.set(ruaJson, 'ua.family.vendor.homepage', rua['ua_family_homepage']);
                rua['ua_family_icon'] && dotProp.set(ruaJson, 'ua.family.icon', rua['ua_family_icon']);
                rua['ua_family'] && r['botid'] && dotProp.set(ruaJson, 'ua.family.infoUrl', rua['ua_family_info_url']);

            } else {
                dotProp.set(ruaJson,'ua.class','crawler');
                rua['ua_family_code'] && dotProp.set(ruaJson,'ua.family.code',rua['ua_family_code']);
                rua['ua_family_homepage'] && dotProp.set(ruaJson,'ua.family.homepage',rua['ua_family_homepage']);
                rua['ua_family_vendor_code'] && dotProp.set(ruaJson,'ua.family.vendor',rua['ua_family_vendor_code']);
            }

            rua['crawler_last_seen'] && dotProp.set(ruaJson, 'crawler.lastSeen', rua['crawler_last_seen']);

            if (opts.full) {
                rua['crawler_category'] && dotProp.set(ruaJson, 'crawler.category.name', rua['crawler_category']);
                rua['crawler_category_code'] && dotProp.set(ruaJson, 'crawler.category.code', rua['crawler_category_code']);
                rua['crawler_respect_robotstxt'] && dotProp.set(ruaJson, 'crawler.respectRobotsTxt', rua['crawler_respect_robotstxt']);
            } else {
                rua['crawler_category_code'] && dotProp.set(ruaJson, 'crawler.category', rua['crawler_category_code']);
            }
        } else {

            q = this.db.prepare(
                "SELECT class_id,client_id,regstring,name,name_code,homepage,icon,icon_big,engine,vendor,vendor_code,vendor_homepage,uptodate_current_version,client_classification,client_classification_code " +
                "FROM udger_client_regex " +
                "JOIN udger_client_list ON udger_client_list.id=udger_client_regex.client_id " +
                "JOIN udger_client_class ON udger_client_class.id=udger_client_list.class_id " +
                "ORDER BY sequence ASC"
            );

            for (r of q.iterate()) {
                e = ua.match(utils.phpRegexpToJs(r['regstring']));
                if (e) {

                    debug("parse useragent string: client found");

                    client_id = r['client_id'];
                    client_class_id = r['class_id'];

                    rua['ua_class'] = r['client_classification'];
                    rua['ua_class_code'] = r['client_classification_code'];

                    if (opts.full) {
                        dotProp.set(ruaJson, 'ua.class.name', rua['ua_class']);
                        dotProp.set(ruaJson, 'ua.class.code', rua['ua_class_code']);
                    } else {
                        dotProp.set(ruaJson, 'ua.class', rua['ua_class_code']);
                    }
                    if (e[1]) {
                        rua['ua'] = r['name'] + " " + e[1];
                        rua['ua_version'] = e[1];
                        rua['ua_version_major'] = e[1].split('.')[0];
                    } else {
                        rua['ua'] = r['name'];
                        rua['ua_version'] = '';
                        rua['ua_version_major'] = '';
                    }

                    if (rua['ua']) {
                        dotProp.set(ruaJson, 'ua.name', rua['ua']);
                    } else {
                        dotProp.delete(ruaJson,'ua.name');
                    }

                    if (opts.full) {
                        if (rua['ua_version']) {
                            dotProp.set(ruaJson, 'ua.version.current', rua['ua_version']);
                        } else {
                            dotProp.delete(ruaJson, 'ua.version.current');
                        }

                        if (rua['ua_version_major']) {
                            dotProp.set(ruaJson, 'ua.version.current', rua['ua_version_major']);
                        } else {
                            dotProp.delete(ruaJson, 'ua.version.current');
                        }
                    }

                    rua['ua_uptodate_current_version'] = r['uptodate_current_version'] || '';
                    rua['ua_family'] = r['name'] || '';
                    rua['ua_family_code'] = r['name_code'] || '';
                    rua['ua_family_homepage'] = r['homepage'] || '';
                    rua['ua_family_vendor'] = r['vendor'] || '';
                    rua['ua_family_vendor_code'] = r['vendor_code'] || '';
                    rua['ua_family_vendor_homepage'] = r['vendor_homepage'] || '';
                    rua['ua_family_icon'] = r['icon'] || '';
                    rua['ua_family_icon_big'] = r['icon_big'] || '';
                    rua['ua_family_info_url'] = "https://udger.com/resources/ua-list/browser-detail?browser=" + (r['name'] || '');
                    rua['ua_engine'] = r['engine'] || '';

                    if (opts.full) {
                        rua['ua_uptodate_current_version'] && dotProp.set(ruaJson, 'ua.uptodateCurrentVersion', rua['ua_uptodate_current_version']);
                        rua['ua_family'] && dotProp.set(ruaJson, 'ua.family.name', rua['ua_family']);
                        rua['ua_family_code'] && dotProp.set(ruaJson, 'ua.family.code', rua['ua_family_code']);
                        rua['ua_family_homepage'] && dotProp.set(ruaJson, 'ua.family.homepage', rua['ua_family_homepage']);
                        rua['ua_family_vendor'] && dotProp.set(ruaJson, 'ua.family.vendor.name', rua['ua_family_vendor']);
                        rua['ua_family_vendor_code'] && dotProp.set(ruaJson, 'ua.family.vendor.code', rua['ua_family_vendor_code']);
                        rua['ua_family_vendor_homepage'] && dotProp.set(ruaJson, 'ua.family.vendor.homepage', rua['ua_family_vendor_homepage']);
                        rua['ua_family_icon'] && dotProp.set(ruaJson, 'ua.family.icon', rua['ua_family_icon']);
                        rua['ua_family_icon_big'] && dotProp.set(ruaJson, 'ua.family.iconBig', rua['ua_family_icon_big']);
                        if (r['name']) {
                            dotProp.set(ruaJson, 'ua.family.infoUrl', rua['ua_family_info_url']);
                        }
                    } else {
                        rua['ua_family_code'] && dotProp.set(ruaJson, 'ua.family', rua['ua_family_code']);
                    }
                    rua['ua_engine'] && dotProp.set(ruaJson, 'ua.engine', rua['ua_engine']);

                    break;
                }
            }
        }

        ////////////////////////////////////////////////
        // os
        ////////////////////////////////////////////////
        q = this.db.prepare(
            "SELECT os_id,regstring,family,family_code,name,name_code,homepage,icon,icon_big,vendor,vendor_code,vendor_homepage " +
            "FROM udger_os_regex " +
            "JOIN udger_os_list ON udger_os_list.id=udger_os_regex.os_id " +
            "ORDER BY sequence ASC"
        );

        for (r of q.iterate()) {
            e = ua.match(utils.phpRegexpToJs(r['regstring']));
            if (e) {

                debug("parse useragent string: os found");

                os_id = r['os_id'];
                rua['os'] = r['name'] || '';
                rua['os_code'] = r['name_code'] || '';
                rua['os_homepage'] = r['homepage'] || '';
                rua['os_icon'] = r['icon'] || '';
                rua['os_icon_big'] = r['icon_big'] || '';
                rua['os_info_url'] = "https://udger.com/resources/ua-list/os-detail?os=" + (r['name'] || '');
                rua['os_family'] = r['family'] || '';
                rua['os_family_code'] = r['family_code'] || '';
                rua['os_family_vendor'] = r['vendor'] || '';
                rua['os_family_vendor_code'] = r['vendor_code'] || '';
                rua['os_family_vendor_homepage'] = r['vendor_homepage'] || '';

                if (opts.full) {
                    rua['os'] && dotProp.set(ruaJson, 'os.name', rua['os']);
                    rua['os_code'] && dotProp.set(ruaJson, 'os.code', rua['os_code']);
                    rua['os_homepage'] && dotProp.set(ruaJson, 'os.homepage', rua['os_homepage']);
                    rua['os_icon'] && dotProp.set(ruaJson, 'os.icon', rua['os_icon']);
                    rua['os_icon_big'] && dotProp.set(ruaJson, 'os.iconBig', rua['os_icon_big']);
                    rua['os_info_url'] && dotProp.set(ruaJson, 'os.infoUrl', rua['os_info_url']);
                    rua['os_family'] && dotProp.set(ruaJson, 'os.family.name', rua['os_family']);
                    rua['os_family_code'] && dotProp.set(ruaJson, 'os.family.code', rua['os_family_code']);
                    rua['os_family_vendor'] && dotProp.set(ruaJson, 'os.family.vendor.name', rua['os_family_vendor']);
                    rua['os_family_vendor_code'] && dotProp.set(ruaJson, 'os.family.vendor.code', rua['os_family_vendor_code']);
                    rua['os_family_vendor_homepage'] && dotProp.set(ruaJson, 'os.family.vendor.homepage', rua['os_family_vendor_homepage']);
                } else {
                    rua['os_code'] && dotProp.set(ruaJson, 'os.code', rua['os_code']);
                    rua['os_family_code'] && dotProp.set(ruaJson, 'os.family', rua['os_family_code']);
                }
                break;
            }
        }

        ////////////////////////////////////////////////
        // client/os relation
        ////////////////////////////////////////////////

        if (os_id == 0 && client_id != 0) {

            q = this.db.prepare(
                "SELECT os_id,family,family_code,name,name_code,homepage,icon,icon_big,vendor,vendor_code,vendor_homepage " +
                "FROM udger_client_os_relation " +
                "JOIN udger_os_list ON udger_os_list.id=udger_client_os_relation.os_id " +
                "WHERE client_id=?"
            );

            r = q.get(client_id);

            if (r) {

                debug("parse useragent string: client os relation found");

                os_id = r['os_id'];
                rua['os'] = r['name'] || '';
                rua['os_code'] = r['name_code'] || '';
                rua['os_homepage'] = r['homepage'] || '';
                rua['os_icon'] = r['icon'] || '';
                rua['os_icon_big'] = r['icon_big'] || '';
                rua['os_info_url'] = "https://udger.com/resources/ua-list/os-detail?os=" + (r['name'] || '');
                rua['os_family'] = r['family'] || '';
                rua['os_family_code'] = r['family_code'] || '';
                rua['os_family_vendor'] = r['vendor'] || '';
                rua['os_family_vendor_code'] = r['vendor_code'] || '';
                rua['os_family_vendor_homepage'] = r['vendor_homepage'] || '';

                rua['os'] && dotProp.set(ruaJson, 'os.name', rua['os']);
                rua['os_code'] && dotProp.set(ruaJson, 'os.code', rua['os_code']);
                rua['os_homepage'] && dotProp.set(ruaJson, 'os.homepage', rua['os_homepage']);
                rua['os_icon'] && dotProp.set(ruaJson, 'os.icon', rua['os_icon']);
                rua['os_icon_big'] && dotProp.set(ruaJson, 'os.iconBig', rua['os_icon_big']);
                rua['os_info_url'] && dotProp.set(ruaJson, 'os.infoUrl', rua['os_info_url']);
                rua['os_family'] && dotProp.set(ruaJson, 'os.family.name', rua['os_family']);
                rua['os_family_code'] && dotProp.set(ruaJson, 'os.family.code', rua['os_family_code']);
                rua['os_family_vendor'] && dotProp.set(ruaJson, 'os.family.vendor.name', rua['os_family_vendor']);
                rua['os_family_vendor_code'] && dotProp.set(ruaJson, 'os.family.vendor.code', rua['os_family_vendor_code']);
                rua['os_family_vendor_homepage'] && dotProp.set(ruaJson, 'os.family.vendor.homepage', rua['os_family_vendor_homepage']);

            }
        }

        ////////////////////////////////////////////////
        // device
        ////////////////////////////////////////////////

        q = this.db.prepare(
            "SELECT deviceclass_id,regstring,name,name_code,icon,icon_big " +
            "FROM udger_deviceclass_regex " +
            "JOIN udger_deviceclass_list ON udger_deviceclass_list.id=udger_deviceclass_regex.deviceclass_id " +
            "ORDER BY sequence ASC"
        );

        for (r of q.iterate()) {
            e = ua.match(utils.phpRegexpToJs(r['regstring']));
            if (e) {

                debug("parse useragent string: device found by regex");

                deviceclass_id = r['deviceclass_id'];
                rua['device_class'] = r['name'] || '';
                rua['device_class_code'] = r['name_code'] || '';
                rua['device_class_icon'] = r['icon'] || '';
                rua['device_class_icon_big'] = r['icon_big'] || '';
                rua['device_class_info_url'] = "https://udger.com/resources/ua-list/device-detail?device=" + r['name'];

                if (opts.full) {
                    rua['device_class'] && dotProp.set(ruaJson, 'device.class.name', rua['device_class']);
                    rua['device_class_code'] && dotProp.set(ruaJson, 'device.class.code', rua['device_class_code']);
                    rua['device_class_icon'] && dotProp.set(ruaJson, 'device.class.icon', rua['device_class_icon']);
                    rua['device_class_icon_big'] && dotProp.set(ruaJson, 'device.class.iconBig', rua['device_class_icon_big']);
                    rua['device_class_info_url'] && dotProp.set(ruaJson, 'device.class.infoUrl', rua['device_class_info_url']);
                } else {
                    rua['device_class_code'] && dotProp.set(ruaJson, 'device.class', rua['device_class_code']);
                }

                break;
            }
        }

        if (deviceclass_id == 0 && client_class_id != -1) {
            q = this.db.prepare(
                "SELECT deviceclass_id,name,name_code,icon,icon_big " +
                "FROM udger_deviceclass_list " +
                "JOIN udger_client_class ON udger_client_class.deviceclass_id=udger_deviceclass_list.id " +
                "WHERE udger_client_class.id=?"
            );

            r = q.get(client_class_id);

            if (r) {

                debug("parse useragent string: device found by deviceclass");

                deviceclass_id = r['deviceclass_id'];
                rua['device_class'] = r['name'] || '';
                rua['device_class_code'] = r['name_code'] || '';
                rua['device_class_icon'] = r['icon'] || '';
                rua['device_class_icon_big'] = r['icon_big'] || '';
                rua['device_class_info_url'] = "https://udger.com/resources/ua-list/device-detail?device=" + (r['name'] || '');

                if (opts.full) {
                    rua['device_class'] && dotProp.set(ruaJson, 'device.class.name', rua['device_class']);
                    rua['device_class_code'] && dotProp.set(ruaJson, 'device.class.code', rua['device_class_code']);
                    rua['device_class_icon'] && dotProp.set(ruaJson, 'device.class.icon', rua['device_class_icon']);
                    rua['device_class_icon_big'] && dotProp.set(ruaJson, 'device.class.iconBig', rua['device_class_icon_big']);
                    rua['device_class_info_url'] && dotProp.set(ruaJson, 'device.class.infoUrl', rua['device_class_info_url']);
                } else {
                    rua['device_class_code'] && dotProp.set(ruaJson, 'device.class', rua['device_class_code']);
                }
            }
        }

        ////////////////////////////////////////////////
        // device marketname
        ////////////////////////////////////////////////

        if (rua['os_family_code']) {
            q = this.db.prepare(
                "SELECT id,regstring FROM udger_devicename_regex " +
                "WHERE (" +
                "(os_family_code=? AND os_code='-all-') OR " +
                "(os_family_code=? AND os_code=?)" +
                ") " +
                "ORDER BY sequence"
            );

            let bindParams = [
                rua['os_family_code'],
                rua['os_family_code'],
                rua['os_code']
            ];

            let match;
            let rId;
            for (let r of q.iterate(bindParams)) {
                e = ua.match(utils.phpRegexpToJs(r['regstring']));
                if (e && e[1]) {
                    match = e[1].trim();
                    rId = r["id"];
                    break;
                }
            }

            let qC = this.db.prepare(
                "SELECT marketname,brand_code,brand,brand_url,icon,icon_big " +
                "FROM udger_devicename_list " +
                "JOIN udger_devicename_brand ON udger_devicename_brand.id=udger_devicename_list.brand_id " +
                "WHERE regex_id=? AND code=?"
            );

            let rC = qC.get(rId, match);

            if (rC) {

                debug("parse useragent string: device marketname found");

                rua['device_marketname'] = rC['marketname'] || '';
                rua['device_brand'] = rC['brand'] || '';
                rua['device_brand_code'] = rC['brand_code'] || '';
                rua['device_brand_homepage'] = rC['brand_url'] || '';
                rua['device_brand_icon'] = rC['icon'] || '';
                rua['device_brand_icon_big'] = rC['icon_big'] || '';
                rua['device_brand_info_url'] = "https://udger.com/resources/ua-list/devices-brand-detail?brand=" + (rC['brand_code'] || '');

                rua['device_marketname'] && dotProp.set(ruaJson, 'device.marketName', rua['device_marketname']);
                rua['device_brand'] && dotProp.set(ruaJson, 'device.brand.name', rua['device_brand']);
                rua['device_brand_code'] && dotProp.set(ruaJson, 'device.brand.code', rua['device_brand_code']);
                rua['device_brand_homepage'] && dotProp.set(ruaJson, 'device.brand.homepage', rua['device_brand_homepage']);
                rua['device_brand_icon'] && dotProp.set(ruaJson, 'device.brand.icon', rua['device_brand_icon']);
                rua['device_brand_icon_big'] && dotProp.set(ruaJson, 'device.brand.iconBig', rua['device_brand_icon_big']);
                rua['device_brand_info_url'] && dotProp.set(ruaJson, 'device.brand.infoUrl', rua['device_brand_info_url']);

            }
        }

        debug("parse useragent string: END, unset useragent string");

        return {
            udger:rua,
            json:ruaJson
        };
    }

    /**
     * Parse the IP Address
     * @param {String} ip - An IPv4 or IPv6 Address
     */
    parseIp(ip, opts) {

        let rip = JSON.parse(JSON.stringify(this.retIp));
        let ripJson = {};

        if (!ip) return {
            udger:rip,
            json:ripJson
        };


        let q,r;
        let ipInt;
        let ipa;
        let ipver;

        debug("parse IP address: START (IP: " + ip + ")");

        rip['ip'] = ip;
        dotProp.set(ripJson, 'ip', ip);

        ipver = utils.getIpVersion(ip);

        if (ipver === 4 || ipver === 6) {
            if (ipver === 6) {
                ip = utils.inetNtop(utils.inetPton(ip));
                debug("compress IP address is:" + ip);
            }
        }

        rip['ip_ver'] = ipver;
        if (opts.full) {
            dotProp.set(ripJson, 'version', ipver);
        }

        q = this.db.prepare(
            "SELECT udger_crawler_list.id as botid, ip_last_seen, ip_hostname, ip_country, ip_city, " +
            "ip_country_code, ip_classification, ip_classification_code, name, ver, ver_major, last_seen, "+
            "respect_robotstxt, family, family_code, family_homepage, family_icon, vendor, vendor_code, "+
            "vendor_homepage, crawler_classification, crawler_classification_code "+
            "FROM udger_ip_list "+
            "JOIN udger_ip_class ON udger_ip_class.id=udger_ip_list.class_id "+
            "LEFT JOIN udger_crawler_list ON udger_crawler_list.id=udger_ip_list.crawler_id "+
            "LEFT JOIN udger_crawler_class ON udger_crawler_class.id=udger_crawler_list.class_id "+
            "WHERE ip=? ORDER BY sequence"
        );

        r = q.get(ip);

        if (r) {

            // UDGER FORMAT
            rip['ip_classification'] = r['ip_classification'] || '';
            rip['ip_classification_code'] = r['ip_classification_code'] || '';
            rip['ip_last_seen'] = r['ip_last_seen'] || '';
            rip['ip_hostname'] = r['ip_hostname'] || '';
            rip['ip_country'] = r['ip_country'] || '';
            rip['ip_country_code'] = r['ip_country_code'] || '';
            rip['ip_city'] = r['ip_city'] || '';

            rip['crawler_name'] = r['name'] || '';
            rip['crawler_ver'] = r['ver'] || '';
            rip['crawler_ver_major'] = r['ver_major'] || '';
            rip['crawler_family'] = r['family'] || '';
            rip['crawler_family_code'] = r['family_code'] || '';
            rip['crawler_family_homepage'] = r['family_homepage'] || '';
            rip['crawler_family_vendor'] = r['vendor'] || '';
            rip['crawler_family_vendor_code'] = r['vendor_code'] || '';
            rip['crawler_family_vendor_homepage'] = r['vendor_homepage'] || '';
            rip['crawler_family_icon'] = r['family_icon'] || '';
            if (r['ip_classification_code'] === 'crawler') {
                rip['crawler_family_info_url'] = "https://udger.com/resources/ua-list/bot-detail?bot=" + (r['family'] || '') + "#id" + (r['botid']|| '');
            }
            rip['crawler_last_seen'] = r['last_seen'] || '';
            rip['crawler_category'] = r['crawler_classification'] || '';
            rip['crawler_category_code'] = r['crawler_classification_code'] || '';
            rip['crawler_respect_robotstxt'] = r['respect_robotstxt'] || '';

            // JSON FORMAT
            if (opts.full) {
                rip['ip_classification'] && dotProp.set(ripJson, 'classification.name', rip['ip_classification']);
                rip['ip_classification_code'] && dotProp.set(ripJson, 'classification.code', rip['ip_classification_code']);
            } else {
                rip['ip_classification_code'] && dotProp.set(ripJson, 'classification', rip['ip_classification_code']);
            }

            rip['ip_last_seen'] && dotProp.set(ripJson, 'lastSeen', rip['ip_last_seen']);
            rip['ip_hostname'] && dotProp.set(ripJson, 'hostname', rip['ip_hostname']);
            rip['ip_country'] && dotProp.set(ripJson, 'geo.country.name', rip['ip_country']);
            rip['ip_country_code'] && dotProp.set(ripJson, 'geo.country.code', rip['ip_country_code']);
            rip['ip_city'] && dotProp.set(ripJson, 'geo.city', rip['ip_city']);

            rip['crawler_name'] && dotProp.set(ripJson, 'crawler.name', rip['crawler_name']);
            if (opts.full) {
                rip['crawler_ver'] && dotProp.set(ripJson, 'crawler.version.current', rip['crawler_ver']);
                rip['crawler_ver_major'] && dotProp.set(ripJson, 'crawler.version.major', rip['crawler_ver_major']);
                rip['crawler_family'] && dotProp.set(ripJson, 'crawler.family.name', rip['crawler_family']);
                rip['crawler_family_code'] && dotProp.set(ripJson, 'crawler.family.code', rip['crawler_family_code']);
                rip['crawler_family_homepage'] && dotProp.set(ripJson, 'crawler.family.homepage', rip['crawler_family_homepage']);
                rip['crawler_family_vendor'] && dotProp.set(ripJson, 'crawler.family.vendor.name', rip['crawler_family_vendor']);
                rip['crawler_family_vendor_code'] && dotProp.set(ripJson, 'crawler.family.vendor.code', rip['crawler_family_vendor_code']);
                rip['crawler_family_vendor_homepage'] && dotProp.set(ripJson, 'crawler.family.vendor.homepage', rip['crawler_family_vendor_homepage']);
                rip['crawler_family_icon'] && dotProp.set(ripJson, 'crawler.family.icon', rip['crawler_family_icon']);
                if (r['ip_classification_code'] === 'crawler') {
                    rip['crawler_family_info_url'] && dotProp.set(ripJson, 'crawler.family.infoUrl', rip['crawler_family_info_url']);
                }
                rip['crawler_last_seen'] && dotProp.set(ripJson, 'crawler.lastSeen', rip['crawler_last_seen']);
                rip['crawler_category'] && dotProp.set(ripJson, 'crawler.category.name', rip['crawler_category']);
                rip['crawler_category_code'] && dotProp.set(ripJson, 'crawler.category.code', rip['crawler_category_code']);
                rip['crawler_respect_robotstxt'] && dotProp.set(ripJson, 'crawler.respectRobotsTxt', rip['crawler_category_code']);
            } else {
                rip['crawler_family_code'] && dotProp.set(ripJson, 'crawler.family', rip['crawler_family_code']);
                rip['crawler_category_code'] && dotProp.set(ripJson, 'crawler.category', rip['crawler_category_code']);
                rip['crawler_last_seen'] && dotProp.set(ripJson, 'crawler.lastSeen', rip['crawler_last_seen']);
            }

        } else {

            rip['ip_classification'] = 'Unrecognized';
            rip['ip_classification_code'] = 'unrecognized';

            if (opts.full) {
                dotProp.set(ripJson, 'classification.name', rip['ip_classification']);
                dotProp.set(ripJson, 'classification.code', rip['ip_classification_code']);
            } else {
                dotProp.set(ripJson, 'classification', rip['ip_classification_code']);
            }
        }

        if (ipver === 4) {

            ipa = new Address4(ip);
            ipInt = ipa.bigInteger().intValue();

            q = this.db.prepare(
                "SELECT name, name_code, homepage "+
                "FROM udger_datacenter_range "+
                "JOIN udger_datacenter_list ON udger_datacenter_range.datacenter_id=udger_datacenter_list.id "+
                "WHERE iplong_from <=?  AND iplong_to >=?"
            );

            r = q.get(ipInt, ipInt);

            if (r) {

                rip['datacenter_name'] = r['name'] || '';
                rip['datacenter_name_code'] = r['name_code'] || '';
                rip['datacenter_homepage'] = r['homepage'] || '';

                if (opts.full) {
                    rip['datacenter_name'] && dotProp.set(ripJson, 'datacenter.name', rip['datacenter_name']);
                    rip['datacenter_name_code'] && dotProp.set(ripJson, 'datacenter.code', rip['datacenter_name_code']);
                    rip['datacenter_homepage'] && dotProp.set(ripJson, 'datacenter.homepage', rip['datacenter_homepage']);
                } else {
                    rip['datacenter_name_code'] && dotProp.set(ripJson, 'datacenter', rip['datacenter_name_code']);
                }

            }

        } else if (ipver === 6) {

            ipa = new Address6(ip);
            let t = ipa.canonicalForm().split(':');
            let ipInts = {};
            t.forEach((h,i) => {
                ipInts['ipInt'+i] = parseInt(h, 16);
            });

            q = this.db.prepare(
                "SELECT name, name_code, homepage "+
                "FROM udger_datacenter_range6 "+
                "JOIN udger_datacenter_list ON udger_datacenter_range6.datacenter_id=udger_datacenter_list.id "+
                "WHERE "+
                "iplong_from0 <= @ipInt0 AND iplong_to0 >= @ipInt0 AND "+
                "iplong_from1 <= @ipInt1 AND iplong_to1 >= @ipInt1 AND "+
                "iplong_from2 <= @ipInt2 AND iplong_to2 >= @ipInt2 AND "+
                "iplong_from3 <= @ipInt3 AND iplong_to3 >= @ipInt3 AND "+
                "iplong_from4 <= @ipInt4 AND iplong_to4 >= @ipInt4 AND "+
                "iplong_from5 <= @ipInt5 AND iplong_to5 >= @ipInt5 AND "+
                "iplong_from6 <= @ipInt6 AND iplong_to6 >= @ipInt6 AND "+
                "iplong_from7 <= @ipInt7 AND iplong_to7 >= @ipInt7"
            );

            r = q.get(ipInts);

            if (r) {

                rip['datacenter_name'] = r['name'] || '';
                rip['datacenter_name_code'] = r['name_code'] || '';
                rip['datacenter_homepage'] = r['homepage'] || '';

                if (opts.full) {
                    rip['datacenter_name'] && dotProp.set(ripJson, 'datacenter.name', rip['datacenter_name']);
                    rip['datacenter_name_code'] && dotProp.set(ripJson, 'datacenter.code', rip['datacenter_name_code']);
                    rip['datacenter_homepage'] && dotProp.set(ripJson, 'datacenter.homepage', rip['datacenter_homepage']);
                } else {
                    rip['datacenter_name_code'] && dotProp.set(ripJson, 'datacenter', rip['datacenter_name_code']);
                }
            }

        }

        debug("parse IP address: END");

        return {
            udger:rip,
            json:ripJson
        };
    }

    /**
     * Main parser
     * @return {Object} Parsing result
     */
    parse(opts) {

        if (!this.db) return {};

        if (
            this.isCacheEnable() &&
            this.cacheKeyExist(this.keyCache)
        ) {
            return this.cacheRead(this.keyCache, opts);
        }

        let ret = {};
        if (!opts) opts = {};

        if (opts.json) {
            if (this.ua) ret.userAgent =this.parseUa(this.ua, opts).json;
            if (this.ip) ret.ipAddress = this.parseIp(this.ip, opts).json;
            if (opts.full) ret.fromCache = false;
        } else {
            ret['user_agent'] = this.parseUa(this.ua, opts).udger;
            ret['ip_address'] = this.parseIp(this.ip, opts).udger;
            ret['from_cache'] = false;
        }

        if (this.isCacheEnable()) {
            this.cacheWrite(this.keyCache, ret);
        }

        return ret;
    }

    randomSanityChecks(max, callback) {
        if (!this.db) {
            callback(new Error("Database not ready"));
            return false;
        }

        if (!max) {
            callback(new Error('Please specify maximum number of records'));
            return false;
        }

        if (typeof max!= "number") {
            callback(new Error('Maximum number of records is not a number'));
            return false;
        }

        return true;
    }

    randomUACrawlers(max, callback) {

        if (!this.randomSanityChecks(max, callback)) return;

        let q = this.db.prepare(
            "SELECT ua_string FROM udger_crawler_list ORDER BY RANDOM() LIMIT ?"
        );

        callback(null, q.all(max));
        return;
    }

    randomUAClientsRegex(max, callback) {
        if (!this.randomSanityChecks(max, callback)) return;

        let q = this.db.prepare(
            "SELECT regstring FROM udger_client_regex ORDER BY RANDOM() LIMIT ?"
        );

        callback(null, q.all(max));
        return;
    }

    randomUAClients(max, callback) {

        if (!this.randomSanityChecks(max, callback)) return;
        this.randomUAClientsRegex(max, (err, results) => {
            let regex;
            let regexClean;
            let randomUA;
            let re;
            let reClean;
            for (let i = 0, len=results.length; i<len; i++) {
                regex = new RegExp(results[i].regstring);
                regexClean = results[i].regstring.replace(/^\//,'');
                regexClean = regexClean.replace(/\/si$/,'');
                reClean = new RegExp(regexClean);
                re = new RandExp(reClean);

                re.max = 5;                         // limit random for * and +
                re.defaultRange.subtract(32, 126);  // remove defaults random chars
                re.defaultRange.add(43, 43);        // add +
                re.defaultRange.add(45, 46);        // add . and -
                re.defaultRange.add(48, 57);        // add 0-9
                re.defaultRange.add(97, 122);       // add a-z
                re.defaultRange.add(65, 90);        // add A-Z

                randomUA = re.gen();

                results[i].randomUA = randomUA;

                /*
                if (!randomUA.match(reClean)) {
                    console.log('original',results[i].regstring);
                    console.log('clean',regexClean);
                    console.log('ua',ua);
                    console.log('result',randomUA.match(new RegExp(regexClean)));
                }
                */
            }

            callback(null, results);
        })
    }

    randomIPv4(max, callback) {
        if (!this.randomSanityChecks(max, callback)) return;

        let q = this.db.prepare(
            "SELECT ip FROM udger_ip_list WHERE ip LIKE '%.%.%.%' ORDER BY RANDOM() LIMIT ?"
        );

        callback(null, q.all(max));
        return;
    }

    getUAClientsClassification(callback) {
        if (!this.db) {
            callback(new Error("Database not ready"));
            return false;
        }

        let q = this.db.prepare(
            "SELECT client_classification, client_classification_code FROM udger_client_class"
        )

        callback(null, q.all());
        return;
    }

    getUACrawlersClassification(callback) {
        if (!this.db) {
            callback(new Error("Database not ready"));
            return false;
        }

        let q = this.db.prepare(
            "SELECT crawler_classification, crawler_classification_code FROM udger_crawler_class"
        )

        callback(null, q.all());
        return;
    }

    getIPsClassification(callback) {
        if (!this.db) {
            callback(new Error("Database not ready"));
            return false;
        }

        let q = this.db.prepare(
            "SELECT ip_classification, ip_classification_code FROM udger_ip_class"
        )

        callback(null, q.all());
        return;
    }
}

module.exports = function(file) {
    return new (UdgerParser)(file);
};
