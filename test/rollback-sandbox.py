"""Run production restore logic against real temporary files, with virtual TV paths.

No SSH, Luna call, process signal, or write outside the temporary directory is allowed.
"""
import os,sys,json,tarfile,hashlib,tempfile,shutil,types,posixpath,builtins
source=sys.argv[1];roots=json.load(open(sys.argv[2]))
base=tempfile.mkdtemp(prefix='mac-tv-rollback-test-')
def physical(p):
 assert isinstance(p,str) and p.startswith('/') and '..' not in p.split('/'),p
 return os.path.join(base,*p.lstrip('/').split('/'))
def put(p,data):
 target=physical(p);os.makedirs(os.path.dirname(target),exist_ok=True)
 with open(target,'wb') as f:f.write(data)
app=roots[0];control='/var/lib/webosbrew/gathin-controls';wall='/var/lib/webosbrew/gathin-wallpaper'
files={app+'/control-token.js':b'window.GATHIN_CONTROL_TOKEN="original";',app+'/wallpaper.jpg':b'original wallpaper',control+'/bridge.token':b'original',wall+'/slideshow.json':b'{"selected":["wallpaper.jpg"],"interval":17}', '/home/root/gathin-home-keyhook.py':b'print("original")\n'}
stage='/tmp/gathin-app-upgrade-fixture' if '--preserve' in sys.argv or '--promote' in sys.argv else '/tmp/mac-tv-rollback-fixture';os.makedirs(physical(stage))
archive=physical(stage+'/snapshot.tar.gz')
with tarfile.open(archive,'w:gz') as t:
 for p,data in files.items():
  put(p,data);t.add(physical(p),arcname=p.lstrip('/'),recursive=False)
digest=hashlib.sha256(open(archive,'rb').read()).hexdigest()
entries=[{'path':p,'type':'file','sha256':hashlib.sha256(data).hexdigest()} for p,data in files.items()]
record={'roots':roots,'parents':dict((r,posixpath.dirname(r)) for r in roots),'entries':entries,'saved':{'sha256':digest},'active':[],'apps':[]}
put(stage+'/snapshot.json',json.dumps(record).encode())
for p in files:put(p,b'BROKEN INSTALLATION')
put(app+'/new-code.js',b'new file must disappear')
added='/var/lib/webosbrew/gathin-remote/server.js';put(added,b'new service must disappear')
fakepath=types.SimpleNamespace(dirname=posixpath.dirname,basename=posixpath.basename,normpath=posixpath.normpath,realpath=posixpath.normpath)
for name in ['exists','lexists','isfile','islink','isdir']:
 setattr(fakepath,name,lambda p,n=name:getattr(os.path,n)(physical(p)))
fakeos=types.SimpleNamespace(path=fakepath,geteuid=lambda:0,listdir=lambda p:[] if p=='/proc' else os.listdir(physical(p)))
for name in ['mkdir','makedirs','unlink','readlink','chmod']:
 setattr(fakeos,name,lambda p,*a,n=name,**kw:getattr(os,n)(physical(p),*a,**kw))
fault='--fail-during-restore' in sys.argv
def rename(a,b):
 global fault
 if fault and b==control and a.endswith('.new'):
  fault=False
  raise OSError('Injected destination failure')
 if os.path.isfile(physical(a)) and os.path.isfile(physical(b)):os.replace(physical(a),physical(b))
 else:os.rename(physical(a),physical(b))
fakeos.rename=rename
fakeos.symlink=lambda a,b:os.symlink(a,physical(b))
fakeos.kill=lambda *a:(_ for _ in ()).throw(AssertionError('No process signals allowed'))
fakeshutil=types.SimpleNamespace(copytree=lambda a,b,**kw:shutil.copytree(physical(a),physical(b),**kw),copy2=lambda a,b:shutil.copy2(physical(a),physical(b)))
class Tar:
 def __init__(self,p,*a):self.archive=tarfile.open(physical(p),*a)
 def __enter__(self):return self
 def __exit__(self,*a):self.archive.close()
 def getmembers(self):return self.archive.getmembers()
 def extractall(self,p):self.archive.extractall(physical(p))
faketar=types.SimpleNamespace(open=Tar)
calls=[]
fakesub=types.SimpleNamespace(call=lambda a:calls.append(a) or 0,check_call=lambda a:calls.append(a) or 0)
realimport=builtins.__import__
def isolated_import(name,*a,**kw):
 if name=='sys' and ('--preserve' in sys.argv or '--promote' in sys.argv):return virtualsys
 return {'os':fakeos,'shutil':fakeshutil,'tarfile':faketar,'subprocess':fakesub}.get(name) or realimport(name,*a,**kw)
isolated=dict(vars(builtins));isolated['__import__']=isolated_import
isolated['open']=lambda p,*a,**kw:open(physical(p),*a,**kw)
namespace={'__name__':'sandbox','__builtins__':isolated}
try:
 if '--preserve' in sys.argv or '--promote' in sys.argv:
  for p,data in files.items():put(p,data)
  virtualsys=types.SimpleNamespace(argv=['script',stage,'save'])
  if '--promote' in sys.argv:
   payload={'appinfo.json':b'{"id":"com.gathin.tvhome","version":"1.4.0"}','new-code.js':b'NEW CODE','wallpaper.jpg':b'PACKAGED DEFAULT'}
   manifest=[]
   with tarfile.open(physical(stage+'/app.tar.gz'),'w:gz') as t:
    for name,data in payload.items():
     temp=physical(stage+'/payload/'+name);os.makedirs(os.path.dirname(temp),exist_ok=True)
     open(temp,'wb').write(data);t.add(temp,arcname=name,recursive=False)
     manifest.append({'path':name,'sha256':hashlib.sha256(data).hexdigest()})
   put(stage+'/manifest.json',json.dumps(manifest).encode())
   exec(compile(open(source,'rb').read(),source,'exec'),namespace)
  else:
   exec(compile(open(source,'rb').read(),source,'exec'),namespace)
   shutil.rmtree(physical(app));os.makedirs(physical(app))
   put(app+'/new-code.js',b'NEW CODE');put(app+'/wallpaper.jpg',b'PACKAGED DEFAULT')
   virtualsys.argv[2]='restore'
   exec(compile(open(source,'rb').read(),source,'exec'),namespace)
  assert open(physical(app+'/wallpaper.jpg'),'rb').read()==files[app+'/wallpaper.jpg']
  assert open(physical(app+'/control-token.js'),'rb').read()==files[app+'/control-token.js']
  assert open(physical(app+'/new-code.js'),'rb').read()==b'NEW CODE'
  print('Verified: new application code with original per-TV token and wallpaper')
  sys.exit(0)
 exec(compile(open(source,'rb').read(),source,'exec'),namespace)
 namespace['luna_apps']=lambda:[]
 if '--fail-during-restore' in sys.argv:
  try:namespace['restore'](stage)
  except OSError as e:assert 'Injected destination failure' in str(e)
  else:raise AssertionError('Expected an injected restore failure')
  for p in files:assert open(physical(p),'rb').read()==b'BROKEN INSTALLATION',p
  assert os.path.exists(physical(app+'/new-code.js'))
  assert os.path.exists(physical(added))
  print('Verified: interrupted restore compensates prior file replacements')
  sys.exit(0)
 namespace['restore'](stage)
 for p,data in files.items():assert open(physical(p),'rb').read()==data,p
 assert not os.path.exists(physical(app+'/new-code.js'))
 assert not os.path.exists(physical(added))
 assert not os.path.exists(physical('/home/root/DISABLE-GATHIN-HOME'))
 print('Verified: exact original files, tokens, wallpaper settings; added files/services removed; native HOME retained')
finally:shutil.rmtree(base)
