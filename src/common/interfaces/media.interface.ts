export interface IUploadFile {
  path: string;
  contentType: string;
  media: Buffer;
  extension: string;
  name?: string;
  key?: string;
}
