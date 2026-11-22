# Contact sheet: python tools/contact-sheet.py out.png in1.png in2.png ...
import sys
from PIL import Image
files=sys.argv[2:]; out=sys.argv[1]
ims=[Image.open(f) for f in files]
w=max(i.width for i in ims); h=max(i.height for i in ims)
cols=4 if w<600 else 3
sc=min(1, 1600/(cols*w))
tw,th=int(w*sc),int(h*sc)
rows=(len(ims)+cols-1)//cols
S=Image.new('RGB',(cols*tw+ (cols-1)*8, rows*th+(rows-1)*8),'#888')
for k,i in enumerate(ims):
    S.paste(i.resize((tw,th)),((k%cols)*(tw+8),(k//cols)*(th+8)))
S.save(out)
