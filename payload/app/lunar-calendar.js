/* Vietnamese lunar calendar conversion (Ho Ngoc Duc astronomical algorithm), fixed UTC+7. */
(function (root) {
  'use strict';

  var PI = Math.PI;
  var TIME_ZONE = 7;

  function jdFromDate(day, month, year) {
    var a = Math.floor((14 - month) / 12);
    var y = year + 4800 - a;
    var m = month + 12 * a - 3;
    var jd = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) -
      Math.floor(y / 100) + Math.floor(y / 400) - 32045;
    if (jd < 2299161) jd = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
    return jd;
  }

  function newMoonDay(k) {
    var t = k / 1236.85;
    var t2 = t * t;
    var t3 = t2 * t;
    var dr = PI / 180;
    var jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * t2 - 0.000000155 * t3;
    jd1 += 0.00033 * Math.sin((166.56 + 132.87 * t - 0.009173 * t2) * dr);
    var m = 359.2242 + 29.10535608 * k - 0.0000333 * t2 - 0.00000347 * t3;
    var m1 = 306.0253 + 385.81691806 * k + 0.0107306 * t2 + 0.00001236 * t3;
    var f = 21.2964 + 390.67050646 * k - 0.0016528 * t2 - 0.00000239 * t3;
    var c1 = (0.1734 - 0.000393 * t) * Math.sin(m * dr) + 0.0021 * Math.sin(2 * m * dr) -
      0.4068 * Math.sin(m1 * dr) + 0.0161 * Math.sin(2 * m1 * dr) - 0.0004 * Math.sin(3 * m1 * dr) +
      0.0104 * Math.sin(2 * f * dr) - 0.0051 * Math.sin((m + m1) * dr) -
      0.0074 * Math.sin((m - m1) * dr) + 0.0004 * Math.sin((2 * f + m) * dr) -
      0.0004 * Math.sin((2 * f - m) * dr) - 0.0006 * Math.sin((2 * f + m1) * dr) +
      0.0010 * Math.sin((2 * f - m1) * dr) + 0.0005 * Math.sin((2 * m1 + m) * dr);
    var deltaT = t < -11 ? 0.001 + 0.000839 * t + 0.0002261 * t2 - 0.00000845 * t3 - 0.000000081 * t * t3 :
      -0.000278 + 0.000265 * t + 0.000262 * t2;
    return Math.floor(jd1 + c1 - deltaT + 0.5 + TIME_ZONE / 24);
  }

  function sunLongitudeSector(dayNumber) {
    var t = (dayNumber - 0.5 - TIME_ZONE / 24 - 2451545.0) / 36525;
    var t2 = t * t;
    var dr = PI / 180;
    var m = 357.52910 + 35999.05030 * t - 0.0001559 * t2 - 0.00000048 * t * t2;
    var l0 = 280.46645 + 36000.76983 * t + 0.0003032 * t2;
    var dl = (1.914600 - 0.004817 * t - 0.000014 * t2) * Math.sin(dr * m) +
      (0.019993 - 0.000101 * t) * Math.sin(2 * dr * m) + 0.000290 * Math.sin(3 * dr * m);
    var omega = 125.04 - 1934.136 * t;
    var longitude = (l0 + dl - 0.00569 - 0.00478 * Math.sin(omega * dr)) * dr;
    longitude -= 2 * PI * Math.floor(longitude / (2 * PI));
    return Math.floor(longitude / PI * 6);
  }

  function lunarMonth11(year) {
    var off = jdFromDate(31, 12, year) - 2415021;
    var k = Math.floor(off / 29.530588853);
    var nm = newMoonDay(k);
    if (sunLongitudeSector(nm) >= 9) nm = newMoonDay(k - 1);
    return nm;
  }

  function leapMonthOffset(a11) {
    var k = Math.floor(0.5 + (a11 - 2415021.076998695) / 29.530588853);
    var last = 0;
    var i = 1;
    var arc = sunLongitudeSector(newMoonDay(k + i));
    while (arc !== last && i < 14) {
      last = arc;
      i++;
      arc = sunLongitudeSector(newMoonDay(k + i));
    }
    return i - 1;
  }

  function getVietnameseLunarDate(date) {
    var instant = date instanceof Date ? date : new Date(date || Date.now());
    // Shift the instant to Vietnam time, then use UTC fields to avoid host timezone/DST effects.
    var vn = new Date(instant.getTime() + TIME_ZONE * 60 * 60 * 1000);
    var day = vn.getUTCDate();
    var month = vn.getUTCMonth() + 1;
    var year = vn.getUTCFullYear();
    var dayNumber = jdFromDate(day, month, year);
    var k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853);
    var monthStart = newMoonDay(k + 1);
    if (monthStart > dayNumber) monthStart = newMoonDay(k);
    var a11 = lunarMonth11(year);
    var b11 = a11;
    var lunarYear;
    if (a11 >= monthStart) {
      lunarYear = year;
      a11 = lunarMonth11(year - 1);
    } else {
      lunarYear = year + 1;
      b11 = lunarMonth11(year + 1);
    }
    var lunarDay = dayNumber - monthStart + 1;
    var diff = Math.floor((monthStart - a11) / 29);
    var lunarMonth = diff + 11;
    var isLeap = false;
    if (b11 - a11 > 365) {
      var leapDiff = leapMonthOffset(a11);
      if (diff >= leapDiff) {
        lunarMonth = diff + 10;
        if (diff === leapDiff) isLeap = true;
      }
    }
    if (lunarMonth > 12) lunarMonth -= 12;
    if (lunarMonth >= 11 && diff < 4) lunarYear--;
    return { day: lunarDay, month: lunarMonth, year: lunarYear, isLeap: isLeap };
  }

  root.getVietnameseLunarDate = getVietnameseLunarDate;
  if (typeof module !== 'undefined' && module.exports) module.exports = getVietnameseLunarDate;
}(typeof window !== 'undefined' ? window : this));
