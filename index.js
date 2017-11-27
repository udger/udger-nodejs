const Database = require('better-sqlite3');
const util = require('util');
const debug = require('debug')('udger-nodejs');
const Address6 = require('ip-address').Address6;
const Address4 = require('ip-address').Address4;

function phpRegexpToJs(str) {
    let re = str.replace(/^\//,'').trim();
    let flags = re.match(/\/([a-z]{0,3})$/);
    flags = flags[1].replace(/s/,'');
    re = re.replace(/\/[a-z]{0,3}$/,'');
    return new RegExp(re, flags);
}

function getIpVersion(ip) {
    let addr = new Address6(ip);
    if (addr.isValid()) return 6;

    addr = new Address4(ip);
    if (addr.isValid()) return 4;

    return false;
}

function inet_pton (a) {
    // eslint-disable-line camelcase
    //  discuss at: http://locutus.io/php/inet_pton/
    // original by: Theriault (https://github.com/Theriault)
    //   example 1: inet_pton('::')
    //   returns 1: '\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0'
    //   example 2: inet_pton('127.0.0.1')
    //   returns 2: '\x7F\x00\x00\x01'

    var r;
    var m;
    var x;
    var i;
    var j;
    var f = String.fromCharCode;
    // IPv4
    m = a.match(/^(?:\d{1,3}(?:\.|$)){4}/);
    if (m) {
        m = m[0].split('.');
        m = f(m[0]) + f(m[1]) + f(m[2]) + f(m[3]);
        // Return if 4 bytes, otherwise false.
        return m.length === 4 ? m : false
    }
    r = /^((?:[\da-f]{1,4}(?::|)){0,8})(::)?((?:[\da-f]{1,4}(?::|)){0,8})$/;
    // IPv6
    m = a.match(r);
    if (m) {
        // Translate each hexadecimal value.
        for (j = 1; j < 4; j++) {
            // Indice 2 is :: and if no length, continue.
            if (j === 2 || m[j].length === 0) {
                continue
            }
            m[j] = m[j].split(':');
            for (i = 0; i < m[j].length; i++) {
                m[j][i] = parseInt(m[j][i], 16);
                // Would be NaN if it was blank, return false.
                if (isNaN(m[j][i])) {
                    // Invalid IP.
                    return false
                }
                m[j][i] = f(m[j][i] >> 8) + f(m[j][i] & 0xFF)
            }
            m[j] = m[j].join('')
        }
        x = m[1].length + m[3].length;
        if (x === 16) {
            return m[1] + m[3]
        } else if (x < 16 && m[2].length > 0) {
            return m[1] + (new Array(16 - x + 1))
                    .join('\x00') + m[3]
        }
    }
    // Invalid IP
    return false
}


function inet_ntop (a) {
    // eslint-disable-line camelcase
    //  discuss at: http://locutus.io/php/inet_ntop/
    // original by: Theriault (https://github.com/Theriault)
    //   example 1: inet_ntop('\x7F\x00\x00\x01')
    //   returns 1: '127.0.0.1'
    //   _example 2: inet_ntop('\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\1')
    //   _returns 2: '::1'
    var i = 0;
    var m = '';
    var c = [];
    a += '';
    if (a.length === 4) {
        // IPv4
        return [
            a.charCodeAt(0),
            a.charCodeAt(1),
            a.charCodeAt(2),
            a.charCodeAt(3)
        ].join('.')
    } else if (a.length === 16) {
        // IPv6
        for (i = 0; i < 16; i++) {
            c.push(((a.charCodeAt(i++) << 8) + a.charCodeAt(i)).toString(16))
        }
        return c.join(':')
            .replace(/((^|:)0(?=:|$))+:?/g, function (t) {
                m = (t.length > m.length) ? t : m;
                return t
            })
            .replace(m || ' ', '::')
    } else {
        // Invalid length
        return false
    }
}

class UdgerParser {
    constructor(file) {
        this.db = new Database(file, {readonly:true, fileMustExist:true});
        this.ip = null;
        this.ua = null;
    }



    setUA(ua) {
        this.ua = ua;
    }

    setIP(ip) {
        this.ip = ip;
    }

    parse() {

        let e;

        //ret values
        let ret = {
            'user_agent': {
                'ua_string': '',
                'ua_class': '',
                'ua_class_code': '',
                'ua': '',
                'ua_version': '',
                'ua_version_major': '',
                'ua_uptodate_current_version': '',
                'ua_family': '',
                'ua_family_code': '',
                'ua_family_homepage': '',
                'ua_family_vendor': '',
                'ua_family_vendor_code': '',
                'ua_family_vendor_homepage': '',
                'ua_family_icon': '',
                'ua_family_icon_big': '',
                'ua_family_info_url': '',
                'ua_engine': '',
                'os': '',
                'os_code': '',
                'os_homepage': '',
                'os_icon': '',
                'os_icon_big': '',
                'os_info_url': '',
                'os_family': '',
                'os_family_code': '',
                'os_family_vendor': '',
                'os_family_vendor_code': '',
                'os_family_vendor_homepage': '',
                'device_class': '',
                'device_class_code': '',
                'device_class_icon': '',
                'device_class_icon_big': '',
                'device_class_info_url': '',
                'device_marketname': '',
                'device_brand': '',
                'device_brand_code': '',
                'device_brand_homepage': '',
                'device_brand_icon': '',
                'device_brand_icon_big': '',
                'device_brand_info_url': '',
                'crawler_last_seen': '',
                'crawler_category': '',
                'crawler_category_code': '',
                'crawler_respect_robotstxt': ''
            },
            'ip_address': {
                'ip': '',
                'ip_ver': '',
                'ip_classification': '',
                'ip_classification_code': '',
                'ip_hostname': '',
                'ip_last_seen': '',
                'ip_country': '',
                'ip_country_code': '',
                'ip_city': '',
                'crawler_name': '',
                'crawler_ver': '',
                'crawler_ver_major': '',
                'crawler_family': '',
                'crawler_family_code': '',
                'crawler_family_homepage': '',
                'crawler_family_vendor': '',
                'crawler_family_vendor_code': '',
                'crawler_family_vendor_homepage': '',
                'crawler_family_icon': '',
                'crawler_family_info_url': '',
                'crawler_last_seen': '',
                'crawler_category': '',
                'crawler_category_code': '',
                'crawler_respect_robotstxt': '',
                'datacenter_name': '',
                'datacenter_name_code': '',
                'datacenter_homepage': ''
            }
        };

        let q;
        let r;

        if (this.ua) {

            debug("parse useragent string: START (useragent: " + this.ua + ")");

            let client_id = 0;
            let client_class_id = -1;
            let os_id = 0;
            let deviceclass_id = 0;

            ret['user_agent']['ua_string'] = this.ua;
            ret['user_agent']['ua_class'] = 'Unrecognized';
            ret['user_agent']['ua_class_code'] = 'unrecognized';

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

            let crawler = q.get(this.ua);

            if (crawler) {

                debug("parse useragent string: crawler found");

                let client_class_id = 99;
                ret['user_agent']['ua_class'] = 'Crawler';
                ret['user_agent']['ua_class_code'] = 'crawler';
                ret['user_agent']['ua'] = crawler['name'];
                ret['user_agent']['ua_version'] = crawler['ver'];
                ret['user_agent']['ua_version_major'] = crawler['ver_major'];
                ret['user_agent']['ua_family'] = crawler['family'];
                ret['user_agent']['ua_family_code'] = crawler['family_code'];
                ret['user_agent']['ua_family_homepage'] = crawler['family_homepage'];
                ret['user_agent']['ua_family_vendor'] = crawler['vendor'];
                ret['user_agent']['ua_family_vendor_code'] = crawler['vendor_code'];
                ret['user_agent']['ua_family_vendor_homepage'] = crawler['vendor_homepage'];
                ret['user_agent']['ua_family_icon'] = crawler['family_icon'];
                ret['user_agent']['ua_family_info_url'] = "https://udger.com/resources/ua-list/bot-detail?bot=" + crawler['family'] + "#id" + crawler['botid'];
                ret['user_agent']['crawler_last_seen'] = crawler['last_seen'];
                ret['user_agent']['crawler_category'] = crawler['crawler_classification'];
                ret['user_agent']['crawler_category_code'] = crawler['crawler_classification_code'];
                ret['user_agent']['crawler_respect_robotstxt'] = crawler['respect_robotstxt'];

            } else {

                q = this.db.prepare(
                    "SELECT class_id,client_id,regstring,name,name_code,homepage,icon,icon_big,engine,vendor,vendor_code,vendor_homepage,uptodate_current_version,client_classification,client_classification_code " +
                    "FROM udger_client_regex " +
                    "JOIN udger_client_list ON udger_client_list.id=udger_client_regex.client_id " +
                    "JOIN udger_client_class ON udger_client_class.id=udger_client_list.class_id " +
                    "ORDER BY sequence ASC"
                );

                for (let client of q.iterate()) {
                    e = this.ua.match(phpRegexpToJs(client['regstring']));
                    if (e) {

                        debug("parse useragent string: client found");

                        client_id = client['client_id'];
                        client_class_id = client['class_id'];
                        ret['user_agent']['ua_class'] = client['client_classification'];
                        ret['user_agent']['ua_class_code'] = client['client_classification_code'];
                        if (e[1]) {
                            ret['user_agent']['ua'] = client['name'] + " " + e[1];
                            ret['user_agent']['ua_version'] = e[1];
                            ret['user_agent']['ua_version_major'] = e[1].split('.')[0];
                        } else {
                            ret['user_agent']['ua'] = client['name'];
                            ret['user_agent']['ua_version'] = '';
                            ret['user_agent']['ua_version_major'] = '';
                        }
                        ret['user_agent']['ua_uptodate_current_version'] = client['uptodate_current_version'];
                        ret['user_agent']['ua_family'] = client['name'];
                        ret['user_agent']['ua_family_code'] = client['name_code'];
                        ret['user_agent']['ua_family_homepage'] = client['homepage'];
                        ret['user_agent']['ua_family_vendor'] = client['vendor'];
                        ret['user_agent']['ua_family_vendor_code'] = client['vendor_code'];
                        ret['user_agent']['ua_family_vendor_homepage'] = client['vendor_homepage'];
                        ret['user_agent']['ua_family_icon'] = client['icon'];
                        ret['user_agent']['ua_family_icon_big'] = client['icon_big'];
                        ret['user_agent']['ua_family_info_url'] = "https://udger.com/resources/ua-list/browser-detail?browser=" + client['name'];
                        ret['user_agent']['ua_engine'] = client['engine'];
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

            for (let os of q.iterate()) {
                e = this.ua.match(phpRegexpToJs(os['regstring']));
                if (e) {

                    debug("parse useragent string: os found");

                    os_id = os['os_id'];
                    ret['user_agent']['os'] = os['name'];
                    ret['user_agent']['os_code'] = os['name_code'];
                    ret['user_agent']['os_homepage'] = os['homepage'];
                    ret['user_agent']['os_icon'] = os['icon'];
                    ret['user_agent']['os_icon_big'] = os['icon_big'];
                    ret['user_agent']['os_info_url'] = "https://udger.com/resources/ua-list/os-detail?os=" + os['name'];
                    ret['user_agent']['os_family'] = os['family'];
                    ret['user_agent']['os_family_code'] = os['family_code'];
                    ret['user_agent']['os_family_vendor'] = os['vendor'];
                    ret['user_agent']['os_family_vendor_code'] = os['vendor_code'];
                    ret['user_agent']['os_family_vendor_homepage'] = os['vendor_homepage'];
                    break;
                }
            }

            ////////////////////////////////////////////////
            // client/os relation
            ////////////////////////////////////////////////

            if (os_id == 0 && client_id != 0) {

                //@todo: find a valid test to pass here ?

                q = this.db.prepare(
                    "SELECT os_id,family,family_code,name,name_code,homepage,icon,icon_big,vendor,vendor_code,vendor_homepage " +
                    "FROM udger_client_os_relation " +
                    "JOIN udger_os_list ON udger_os_list.id=udger_client_os_relation.os_id " +
                    "WHERE client_id=?"
                );

                let cor = q.get(client_id);

                if (cor) {

                    debug("parse useragent string: client os relation found");

                    os_id = cor['os_id'];
                    ret['user_agent']['os'] = cor['name'];
                    ret['user_agent']['os_code'] = cor['name_code'];
                    ret['user_agent']['os_homepage'] = cor['homepage'];
                    ret['user_agent']['os_icon'] = cor['icon'];
                    ret['user_agent']['os_icon_big'] = cor['icon_big'];
                    ret['user_agent']['os_info_url'] = "https://udger.com/resources/ua-list/os-detail?os="+cor['name'];
                    ret['user_agent']['os_family'] = cor['family'];
                    ret['user_agent']['os_family_code'] = cor['family_code'];
                    ret['user_agent']['os_family_vendor'] = cor['vendor'];
                    ret['user_agent']['os_family_vendor_code'] = cor['vendor_code'];
                    ret['user_agent']['os_family_vendor_homepage'] = cor['vendor_homepage'];
                }
            }

            ////////////////////////////////////////////////
            // device
            ////////////////////////////////////////////////

            q = this.db.prepare(
                "SELECT deviceclass_id,regstring,name,name_code,icon,icon_big "+
                "FROM udger_deviceclass_regex "+
                "JOIN udger_deviceclass_list ON udger_deviceclass_list.id=udger_deviceclass_regex.deviceclass_id "+
                "ORDER BY sequence ASC"
            );

            for (let device of q.iterate()) {
                e = this.ua.match(phpRegexpToJs(device['regstring']));
                if (e) {

                    debug("parse useragent string: device found by regex");

                    //@todo: find a valid test to pass here ?
                    deviceclass_id = device['deviceclass_id'];
                    ret['user_agent']['device_class'] = device['name'];
                    ret['user_agent']['device_class_code'] = device['name_code'];
                    ret['user_agent']['device_class_icon'] = device['icon'];
                    ret['user_agent']['device_class_icon_big'] = device['icon_big'];
                    ret['user_agent']['device_class_info_url'] = "https://udger.com/resources/ua-list/device-detail?device=" + device['name'];
                    break;
                }
            }

            if (deviceclass_id == 0 && client_class_id != -1) {
                q = this.db.prepare(
                    "SELECT deviceclass_id,name,name_code,icon,icon_big "+
                    "FROM udger_deviceclass_list "+
                    "JOIN udger_client_class ON udger_client_class.deviceclass_id=udger_deviceclass_list.id "+
                    "WHERE udger_client_class.id=?"
                );

                let r = q.get(client_class_id);

                if (r) {

                    debug("parse useragent string: device found by deviceclass");

                    deviceclass_id = r['deviceclass_id'];
                    ret['user_agent']['device_class'] = r['name'];
                    ret['user_agent']['device_class_code'] = r['name_code'];
                    ret['user_agent']['device_class_icon'] = r['icon'];
                    ret['user_agent']['device_class_icon_big'] = r['icon_big'];
                    ret['user_agent']['device_class_info_url'] = "https://udger.com/resources/ua-list/device-detail?device=" + r['name'];
                }
            }

            ////////////////////////////////////////////////
            // device marketname
            ////////////////////////////////////////////////

            if (ret['user_agent']['os_family_code']) {
                q = this.db.prepare(
                    "SELECT id,regstring FROM udger_devicename_regex " +
                    "WHERE ("+
                        "(os_family_code=? AND os_code='-all-') OR "+
                        "(os_family_code=? AND os_code=?)" +
                    ") " +
                    "ORDER BY sequence"
                );

                let bindParams = [
                    ret['user_agent']['os_family_code'],
                    ret['user_agent']['os_family_code'],
                    ret['user_agent']['os_code']
                ];

                let match;
                let rId;
                for (let r of q.iterate(bindParams)) {
                    e = this.ua.match(phpRegexpToJs(r['regstring']));
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

                    ret['user_agent']['device_marketname'] = rC['marketname'];
                    ret['user_agent']['device_brand'] = rC['brand'];
                    ret['user_agent']['device_brand_code'] = rC['brand_code'];
                    ret['user_agent']['device_brand_homepage'] = rC['brand_url'];
                    ret['user_agent']['device_brand_icon'] = rC['icon'];
                    ret['user_agent']['device_brand_icon_big'] = rC['icon_big'];
                    ret['user_agent']['device_brand_info_url'] = "https://udger.com/resources/ua-list/devices-brand-detail?brand=" + rC['brand_code'];
                }
            }

            debug("parse useragent string: END, unset useragent string");
            this.ua = '';
        }

        if (this.ip) {
            debug("parse IP address: START (IP: " + this.ip + ")");

            ret['ip_address']['ip'] = this.ip;

            let ipver = getIpVersion(this.ip);

            if (ipver === 4 || ipver === 6) {
                if (ipver === 6) {
                    this.ip = inet_ntop(inet_pton(this.ip));
                    debug("compress IP address is:" + this.ip);
                }
            }

            ret['ip_address']['ip_ver'] = ipver;

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

            r = q.get(this.ip);

            if (r) {
                ret['ip_address']['ip_classification'] = r['ip_classification'];
                ret['ip_address']['ip_classification_code'] = r['ip_classification_code'];
                ret['ip_address']['ip_last_seen'] = r['ip_last_seen'];
                ret['ip_address']['ip_hostname'] = r['ip_hostname'];
                ret['ip_address']['ip_country'] = r['ip_country'];
                ret['ip_address']['ip_country_code'] = r['ip_country_code'];
                ret['ip_address']['ip_city'] = r['ip_city'];

                ret['ip_address']['crawler_name'] = r['name'];
                ret['ip_address']['crawler_ver'] = r['ver'];
                ret['ip_address']['crawler_ver_major'] = r['ver_major'];
                ret['ip_address']['crawler_family'] = r['family'];
                ret['ip_address']['crawler_family_code'] = r['family_code'];
                ret['ip_address']['crawler_family_homepage'] = r['family_homepage'];
                ret['ip_address']['crawler_family_vendor'] = r['vendor'];
                ret['ip_address']['crawler_family_vendor_code'] = r['vendor_code'];
                ret['ip_address']['crawler_family_vendor_homepage'] = r['vendor_homepage'];
                ret['ip_address']['crawler_family_icon'] = r['family_icon'];
                if (r['ip_classification_code'] == 'crawler') {
                    ret['ip_address']['crawler_family_info_url'] = "https://udger.com/resources/ua-list/bot-detail?bot=" + r['family'] + "#id" + r['botid'];
                }
                ret['ip_address']['crawler_last_seen'] = r['last_seen'];
                ret['ip_address']['crawler_category'] = r['crawler_classification'];
                ret['ip_address']['crawler_category_code'] = r['crawler_classification_code'];
                ret['ip_address']['crawler_respect_robotstxt'] = r['respect_robotstxt'];
            } else {
                ret['ip_address']['ip_classification'] = 'Unrecognized';
                ret['ip_address']['ip_classification_code'] = 'unrecognized';
            }

            let ipInt;
            let ip;

            if (ipver === 4) {

                ip = new Address4(this.ip);
                ipInt = ip.bigInteger().intValue();

                q = this.db.prepare(
                    "SELECT name, name_code, homepage "+
                    "FROM udger_datacenter_range "+
                    "JOIN udger_datacenter_list ON udger_datacenter_range.datacenter_id=udger_datacenter_list.id "+
                    "WHERE iplong_from <=?  AND iplong_to >=?"
                );

                r = q.get(ipInt, ipInt);

                if (r) {
                    ret['ip_address']['datacenter_name'] = r['name'];
                    ret['ip_address']['datacenter_name_code'] = r['name_code'];
                    ret['ip_address']['datacenter_homepage'] = r['homepage'];
                }
            } else if (ipver === 6) {

                ip = new Address6(this.ip);
                let t = ip.canonicalForm().split(':');
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
                    ret['ip_address']['datacenter_name'] = r['name'];
                    ret['ip_address']['datacenter_name_code'] = r['name_code'];
                    ret['ip_address']['datacenter_homepage'] = r['homepage'];
                }

            }

            debug("parse IP address: END, unset IP address");
            this.ip = '';
        }

        return ret;
    }
}

module.exports = function(file) {
    return new (UdgerParser)(file);
};
