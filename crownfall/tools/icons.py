import sys, struct, zlib
from pathlib import Path
out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=True)
def inside(x,y,poly):
    odd=False
    for i,(a,b) in enumerate(poly):
        c,d=poly[i-1]
        if (b>y)!=(d>y) and x<(c-a)*(y-b)/(d-b)+a: odd=not odd
    return odd
def png(size,path):
    def chunk(t,d):return struct.pack('>I',len(d))+t+d+struct.pack('>I',zlib.crc32(t+d)&0xffffffff)
    shield=[(100,105),(256,68),(412,105),(412,285),(360,375),(256,445),(152,375),(100,285)]
    inner=[(115,117),(256,83),(397,117),(397,280),(347,365),(256,427),(165,365),(115,280)]
    crown=[(147,188),(201,233),(256,152),(311,233),(365,188),(339,307),(173,307)]
    rows=[]
    for iy in range(size):
        row=bytearray([0])
        for ix in range(size):
            x,y=ix*512/size,iy*512/size
            c=(23,44,40)
            if inside(x,y,shield):c=(213,183,111)
            if inside(x,y,inner):c=(46,70,60)
            if inside(x,y,crown) or (174<=x<=338 and 327<=y<=353):c=(228,196,121)
            row.extend(c)
        rows.append(row)
    path.write_bytes(b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>2I5B',size,size,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(b''.join(rows)))+chunk(b'IEND',b''))
for n in (192,512):png(n,out/f'icon-{n}.png')
