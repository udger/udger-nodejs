const Database = require('better-sqlite3');
const debug = require('debug')('udger-nodejs');
const Address6 = require('ip-address').Address6;
const Address4 = require('ip-address').Address4;
const utils = require('./utils');
const fs = require('fs-extra');

class UdgerParser {

    constructor(file) {
        this.db = new Database(file, {readonly: true, fileMustExist: true});
        this.ip = null;
        this.ua = null;

        this.cacheEnable = false;
        this.cacheMaxRecords = 4000;
        this.cache = {};
        this.keyCache = '';

        this.defaultRet = fs.readJsonSync('./defaultResult.json');
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
                this.ip = data.ip;
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

        this.ret = JSON.parse(JSON.stringify(this.defaultRet));
    }

    setCacheEnable(cache) {
        this.cacheEnable = cache;
    }

    setCacheSize(records) {
        this.cacheMaxRecords = records;
    }

    parseUa(ua) {
        if (!ua) return;

        let rua = this.ret['user_agent'];
        let q,r,e;

        let client_id = 0;
        let client_class_id = -1;
        let os_id = 0;
        let deviceclass_id = 0;

        debug("parse useragent string: START (useragent: " + ua + ")");

        rua['ua_string'] = ua;
        rua['ua_class'] = 'Unrecognized';
        rua['ua_class_code'] = 'unrecognized';

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
                    if (e[1]) {
                        rua['ua'] = r['name'] + " " + e[1];
                        rua['ua_version'] = e[1];
                        rua['ua_version_major'] = e[1].split('.')[0];
                    } else {
                        rua['ua'] = r['name'];
                        rua['ua_version'] = '';
                        rua['ua_version_major'] = '';
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
                if (e[1]) {
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
            }
        }

        debug("parse useragent string: END, unset useragent string");
    }

    parseIp(ip) {

        if (!ip) return;

        let rip = this.ret['ip_address'];
        let q,r;
        let ipInt;
        let ipa;
        let ipver;

        debug("parse IP address: START (IP: " + ip + ")");

        rip['ip'] = ip;

        ipver = utils.getIpVersion(this.ip);

        if (ipver === 4 || ipver === 6) {
            if (ipver === 6) {
                ip = utils.inetNtop(utils.inetPton(ip));
                debug("compress IP address is:" + ip);
            }
        }

        rip['ip_ver'] = ipver;

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
            if (r['ip_classification_code'] == 'crawler') {
                rip['crawler_family_info_url'] = "https://udger.com/resources/ua-list/bot-detail?bot=" + (r['family'] || '') + "#id" + (r['botid']|| '');
            }
            rip['crawler_last_seen'] = r['last_seen'] || '';
            rip['crawler_category'] = r['crawler_classification'] || '';
            rip['crawler_category_code'] = r['crawler_classification_code'] || '';
            rip['crawler_respect_robotstxt'] = r['respect_robotstxt'] || '';
        } else {
            rip['ip_classification'] = 'Unrecognized';
            rip['ip_classification_code'] = 'unrecognized';
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
            }

        }

        debug("parse IP address: END");
    }

    cacheExist() {
        if (!this.cacheEnable) {
            return false;
        }

        if (!this.cache[this.keyCache]) {
            return false;
        }

        return true;
    }

    cacheRead() {
        this.ret = this.cache[this.keyCache];
        this.ret['from_cache'] = true;
        return this.ret;
    }

    cacheWrite() {
        if (!this.cacheEnable) {
            return;
        }

        if (this.cache[this.keyCache]) {
            // already here
            return;
        }

        this.cache[this.keyCache] = this.ret;

        debug("cache: store result of %s (length=%s)", this.keyCache);
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

    parse() {

        if (this.cacheExist()) {
            return this.cacheRead();
        }

        this.parseUa(this.ua);
        this.parseIp(this.ip);

        this.cacheWrite();

        return this.ret;
    }
}

module.exports = function(file) {
    return new (UdgerParser)(file);
};
