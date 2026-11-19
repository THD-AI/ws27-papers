"""Sets how the deck PDF opens: one page at a time, the whole page in view,
and in presentation (full screen) mode in viewers that honour it (Acrobat,
SumatraPDF, Okular). Usage: python tools/deck_pdf_view.py <file.pdf>"""
import sys
from pypdf import PdfReader, PdfWriter
from pypdf.generic import ArrayObject, NameObject

src = sys.argv[1]
reader = PdfReader(src)
writer = PdfWriter(clone_from=reader)
root = writer._root_object
root[NameObject('/PageLayout')] = NameObject('/SinglePage')
root[NameObject('/PageMode')] = NameObject('/FullScreen')
first = writer.pages[0].indirect_reference
root[NameObject('/OpenAction')] = ArrayObject([first, NameObject('/Fit')])
with open(src, 'wb') as f:
    writer.write(f)
print('view settings set:', src)
