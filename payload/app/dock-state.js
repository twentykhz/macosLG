(function(){
 'use strict';
 function prefs(){var p=window.MAC_DOCK;return p&&Array.isArray(p.ids)&&Array.isArray(p.apps)&&p.ids.length?p:null;}
 function items(base){var p=prefs();if(!p)return base;var by=Object.create(null);p.apps.concat(base).forEach(function(a){by[a.id]=a;});return p.ids.map(function(id){return by[id];}).filter(function(a){return !!a;});}
 function order(apps){var p=prefs();if(!p)return apps;try{var saved=JSON.parse(localStorage.getItem('tvhome.order'));if(saved&&saved.selection===p.ids.join(',')&&Array.isArray(saved.ids)){var by=Object.create(null),out=[];apps.forEach(function(a){by[a.id]=a;});saved.ids.forEach(function(id){if(by[id]){out.push(by[id]);delete by[id];}});return out.concat(apps.filter(function(a){return !!by[a.id];}));}}catch(e){}return apps;}
 window.MacDock={items:items,order:order,hasSelection:function(){return !!prefs();},signature:function(){var p=prefs();return p?p.ids.join(','):null;},apply:function(p){window.MAC_DOCK=p;if(window.MacRefreshDock)window.MacRefreshDock();}};
}());
