(function(){
  try {
    var mark='tvhome.lgws-swap.v1';
    if(localStorage.getItem(mark))return;
    var key='tvhome.order',saved=JSON.parse(localStorage.getItem(key)),ids;
    if(saved&&Array.isArray(saved.ids)) ids=saved.ids.slice();
    else {
      var all=(window.TV_APPS&&TV_APPS.apps)||[],hidden=CONFIG.hiddenApps||[];
      ids=CONFIG.dockApps.filter(function(id){return all.some(function(a){return a.id===id;});});
      var rest=all.filter(function(a){return hidden.indexOf(a.id)<0&&ids.indexOf(a.id)<0;});
      rest.sort(function(a,b){return a.title.toLowerCase()<b.title.toLowerCase()?-1:1;});
      ids=ids.concat(rest.map(function(a){return a.id;}));
      saved={dock:CONFIG.dockApps.join(','),ids:ids};
    }
    var a=ids.indexOf('org.webosbrew.appupdateblocker'),b=ids.indexOf('ooo.lew.lifesgoodwithoutspying');
    if(a>=0&&b>=0){var x=ids[a];ids[a]=ids[b];ids[b]=x;}
    saved.ids=ids;saved.dock=CONFIG.dockApps.join(',');
    localStorage.setItem(key,JSON.stringify(saved));localStorage.setItem(mark,'1');
  }catch(e){}
}());
