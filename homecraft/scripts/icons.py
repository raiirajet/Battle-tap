import sys, pathlib, struct, zlib, re, json
def inside(x,y,poly):
    result=False
    for i,a in enumerate(poly):
        b=poly[i-1]
        if (a[1]>y)!=(b[1]>y) and x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]: result=not result
    return result
def png(path,n):
    polygons=[([(32,88),(96,40),(160,88),(160,150),(96,180),(32,150)],(85,196,175)), ([(47,92),(82,109),(82,155),(47,137)],(250,252,251)), ([(112,127),(144,111),(144,143),(112,158)],(209,244,236)), ([(93,40),(99,40),(99,180),(93,180)],(16,43,43)), ([(32,85),(96,117),(160,85),(160,92),(96,124),(32,92)],(16,43,43))]
    raw=bytearray()
    for j in range(n):
        raw.append(0)
        for i in range(n):
            x,y=(i+.5)*192/n,(j+.5)*192/n
            color=(16,43,43)
            for poly,col in polygons:
                if inside(x,y,poly): color=col
            raw.extend(color)
    def chunk(tag,d):return struct.pack('>I',len(d))+tag+d+struct.pack('>I',zlib.crc32(tag+d)&0xffffffff)
    path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',n,n,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(raw,9))+chunk(b'IEND',b''))
mode=sys.argv[1]
if mode=='public':
    for n in (192,512):png(pathlib.Path('public')/f'icon-{n}.png',n)
elif mode=='android':
    root=pathlib.Path('android/app/src/main/res')
    for density,n in [('mdpi',48),('hdpi',72),('xhdpi',96),('xxhdpi',144),('xxxhdpi',192)]:
        for name in ('ic_launcher','ic_launcher_round'):png(root/f'mipmap-{density}'/(name+'.png'),n)
    for path in (root/'mipmap-anydpi-v26').glob('ic_launcher*.xml'):path.unlink()
    version=json.loads(pathlib.Path('package.json').read_text())['version'];parts=[int(x) for x in version.split('.')];code=parts[0]*1000000+parts[1]*1000+parts[2]
    gradle=pathlib.Path('android/app/build.gradle');s=gradle.read_text();s=re.sub(r'versionCode\s+\d+',f'versionCode {code}',s);s=re.sub(r'versionName\s+"[^"]+"',f'versionName "{version}"',s);gradle.write_text(s)
else:raise SystemExit('Unknown mode')
