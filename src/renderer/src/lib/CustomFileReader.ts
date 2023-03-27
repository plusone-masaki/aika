export default class CustomFileReader extends FileReader {
  public readAsArrayBuffer (blob: Blob): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      this.onload = () => resolve(this.result as ArrayBuffer)
      this.onerror = () => reject(this.error)
      super.readAsArrayBuffer(blob)
    })
  }

  public readAsBinaryString (blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      this.onload = () => resolve(this.result as string)
      this.onerror = () => reject(this.error)
      super.readAsBinaryString(blob)
    })
  }

  public readAsDataURL (blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      this.onload = () => resolve(this.result as string)
      this.onerror = () => reject(this.error)
      super.readAsDataURL(blob)
    })
  }

  public readAsText (blob: Blob, encoding?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.onload = () => resolve(this.result as string)
      this.onerror = () => reject(this.error)
      super.readAsText(blob, encoding)
    })
  }
}
