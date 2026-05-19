import pdfMake from 'pdfmake/build/pdfmake'
import vfsFonts from 'pdfmake/build/vfs_fonts'

let initialized = false

export function getPdfMake() {
  if (!initialized) {
    pdfMake.addVirtualFileSystem(vfsFonts)
    initialized = true
  }
  return pdfMake
}
