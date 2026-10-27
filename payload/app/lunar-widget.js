(function(root){
  'use strict';
  var stems=['Giáp','Ất','Bính','Đinh','Mậu','Kỷ','Canh','Tân','Nhâm','Quý'];
  var branches=['Tý','Sửu','Dần','Mão','Thìn','Tỵ','Ngọ','Mùi','Thân','Dậu','Tuất','Hợi'];
  var hours=[[0,1,3,6,8,9],[2,3,5,8,10,11],[0,1,4,5,7,10],[0,2,3,6,7,9],[2,4,5,8,9,11],[1,4,6,7,10,11]];
  // Lục diệu: month 1/day 1 starts at Đại an, advance once per lunar month/day.
  var fortunes=[
    {name:'Đại an',level:'Thuận',good:true,activities:'Gặp gỡ, thăm hỏi · Lập kế hoạch lâu dài'},
    {name:'Lưu niên',level:'Cần cân nhắc',good:false,activities:'Hoàn tất việc cũ · Chuẩn bị, rà soát kế hoạch'},
    {name:'Tốc hỷ',level:'Thuận',good:true,activities:'Gặp gỡ, trao đổi · Giải quyết việc cần nhanh'},
    {name:'Xích khẩu',level:'Cần cân nhắc',good:false,activities:'Làm việc độc lập · Giữ hòa khí, tránh tranh luận'},
    {name:'Tiểu cát',level:'Thuận',good:true,activities:'Giao lưu, kết nối · Trao đổi công việc'},
    {name:'Không vong',level:'Cần cân nhắc',good:false,activities:'Nghỉ ngơi, tĩnh tâm · Chuẩn bị thay vì khởi sự'}
  ];
  function pad(n){return n<10?'0'+n:String(n);}
  function compute(date,lunar){
    var instant=date instanceof Date?date:new Date(date),vn=new Date(instant.getTime()+7*3600000);
    if(!lunar)lunar=root.getVietnameseLunarDate(instant);
    var d=vn.getUTCDate(),m=vn.getUTCMonth()+1,y=vn.getUTCFullYear(),a=Math.floor((14-m)/12),yy=y+4800-a,mm=m+12*a-3;
    var jd=d+Math.floor((153*mm+2)/5)+365*yy+Math.floor(yy/4)-Math.floor(yy/100)+Math.floor(yy/400)-32045;
    var dayBranch=(jd+1)%12,fortune=fortunes[(lunar.month+lunar.day-2)%6];
    return {solarKey:y+'-'+m+'-'+d,lunar:lunar,dayName:stems[(jd+9)%10]+' '+branches[dayBranch],yearName:stems[(lunar.year+6)%10]+' '+branches[(lunar.year+8)%12],fortune:fortune,guidance:root.GathinDayRules?root.GathinDayRules(instant,lunar,dayBranch,fortune):null,
      dayBranch:dayBranch,hours:hours[dayBranch%6].map(function(index){return {index:index,branch:branches[index],range:index===0?'23–01':pad(index*2-1)+'–'+pad(index*2+1)};})};
  }
  function currentHour(date){var data=compute(date),vn=new Date(date.getTime()+7*3600000),hour=vn.getUTCHours(),index=Math.floor((hour+1)/2)%12,good=data.hours.filter(function(h){return h.index===index;})[0];
    if(good)return {good:true,text:'Đang trong khung giờ tốt '+good.range+' ('+good.branch+')'};
    var next=data.hours.filter(function(h){return (h.index===0?23:h.index*2-1)>hour;}).sort(function(a,b){return (a.index===0?23:a.index*2-1)-(b.index===0?23:b.index*2-1);})[0];
    if(next)return {good:false,text:'Kế tiếp: '+next.range+' ('+next.branch+')'};
    return {good:false,text:'Hết khung giờ tốt hôm nay'};
  }
  root.getVietnameseAlmanac=compute;
  root.getVietnameseGoodHour=currentHour;
  if(typeof module!=='undefined'&&module.exports){module.exports=compute;return;}
  var card=document.createElement('section');card.id='lunarWidget';card.setAttribute('aria-label','Âm lịch Việt Nam');
  card.innerHTML='<div class="lw-heading"><span>ÂM LỊCH VIỆT NAM</span><span id="lwFortune"></span></div><div class="lw-date"><strong id="lwDay"></strong><span id="lwMonth"></span></div><div id="lwCanChi"></div><div id="lwActivities"></div><div id="lwCurrentHour"></div>';
  document.querySelector('header').appendChild(card);var previous='';
  function fit(){var last=document.getElementById('lwCurrentHour'),ids=['lwDay','lwMonth','lwCanChi','lwActivities','lwCurrentHour'];ids.forEach(function(id){document.getElementById(id).style.fontSize='';});for(var pass=0;pass<3;pass++){var r=card.getBoundingClientRect(),bottom=last.getBoundingClientRect().bottom;if(bottom<=r.bottom-15)break;ids.forEach(function(id){var e=document.getElementById(id),size=parseFloat(getComputedStyle(e).fontSize);e.style.fontSize=Math.max(id==='lwDay'?48:18,size*.94)+'px';});}}
  function render(){var now=new Date(),data=compute(now),status=currentHour(now),hourLabel=document.getElementById('lwCurrentHour');hourLabel.textContent=status.good?status.text:'Chưa vào giờ tốt · '+status.text;hourLabel.className=status.good?'is-good':'is-waiting';if(previous===data.solarKey){requestAnimationFrame(fit);return;}previous=data.solarKey;
    document.getElementById('lwDay').textContent=pad(data.lunar.day);
    document.getElementById('lwMonth').textContent='tháng '+data.lunar.month+(data.lunar.isLeap?' nhuận':'')+' · '+data.yearName;
    document.getElementById('lwCanChi').textContent='Ngày '+data.dayName+' · Năm '+data.lunar.year;
    var badge=document.getElementById('lwFortune');badge.textContent=data.guidance?data.guidance.score+'% · '+(data.guidance.score>=65?'Ngày thuận':data.guidance.score>=45?'Trung bình':'Cần cân nhắc'):data.fortune.level;badge.className=(data.guidance?data.guidance.score>=65:data.fortune.good)?'favorable':'consider';badge.title=data.guidance?data.guidance.method:'';
    document.getElementById('lwActivities').textContent=data.guidance?data.guidance.summary:'Nên: '+data.fortune.activities;requestAnimationFrame(fit);
  }
  window.GathinLunarRefresh=render;render();
}(typeof window!=='undefined'?window:this));
