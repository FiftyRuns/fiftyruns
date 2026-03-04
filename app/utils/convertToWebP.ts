export async function convertToWebP(file: File, quality = 0.85): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx?.drawImage(img, 0, 0)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Konvertierung fehlgeschlagen'))
            return
          }
          const webpFile = new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), {
            type: 'image/webp',
          })
          resolve(webpFile)
        },
        'image/webp',
        quality,
      )
    }

    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}
