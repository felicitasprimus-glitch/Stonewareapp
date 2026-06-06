// Erzeugt das "Bookmarklet" (Lesezeichen-Code), mit dem man ein Produkt direkt
// von der gerade geöffneten Shop-Seite in den Stylist übernimmt – ohne Server,
// ohne CORS-Problem, weil der Code in der echten Shop-Seite läuft.

export function makeBookmarklet(appUrl) {
  // Wird als String in der echten Shop-Seite ausgeführt.
  const code = `(function(){
  var d=document,p=null;
  try{
    var s=d.querySelectorAll('script[type="application/ld+json"]');
    for(var i=0;i<s.length&&!p;i++){
      try{var j=JSON.parse(s[i].textContent);}catch(e){continue;}
      var a=j['@graph']||(Array.isArray(j)?j:[j]);
      for(var k=0;k<a.length;k++){var n=a[k];if(!n)continue;var t=n['@type'];
        if(t=='Product'||(Array.isArray(t)&&t.indexOf('Product')>=0)){p=n;break;}}
    }
  }catch(e){}
  function m(pr){var e=d.querySelector('meta[property="'+pr+'"]')||d.querySelector('meta[name="'+pr+'"]');return e?e.content:null;}
  var name=(p&&p.name)||m('og:title')||d.title;
  var img=p?(Array.isArray(p.image)?p.image[0]:((p.image&&p.image.url)||p.image)):m('og:image');
  var price=null,cur='EUR';
  if(p&&p.offers){var o=Array.isArray(p.offers)?p.offers[0]:p.offers;if(o){price=o.price||o.lowPrice;cur=o.priceCurrency||cur;}}
  if(price==null)price=m('product:price:amount')||m('og:price:amount');
  var sel=d.querySelector('[class*=price],[itemprop=price]');
  if(price==null&&sel)price=(sel.getAttribute('content')||sel.textContent||'').trim();
  if(!name){alert('Kein Produkt erkannt. Bitte auf einer Produktseite klicken.');return;}
  var prod={name:name,price:price,image:img,link:location.href,color:(p&&p.color)||''};
  var data=btoa(unescape(encodeURIComponent(JSON.stringify(prod))));
  window.open('${appUrl}#add='+data,'_blank');
})();`
  return 'javascript:' + encodeURIComponent(code)
}

// Liest ein per Bookmarklet übergebenes Produkt aus der URL (#add=...).
export function readAddFromHash() {
  const h = window.location.hash || ''
  if (!h.startsWith('#add=')) return null
  try {
    const json = decodeURIComponent(escape(atob(h.slice(5))))
    return JSON.parse(json)
  } catch (e) {
    return null
  }
}
