(function () {

  var CURRENCY_MAP = {
    MX: { code: 'MXN', symbol: 'MX$',  decimals: 0 },
    CO: { code: 'COP', symbol: 'COP$', decimals: 0 },
    AR: { code: 'ARS', symbol: 'AR$',  decimals: 0 },
    CL: { code: 'CLP', symbol: 'CLP$', decimals: 0 },
    PE: { code: 'PEN', symbol: 'S/',   decimals: 2 },
    BR: { code: 'BRL', symbol: 'R$',   decimals: 2 },
    UY: { code: 'UYU', symbol: 'UY$',  decimals: 0 },
    PY: { code: 'PYG', symbol: 'Gs.',  decimals: 0 },
    BO: { code: 'BOB', symbol: 'Bs.',  decimals: 2 },
    DO: { code: 'DOP', symbol: 'RD$',  decimals: 0 },
    GT: { code: 'GTQ', symbol: 'Q',    decimals: 2 },
    HN: { code: 'HNL', symbol: 'L',    decimals: 2 },
    NI: { code: 'NIO', symbol: 'C$',   decimals: 2 },
    CR: { code: 'CRC', symbol: '₡',    decimals: 0 },
    PA: { code: 'USD', symbol: 'US$',  decimals: 2 },
    EC: { code: 'USD', symbol: 'US$',  decimals: 2 },
    SV: { code: 'USD', symbol: 'US$',  decimals: 2 },
    VE: { code: 'USD', symbol: 'US$',  decimals: 2 },
    CU: { code: 'USD', symbol: 'US$',  decimals: 2 }
  };

  var CACHE_TTL = 6 * 60 * 60 * 1000; // 6 horas

  function getCache(key) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      if (Date.now() - obj.ts > CACHE_TTL) { localStorage.removeItem(key); return null; }
      return obj.val;
    } catch (e) { return null; }
  }

  function setCache(key, val) {
    try { localStorage.setItem(key, JSON.stringify({ ts: Date.now(), val: val })); } catch (e) {}
  }

  function fmt(amount, decimals) {
    if (decimals === 0) {
      if (amount >= 10000) amount = Math.round(amount / 500) * 500;
      else if (amount >= 1000) amount = Math.round(amount / 50) * 50;
      else amount = Math.round(amount / 5) * 5;
      return amount.toLocaleString('es');
    }
    return amount.toFixed(decimals).replace('.', ',');
  }

  function applyPrices(rate, currency) {
    document.querySelectorAll('.price-converter').forEach(function (el) {
      var usd = parseFloat(el.getAttribute('data-usd'));
      if (isNaN(usd)) return;
      el.textContent = currency.symbol + ' ' + fmt(usd * rate, currency.decimals);
    });
  }

  function fallback() {
    document.querySelectorAll('.price-converter').forEach(function (el) {
      var usd = parseFloat(el.getAttribute('data-usd'));
      if (isNaN(usd)) return;
      el.textContent = 'US$ ' + usd.toFixed(2).replace('.', ',');
    });
  }

  function loadRates(currencyCode, onSuccess, onFail) {
    var cacheKey = 'pconv_rate_' + currencyCode;
    var cached = getCache(cacheKey);
    if (cached) { onSuccess(cached); return; }

    fetch('https://open.er-api.com/v6/latest/USD')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var rate = data.rates && data.rates[currencyCode];
        if (!rate) { onFail(); return; }
        setCache(cacheKey, rate);
        onSuccess(rate);
      })
      .catch(onFail);
  }

  function processCountry(countryCode) {
    var currency = CURRENCY_MAP[countryCode];
    if (!currency || currency.code === 'USD') {
      applyPrices(1, currency || { symbol: 'US$', decimals: 2 });
      return;
    }
    loadRates(currency.code, function (rate) { applyPrices(rate, currency); }, fallback);
  }

  function init() {
    var cached = getCache('pconv_geo');
    if (cached) { processCountry(cached); return; }

    fetch('https://ipapi.co/json/')
      .then(function (r) { return r.json(); })
      .then(function (geo) {
        var cc = (geo && geo.country_code) || '';
        setCache('pconv_geo', cc);
        processCountry(cc);
      })
      .catch(fallback);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
