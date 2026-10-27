(function(root){
  'use strict';
  function fold(value){var s=String(value||'').toLowerCase().replace(/đ/g,'d');if(s.normalize)s=s.normalize('NFD').replace(/[\u0300-\u036f]/g,'');return s.replace(/[^a-z0-9]/g,'');}
  function display(place){var parts=(place.name||'').split(',').map(function(s){return s.trim();}),locality=place.locality||parts[0]||'',province=place.province||parts[1]||'';
    var cities={hanoi:'Hà Nội',hochiminh:'TP. Hồ Chí Minh',hochiminhcity:'TP. Hồ Chí Minh',haiphong:'Hải Phòng',danang:'Đà Nẵng',cantho:'Cần Thơ',hue:'Huế'};
    locality=cities[fold(locality)]||locality;province=cities[fold(province)]||province;
    if(/^(vietnam|vn)$/.test(fold(province)))province='';
    if(fold(locality)===fold(province))province='';
    return [locality,province].filter(function(s){return !!s;}).join(', ').slice(0,100);
  }
  root.GathinPlaceName=display;if(typeof module!=='undefined'&&module.exports)module.exports=display;
}(typeof window!=='undefined'?window:this));
