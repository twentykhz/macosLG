(function(root){
  'use strict';
  // A transparent traditional-calendar heuristic, not a proprietary app's score.
  var table=[
    ['Kiến',['Cúng lễ, cầu an','Gặp gỡ, họp mặt','Nhập học, bắt đầu việc học'],['Động thổ, đào móng','An táng, cải táng']],
    ['Trừ',['Dọn dẹp, vệ sinh nhà cửa','Tháo bỏ đồ cũ, sửa vật dụng','Cúng lễ, giải trừ'],['Cưới hỏi','Khai trương, khởi sự lớn']],
    ['Mãn',['Cúng lễ, cầu phúc','Họp mặt, tổ chức tiệc','Sắp xếp kho và vật dụng'],['Động thổ, đào móng','An táng, cải táng']],
    ['Bình',['Sửa chữa nhỏ trong nhà','Dọn dẹp, sắp xếp đồ đạc','Họp bàn công việc thường ngày'],['Khởi công công trình lớn','Cưới hỏi, khai trương']],
    ['Định',['Cưới hỏi, lễ đính hôn','Cúng lễ, cầu an','Lập kế hoạch, thống nhất công việc'],['Kiện tụng, tranh chấp','Khởi hành xa']],
    ['Chấp',['Tu sửa nhà và vật dụng','Dọn dẹp, bảo quản đồ dùng','Cúng lễ, cầu phúc'],['Chuyển nhà, nhập trạch','Khai trương']],
    ['Phá',['Tháo dỡ phần đã hỏng','Dọn bỏ vật dụng không dùng','Giải quyết việc tồn đọng'],['Cưới hỏi, nhập trạch','Khai trương, khởi công']],
    ['Nguy',['Cúng lễ, cầu an','Nghỉ ngơi, sắp xếp việc nhà'],['Xuất hành xa','Động thổ, khởi công','Cưới hỏi']],
    ['Thành',['Cưới hỏi, lễ đính hôn','Khai trương, nhận việc','Nhập học, nhập trạch'],['Tranh chấp, kiện tụng']],
    ['Thu',['Thu hoạch, cất giữ sản vật','Sắp xếp kho, bảo quản đồ dùng','Hoàn tất công việc đang dở'],['Khởi công công trình mới','Xuất hành xa']],
    ['Khai',['Khai trương, mở cửa hàng','Nhập học, bắt đầu khóa học','Gặp gỡ, họp mặt','Cưới hỏi, nhập trạch'],['An táng, cải táng']],
    ['Bế',['Cất giữ, bảo quản đồ dùng','Dọn dẹp, nghỉ ngơi','Hoàn tất việc cũ'],['Khai trương, khởi công','Cưới hỏi, nhập trạch','Xuất hành xa']]
  ];
  function rules(date,lunar,branch,fortune){var vn=new Date(date.getTime()+7*3600000),y=vn.getUTCFullYear(),m=vn.getUTCMonth()+1,d=vn.getUTCDate(),a=Math.floor((14-m)/12),yy=y+4800-a,mm=m+12*a-3,jd=d+Math.floor((153*mm+2)/5)+365*yy+Math.floor(yy/4)-Math.floor(yy/100)+Math.floor(yy/400)-32045;
    var t=(jd-.5-7/24-2451545)/36525,rad=Math.PI/180,M=357.5291+35999.0503*t-.0001559*t*t,L=280.46645+36000.76983*t+.0003032*t*t+(1.9146-.004817*t-.000014*t*t)*Math.sin(M*rad)+(.019993-.000101*t)*Math.sin(2*M*rad)+.00029*Math.sin(3*M*rad);L=(L%360+360)%360;
    var solarMonthBranch=(Math.floor(((L+45)%360)/30)+2)%12,officer=(branch-solarMonthBranch+12)%12,row=table[officer],start=((lunar.month-1)%6)*2,hoang=[0,1,4,5,7,10].indexOf((branch-start+12)%12)>=0,tamNuong=[3,7,13,18,22,27].indexOf(lunar.day)>=0,nguyetKy=[5,14,23].indexOf(lunar.day)>=0;
    var score=45+(hoang?18:-12)+(fortune.good?12:-8)+([4,8,10].indexOf(officer)>=0?15:[6,7,11].indexOf(officer)>=0?-15:0)-(tamNuong?15:0)-(nguyetKy?15:0);score=Math.max(5,Math.min(95,score));
    var avoid=row[2].slice(),recommended=row[1].slice();if(score<45){avoid.unshift('Không nên làm việc trọng đại');recommended=['Cúng lễ, thăm hỏi gia đình','Dọn dẹp, sắp xếp đồ dùng','Hoàn tất công việc thường ngày'];}
    return {score:score,officer:row[0],hoang:hoang,do:recommended,avoid:avoid,summary:score<45?'Ngày xấu · Không nên làm việc trọng đại':score<65?'Ngày trung bình · Tránh '+avoid[0].toLowerCase():'Ngày đẹp · Tránh '+avoid[0].toLowerCase(),method:'Điểm quy ước: hoàng/hắc đạo, 12 trực, Lục diệu và ngày kỵ.'};
  }
  root.GathinDayRules=rules;if(typeof module!=='undefined'&&module.exports)module.exports=rules;
}(typeof window!=='undefined'?window:this));
