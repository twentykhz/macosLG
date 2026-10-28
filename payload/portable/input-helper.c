/* Project-owned static input/PTY adapter. No firmware patch or Python ABI. */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
enum { HOME_KEY=773, BACK_KEY=412, MAX_KEYS=2048 };
static int is_home(int type,int code){return type==1&&code==HOME_KEY;}
static int self_test(void){if(!is_home(1,773)||is_home(0,773)||is_home(1,412))return 1;puts("{\"ok\":true,\"homeCode\":773,\"backCode\":412}");return 0;}
#ifdef _WIN32
int main(int argc,char **argv){return argc==2&&!strcmp(argv[1],"--self-test")?self_test():2;}
#else
#include <unistd.h>
#include <fcntl.h>
#include <errno.h>
#include <signal.h>
#include <dirent.h>
#include <poll.h>
#include <pty.h>
#include <sys/ioctl.h>
#include <sys/wait.h>
#include <linux/input.h>
static volatile sig_atomic_t running=1;
static const char *marker="/home/root/DISABLE-GATHIN-HOME",*ready="/tmp/gathin-home-keyhook.ready";
static void stop(int s){(void)s;running=0;}
static int exists(const char *p){return access(p,F_OK)==0;}
static void reap(void){while(waitpid(-1,NULL,WNOHANG)>0){};}
static int emit(int fd,const struct input_event *e){return write(fd,e,sizeof(*e))==(ssize_t)sizeof(*e)?0:-1;}
static int devices(char *source,char *target){
 FILE *f=fopen("/proc/bus/input/devices","r");char line[1024];int role=0;
 if(!f)return -1;source[0]=target[0]=0;
 while(fgets(line,sizeof(line),f)){
  if(line[0]=='\n'){role=0;continue;}
  if(strstr(line,"N: Name=")&&strstr(line,"M-RCU")&&strstr(line,"Builtin"))role=strstr(line,"[0]")?1:strstr(line,"[1]")?2:0;
  if(role&&strstr(line,"H: Handlers=")){char *p=strstr(line,"event");int n;if(p&&sscanf(p,"event%d",&n)==1&&n>=0&&n<1024)snprintf(role==1?source:target,64,"/dev/input/event%d",n);}
 }
 fclose(f);return source[0]&&target[0]&&strcmp(source,target)?0:-1;
}
static int compositor(const char *target){
 DIR *d=opendir("/proc");struct dirent *e;int found=0;if(!d)return 0;
 while(!found&&(e=readdir(d))){if(e->d_name[0]<'0'||e->d_name[0]>'9')continue;char p[256],cmd[2048];snprintf(p,sizeof(p),"/proc/%s/cmdline",e->d_name);FILE *f=fopen(p,"r");if(!f)continue;size_t n=fread(cmd,1,sizeof(cmd)-1,f);fclose(f);cmd[n]=0;if(!strstr(cmd,"surface-manager"))continue;
  snprintf(p,sizeof(p),"/proc/%s/fd",e->d_name);DIR *fds=opendir(p);struct dirent *fd;if(!fds)continue;while((fd=readdir(fds))){char link[512],dest[256];snprintf(link,sizeof(link),"%s/%s",p,fd->d_name);ssize_t len=readlink(link,dest,sizeof(dest)-1);if(len>0){dest[len]=0;if(!strcmp(dest,target)){found=1;break;}}}closedir(fds);
 }closedir(d);return found;
}
static int same_ioctl(int a,int b,unsigned long req,size_t size,size_t skip){unsigned char x[256]={0},y[256]={0};if(size>sizeof(x)||ioctl(a,req,x)<0||ioctl(b,req,y)<0)return 0;return !memcmp(x+skip,y+skip,size-skip);}
static int held(int fd){unsigned char keys[256]={0};if(ioctl(fd,EVIOCGKEY(sizeof(keys)),keys)<0)return -1;for(size_t i=0;i<sizeof(keys);i++)if(keys[i])return 1;return 0;}
static void launch(void){pid_t p=fork();if(p)return;int n=open("/dev/null",O_RDWR);if(n>=0){dup2(n,0);dup2(n,1);dup2(n,2);if(n>2)close(n);}execl("/usr/bin/luna-send","luna-send","-w","1500","-n","1","luna://com.webos.applicationManager/launch","{\"id\":\"com.gathin.tvhome\"}",(char*)NULL);_exit(127);}
static int query(const char *api,const char *key,const char *value){
 int pipes[2];if(pipe(pipes))return 0;pid_t p=fork();if(p<0){close(pipes[0]);close(pipes[1]);return 0;}if(!p){dup2(pipes[1],1);close(pipes[0]);close(pipes[1]);int n=open("/dev/null",O_RDWR);if(n>=0){dup2(n,0);dup2(n,2);}execl("/usr/bin/luna-send","luna-send","-w","600","-n","1",api,"{}",(char*)NULL);_exit(127);}close(pipes[1]);char out[8192],compact[8192],wanted[256];size_t count=0;for(int i=0;i<12&&count<sizeof(out)-1;i++){struct pollfd fd={pipes[0],POLLIN,0};int r=poll(&fd,1,100);if(r>0){ssize_t n=read(pipes[0],out+count,sizeof(out)-1-count);if(n<=0)break;count+=(size_t)n;}}close(pipes[0]);if(waitpid(p,NULL,WNOHANG)==0){kill(p,SIGTERM);waitpid(p,NULL,0);}out[count]=0;size_t at=0;for(size_t i=0;i<count;i++)if(out[i]!=' '&&out[i]!='\n'&&out[i]!='\r'&&out[i]!='\t')compact[at++]=out[i];compact[at]=0;snprintf(wanted,sizeof(wanted),"\"%s\":\"%s\"",key,value);if(!*value){snprintf(wanted,sizeof(wanted),"\"%s\":\"",key);char *v=strstr(compact,wanted);return strstr(compact,"\"returnValue\":true")&&v&&v[strlen(wanted)]!='"';}return strstr(compact,"\"returnValue\":true")&&strstr(compact,wanted);
}
static int consume_back(void){return query("luna://com.webos.applicationManager/getForegroundAppInfo","appId","")&&!query("luna://com.webos.applicationManager/getForegroundAppInfo","appId","com.gathin.tvhome")&&query("luna://com.webos.surfacemanager/getCurrentState","currentState","none")&&query("luna://com.webos.service.nlp/getNlpStatus","status","ready");}
static int relay(int probe){
 char source[64],target[64];int in=-1,out=-1,grabbed=0,rc=1,home_down=0,back=0;unsigned char downs[MAX_KEYS]={0};
 if(geteuid()!=0){fputs("root required\n",stderr);return 1;}
 if((!probe&&exists(marker))||devices(source,target)){fputs("Magic Remote source/target missing or disabled\n",stderr);return 1;}
 in=open(source,O_RDONLY|O_NONBLOCK|O_CLOEXEC);out=open(target,O_RDWR|O_NONBLOCK|O_CLOEXEC);if(in<0||out<0||!compositor(target)){fputs("input open/compositor check failed\n",stderr);goto done;}
 if(!same_ioctl(in,out,EVIOCGBIT(0,8),8,0)||!same_ioctl(in,out,EVIOCGBIT(EV_KEY,256),256,0)||!same_ioctl(in,out,EVIOCGBIT(EV_REL,8),8,0)||!same_ioctl(in,out,EVIOCGBIT(EV_ABS,8),8,0)||!same_ioctl(in,out,EVIOCGPROP(8),8,0)||!same_ioctl(in,out,EVIOCGABS(0),sizeof(struct input_absinfo),4)||!same_ioctl(in,out,EVIOCGABS(1),sizeof(struct input_absinfo),4)){fputs("input capabilities do not match\n",stderr);goto done;}
 for(int i=0;i<100;i++){int a=held(in),b=held(out);if(a<0||b<0)goto done;if(!a&&!b)break;if(i==99||!running){fputs("release held remote keys\n",stderr);goto done;}usleep(100000);}
 struct input_event events[64],syn={0};ssize_t n;while((n=read(in,events,sizeof(events)))>0){}if(n<0&&errno!=EAGAIN)goto done;if(emit(out,&syn))goto done;
 if(probe){puts("{\"probe\":true,\"grabbed\":false}");rc=0;goto done;}
 if(ioctl(in,EVIOCGRAB,1)<0){fputs("exclusive input grab failed\n",stderr);goto done;}grabbed=1;FILE *r=fopen(ready,"w");if(!r)goto done;fprintf(r,"%ld",(long)getpid());fclose(r);puts("HOME relay ACTIVE");fflush(stdout);
 while(running&&!exists(marker)){
  reap();struct pollfd p={in,POLLIN,0};int count=poll(&p,1,250);if(count<0){if(errno==EINTR)continue;goto done;}if(p.revents&(POLLERR|POLLHUP|POLLNVAL))goto done;if(!(p.revents&POLLIN))continue;n=read(in,events,sizeof(events));if(n<=0||n%sizeof(events[0]))goto done;
  for(size_t i=0;i<(size_t)n/sizeof(events[0]);i++){struct input_event *e=&events[i];if(e->type==EV_SYN&&e->code==SYN_DROPPED)goto done;
   if(is_home(e->type,e->code)){if(e->value==1&&!home_down){home_down=1;launch();}if(e->value==0)home_down=0;continue;}
   if(e->type==EV_KEY&&e->code==BACK_KEY){if(e->value==1){back=consume_back();if(back)launch();}if(back){if(e->value==0)back=0;continue;}}
   if(e->type==EV_KEY&&e->code<MAX_KEYS){if(e->value==1)downs[e->code]=1;else if(e->value==0)downs[e->code]=0;}if(emit(out,e))goto done;
  }
 }rc=0;
done:
 if(out>=0){for(int k=0;k<MAX_KEYS;k++)if(downs[k]){struct input_event e={0};e.type=EV_KEY;e.code=(unsigned short)k;emit(out,&e);}struct input_event syn={0};emit(out,&syn);close(out);}if(in>=0){if(grabbed)ioctl(in,EVIOCGRAB,0);close(in);}if(grabbed)unlink(ready);reap();return rc;
}
static int monitor(void){
 int master;pid_t child=forkpty(&master,NULL,NULL,NULL);if(child<0)return 1;if(!child){execl("/usr/sbin/ls-monitor","ls-monitor","-j","-f","com.webos.service.nlp",(char*)NULL);execl("/usr/bin/ls-monitor","ls-monitor","-j","-f","com.webos.service.nlp",(char*)NULL);_exit(127);}char b[65536];while(running){struct pollfd p={master,POLLIN,0};int n=poll(&p,1,250);if(n<0&&errno!=EINTR)break;if(n>0){ssize_t len=read(master,b,sizeof(b));if(len<=0)break;size_t at=0;while(at<(size_t)len){ssize_t w=write(1,b+at,(size_t)len-at);if(w<0){running=0;break;}at+=(size_t)w;}}}kill(child,SIGTERM);for(int i=0;i<20;i++){if(waitpid(child,NULL,WNOHANG)==child){close(master);return 0;}usleep(50000);}kill(child,SIGKILL);waitpid(child,NULL,0);close(master);return 0;
}
int main(int argc,char **argv){
 if(argc!=2)return 2;if(!strcmp(argv[1],"--self-test"))return self_test();if(!strcmp(argv[1],"--abi")){printf("{\"eventSize\":%zu,\"pointerBits\":%zu,\"protocol\":1}\n",sizeof(struct input_event),sizeof(void*)*8);return 0;}
 signal(SIGTERM,stop);signal(SIGINT,stop);if(!strcmp(argv[1],"--monitor-nlp"))return monitor();if(!strcmp(argv[1],"--probe"))return relay(1);if(!strcmp(argv[1],"--home"))return relay(0);return 2;
}
#endif
